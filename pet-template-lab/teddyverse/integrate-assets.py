#!/usr/bin/env python3
"""Dry-run-first offline integration of the TeddyVerse-72-Final artwork package.

Requires a separately extracted, isolated TeddyVerse static build and the complete
Dropbox handoff folder present locally. Does NOT access GitHub, Vercel, or RosieVerse.

Examples:
  python TeddyVerse-Asset-Integrator.py --package '/path/TeddyVerse-72-Final' --site '/path/private-TeddyVerse/dist' --report audit.json
  python TeddyVerse-Asset-Integrator.py --package '/path/TeddyVerse-72-Final' --site '/path/private-TeddyVerse/dist' --apply --confirm-isolated
"""
import argparse
import hashlib
import io
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    Image = None

SPECIAL_QR_HOLLOW = {
    'qr.frame-seated': 'qr-atelier/rosie-qr/rosie-frame-seated-hollow.png',
    'qr.frame-presenting': 'qr-atelier/rosie-qr/rosie-frame-presenting-hollow.png',
}

# Different current runtime entries: the published catalog refers to older images.
# Deliberately flag them, rather than replacing the current design without review.
ACTIVE_ART_MISMATCHES = {
    'home.nav-calculations': 'assets/resources/calculations-turquoise-transparent.webp',
    'home.nav-reviews': 'assets/resources/reviews-crimson-transparent.webp',
    'qr.frame-blank': 'qr-atelier/rosie-qr/rosie-frame-blank-hollow.png',
}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def read_image_size(data):
    if Image is None:
        return None
    try:
        with Image.open(io.BytesIO(data)) as im:
            return [im.width, im.height]
    except Exception:
        return None


def render_asset(data, out_path, existing_hollow=None):
    """Return bytes in destination extension. Do not rename PNG bytes to .webp."""
    ext = out_path.suffix.lower()
    if ext == '.svg':
        if b'<svg' not in data[:500]:
            raise ValueError(f'Not an SVG: {out_path}')
        return data
    if Image is None:
        raise RuntimeError('Pillow required for bitmap conversion: pip install Pillow')
    with Image.open(io.BytesIO(data)) as image:
        image.load()
        if ext == '.png':
            converted = image.convert('RGBA') if image.mode in ('RGBA', 'LA', 'P') else image.convert('RGB')
            if existing_hollow is not None:
                with Image.open(io.BytesIO(existing_hollow)) as mask_image:
                    mask = mask_image.convert('RGBA')
                    if mask.size != converted.size:
                        raise ValueError('QR hollow alpha mask has different dimensions')
                    # Preserve the exact original QR aperture and cutout transparency.
                    from PIL import ImageChops
                    alpha = ImageChops.darker(mask.getchannel('A'), converted.convert('RGBA').getchannel('A'))
                    converted = converted.convert('RGBA')
                    converted.putalpha(alpha)
        elif ext in ('.jpg', '.jpeg'):
            transparent = image.convert('RGBA')
            ground = Image.new('RGB', transparent.size, (255, 255, 255))
            ground.paste(transparent, mask=transparent.getchannel('A'))
            converted = ground
        elif ext == '.webp':
            converted = image.convert('RGBA') if 'A' in image.getbands() or image.info.get('transparency') is not None else image.convert('RGB')
        else:
            raise ValueError(f'Unsupported target format: {ext}')
        with io.BytesIO() as target:
            if ext == '.webp':
                converted.save(target, format='WEBP', quality=96, method=6, alpha_quality=100)
            elif ext in ('.jpg', '.jpeg'):
                converted.save(target, format='JPEG', quality=96, subsampling=0, optimize=True)
            else:
                converted.save(target, format='PNG', optimize=True)
            return target.getvalue()


def safe_under(root, relative):
    rel = Path(relative)
    if rel.is_absolute() or '..' in rel.parts:
        raise ValueError(f'Unsafe relative file path: {relative}')
    full = (root / rel).resolve()
    if not full.is_relative_to(root.resolve()):
        raise ValueError(f'File escapes isolated build: {relative}')
    return full


def protect_flagship(site):
    for ancestor in (site, *site.parents):
        # Never apply in the linked public Rosie-App working tree, including dist.
        config = ancestor / '.git' / 'config'
        if config.is_file():
            body = config.read_text(encoding='utf8', errors='ignore')
            if re.search(r'Sizzle505/Rosie-App|github\.com[:/]Sizzle505/Rosie-App', body, re.I):
                raise ValueError('Refusing to mutate a Rosie-App Git working tree')
    if 'rosie-app-git' in str(site).lower():
        raise ValueError('Refusing to modify a path named rosie-app-git')


