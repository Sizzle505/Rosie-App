#!/usr/bin/env python3
"""Derive *deployable* alpha cut faces from the unchanged EmberOG #32 master.

Source must be the 72,255,395-byte Dropbox OG archive. Never use contact
thumbnails, screenshots, 480px old fragments, or invented geological strips.
The output is a cropped/registered Barkroot material, NOT a scenic panorama.
"""
import hashlib
import io
import json
import math
import statistics
import sys
import zipfile
from pathlib import Path
from PIL import Image

OG_SHA32 = "62a2bf9091e2f134a617dac59f571c29fd93d233fc539d64136a414639fd3726"
OG_NAME32 = "32 - Dynamic Tunnel Edge A.png"
OUT = Path("public/ember-drill/edge")
WIDTH, DEPTH = 2048, 120
TILE_FEATHER = 148
# In the native composition, terrain occupies upper and lower portions;
# a transparent air corridor divides them. Do not treat the native alpha
# contour as a drop-in repeating terrain texture.
AIR_START = 360


def smooth_robust(values):
    radius = 11
    medians = [
        int(statistics.median(values[max(0, i-radius):min(len(values), i+radius+1)]))
        for i in range(len(values))
    ]
    return [
        round(sum(medians[max(0, i-4):min(len(values), i+5)]) /
              len(medians[max(0, i-4):min(len(values), i+5)]))
        for i in range(len(values))
    ]


def contact_profiles(img):
    a = img.getchannel("A").load()
    w, h = img.size
    top, bottom = [], []
    for x in range(w):
        upper = [y for y in range(0, min(AIR_START, h)) if a[x, y] >= 105]
        lower = [y for y in range(max(AIR_START + 24, h//2), h) if a[x, y] >= 105]
        top.append(max(upper) if upper else 110)
        bottom.append(min(lower) if lower else h - 110)
    return smooth_robust(top), smooth_robust(bottom)


def make_strip(source, native_contact, kind):
    src = source.load()
    sw, sh = source.size
    out = Image.new("RGBA", (WIDTH, DEPTH))
    dst = out.load()
    top = kind == "ceiling"
    yscale = 1.18
    # Normalized material: each native column is measured from its own real
    # illustrated air contact. The resulting y=0 edge is registered to the
    # engine's collision surface, and outward rows blend into the cave art.
    for x in range(WIDTH):
        sx = min(sw - 1, int(x * sw / WIDTH))
        surface = native_contact[sx]
        for v in range(DEPTH):
            sy = round(surface + (-1 if top else 1) * (v + 1) * yscale)
            sy = min(sh - 1, max(0, sy))
            r, g, b, a = src[sx, sy]
            if v > 79:
                progress = min(1, (v - 79) / 39)
                a = round(a * (1 - progress)**1.6)
            dst[x, v] = (r, g, b, a)

    # Deliberately heal the left/right seam in ORIGINAL painted pixels. The
    # source has no periodic tile guarantee. Blend each end to the exact same
    # per-row premultiplied endpoint while preserving the central 85% intact.
    for v in range(DEPTH):
        ar = dst[0, v]
        br = dst[WIDTH - 1, v]
        anchor = tuple(round((ar[k] + br[k])/2) for k in range(4))
        for i in range(TILE_FEATHER):
            t = (1 - i / TILE_FEATHER)**2
            for x in (i, WIDTH - i - 1):
                p = dst[x, v]
                dst[x, v] = tuple(round(p[k]*(1-t) + anchor[k]*t) for k in range(4))
        dst[0, v] = anchor
        dst[WIDTH - 1, v] = anchor
    return out


def manifest_for(img, kind, edge_range):
    pixels = img.load()
    seam = sum(abs(pixels[0,y][c] - pixels[WIDTH-1,y][c])
               for y in range(DEPTH) for c in range(4)) / (DEPTH * 4)
    alpha0 = sum(pixels[x,0][3] for x in range(WIDTH))/WIDTH
    alphaend = sum(pixels[x,DEPTH-1][3] for x in range(WIDTH))/WIDTH
    name = f"barkroot-{ 'top' if kind == 'ceiling' else 'bottom' }.webp"
    return {
        "name": name,
        "path": f"/ember-drill/edge/{name}",
        "source": OG_NAME32,
        "archiveSource": "04 - Barkroot and Dynamic Tunnel Artwork/" + OG_NAME32,
        "sourceSha256": OG_SHA32,
        "size": [WIDTH, DEPTH],
        "role": kind,
        "anchor": "v=0 at collision boundary, U=continuous world arc length * 0.94",
        "visibleOriginalContourRows": list(edge_range),
        "edits": "alpha-cut upper/lower silhouette, per-column air contour registration, 148px bidirectional endpoint seam repair, alpha feather after outward pixel 79, optimized WebP",
        "tileTest": "3x horizontal repetition; L/R RGBA mean absolute error " + str(round(seam,4)),
        "seamError": round(seam,4),
        "alphaAtV0Mean": round(alpha0,2),
        "alphaAtV119Mean": round(alphaend,2),
        "safeInwardProtrusion": 0,
        "drawLayer": "world-arc cut faces above scenery, below pickups/hazards/vehicle",
        "expectedScene": "Barkroot representative prototype at flat, climb and dive; not yet Ruby or Temple",
        "replaces": "legacy earth textures as dominant structural tunnel edge"
    }


def main():
    archive = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/EmberOGAssets.zip")
    with zipfile.ZipFile(archive) as z:
        matches = [n for n in z.namelist() if n.endswith("/" + OG_NAME32)]
        assert len(matches) == 1, f"Expected one original #{OG_NAME32}, found {matches}"
        raw = z.read(matches[0])
    digest = hashlib.sha256(raw).hexdigest()
    assert digest == OG_SHA32, f"OG original failed manifest SHA: {digest}"
    source = Image.open(io.BytesIO(raw)).convert("RGBA")
    assert source.size == (2172,724), source.size
    top, bottom = contact_profiles(source)
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    for kind, contour in (("ceiling", top), ("floor",bottom)):
        material = make_strip(source, contour, kind)
        tag = "top" if kind == "ceiling" else "bottom"
        output = OUT / f"barkroot-{tag}.webp"
        material.save(output, "WEBP", lossless=True, method=6, exact=True)
        records.append(manifest_for(material, kind, (min(contour),max(contour))))
        print(output, output.stat().st_size, records[-1]["tileTest"],
              "air contact alpha", records[-1]["alphaAtV0Mean"],
              "outer alpha", records[-1]["alphaAtV119Mean"])
        repeat = Image.new("RGBA", (WIDTH*3, DEPTH))
        for i in range(3):
            repeat.alpha_composite(material, (WIDTH*i, 0))
        repeat.save(OUT / f"seam-audit-{tag}.png", optimize=True)
    document = {
        "sourceArchive": "Dropbox /Rosie-App-Transfer/Timekeepers Asset Pack - Midnight Observatory/EmberOGAssets.zip",
        "sourceArchiveBytes": 72255395,
        "original": OG_NAME32,
        "unmodifiedOriginalRetained": "Dropbox only; no 72MB master committed to runtime",
        "prototypeGate": "Barkroot only; approve actual iPhone flat/climb/dive before variants/Ruby",
        "assets": records
    }
    (OUT / "edge-assets.json").write_text(json.dumps(document,indent=2)+"\n")
    print("Derived only 2 original-source structural strips; no new dog, rock imitation or panoramic wallpaper.")


if __name__ == "__main__":
    main()