def main():
    a = argparse.ArgumentParser(description=__doc__)
    a.add_argument('--package', type=Path, required=True, help='Directory containing manifest/export-manifest.json and assets/')
    a.add_argument('--site', type=Path, required=True, help='Isolated TeddyVerse dist/ folder')
    a.add_argument('--report', type=Path, help='Write audit JSON here')
    a.add_argument('--apply', action='store_true', help='Modify the isolated dist; default is read-only audit')
    a.add_argument('--confirm-isolated', action='store_true', help='Required with --apply')
    args = a.parse_args()

    pack, site = args.package.resolve(), args.site.resolve()
    manifest_file = pack / 'manifest' / 'export-manifest.json'
    if not manifest_file.is_file():
        a.error(f'Missing package manifest: {manifest_file}')
    manifest = json.loads(manifest_file.read_text(encoding='utf8'))
    slots = manifest.get('slots', [])
    if len(slots) != 72 or len({x['slot_id'] for x in slots}) != 72:
        a.error('Package does not contain the expected 72 unique slots')

    if not (site / 'index.html').is_file():
        a.error(f'No dist/index.html at {site}; provide isolated extracted build, not the production repo')
    index = (site / 'index.html').read_text(encoding='utf8', errors='ignore')
    if 'TeddyVerse' not in index:
        a.error('HTML lacks TeddyVerse signature; refusing to inspect or modify an unverified build')
    protect_flagship(site)
    if args.apply and not args.confirm_isolated:
        a.error('To apply changes, explicitly add --confirm-isolated')

    results, operations = [], []
    problems = []
    for slot in slots:
        sid = slot['slot_id']
        supplied = safe_under(pack / 'assets', slot['exported_filename'])
        destination = safe_under(site, slot['source_path'].removeprefix('public/'))
        if not supplied.is_file():
            problems.append(f'Export missing: {sid} -> {supplied.name}')
            results.append({'slot': sid, 'error': 'missing_export'})
            continue
        raw = supplied.read_bytes()
        hash_match = sha256(raw) == slot['sha256']
        if not hash_match:
            problems.append(f'Export SHA256 mismatch: {sid}')
        dimensions = read_image_size(raw)
        expected_dimensions = slot.get('dimensions_final')
        if expected_dimensions and dimensions != expected_dimensions:
            problems.append(f'Export dimensions mismatch: {sid} {dimensions} != {expected_dimensions}')
        source_exists = destination.exists()
        current_hash = sha256(destination.read_bytes()) if source_exists else None
        current_is_original = current_hash == slot.get('sha256_original')
        current_is_export = current_hash == slot['sha256']
        extension_differs = supplied.suffix.lower() != destination.suffix.lower()
        alt_path = ACTIVE_ART_MISMATCHES.get(sid)
        alternate_exists = (site / alt_path).exists() if alt_path else None
        result = dict(slot=sid, page=slot['page'], exported=supplied.name,
                      source=slot['source_path'].removeprefix('public/'), exists=source_exists,
                      current_is_original=current_is_original, current_matches_export=current_is_export,
                      export_hash_verified=hash_match, dimensions=dimensions,
                      format_conversion_needed=extension_differs, approval=slot.get('approval_status'),
                      different_active_runtime_path=alt_path, active_runtime_path_exists=alternate_exists)
        results.append(result)
        if hash_match and (not expected_dimensions or dimensions == expected_dimensions):
            operations.append((sid, raw, destination, None))
            if sid in SPECIAL_QR_HOLLOW:
                hollow_path = safe_under(site, SPECIAL_QR_HOLLOW[sid])
                if hollow_path.is_file():
                    operations.append((sid + '.hollow-QR', raw, hollow_path, hollow_path.read_bytes()))
                else:
                    problems.append(f'Missing original QR hollow aperture for {sid}: {hollow_path.relative_to(site)}')

    if len(operations) < 72:
        problems.append('Not all 72 base assets can be safely applied')
    summary = {'mode': 'apply' if args.apply else 'dry_run', 'package': str(pack), 'site': str(site),
               'slots': len(slots), 'verified_exports': sum(x.get('export_hash_verified', False) for x in results),
               'originals_still_present': sum(x.get('current_is_original', False) for x in results),
               'already_export_exact': sum(x.get('current_matches_export', False) for x in results),
               'different_format': sum(x.get('format_conversion_needed', False) for x in results),
               'source_files_missing': sum(not x.get('exists', False) for x in results),
               'runtime_path_discrepancies': [x['slot'] for x in results if x.get('different_active_runtime_path')],
               'latest_versions_unapproved_in_handoff': [x['slot'] for x in results if x.get('approval') != 'approved'],
               'issues': problems, 'entries': results}
    if args.apply:
        if problems:
            a.error('Unsafe to apply: ' + '; '.join(problems[:8]))
        backup = site.parent / ('TeddyVerse-Asset-Backup-' + datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%SZ'))
        staged = []
        try:
            for sid, source_bytes, dest, original_hollow in operations:
                new_bytes = render_asset(source_bytes, dest, original_hollow)
                staged.append((sid, dest, new_bytes))
        except Exception as exc:
            a.error(f'Conversion failed before any file was changed: {exc}')
        for sid, dest, content in staged:
            if dest.is_file() and sha256(dest.read_bytes()) == sha256(content):
                continue
            if dest.is_file():
                previous = safe_under(backup, str(dest.relative_to(site)))
                previous.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(dest, previous)
            dest.parent.mkdir(parents=True, exist_ok=True)
            temporary = dest.with_name(dest.name + '.teddyverse-partial')
            temporary.write_bytes(content)
            os.replace(temporary, dest)
        summary['backup_directory'] = str(backup)
        summary['files_installed_or_checked'] = len(staged)
        # Authoritative deployed QA must still verify images and all page routes.
        summary['requires_browser_visual_QA'] = True

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(summary, indent=2) + '\n', encoding='utf8')
    print(json.dumps({k:v for k,v in summary.items() if k not in ('entries',)}, indent=2))
    if problems:
        sys.exit(2)

if __name__ == '__main__':
    main()