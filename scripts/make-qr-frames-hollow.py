#!/usr/bin/env python3
"""Create real alpha-hollow Rosie QR frame assets from the unchanged original art.

The original image provides Rosie's face, ornament and exact inner gold rim.
Only the region INSIDE the measured original (unscaled) aperture is removed.
10% enlargement applies to the separate jeweled background, NEVER the cutout.
"""
from pathlib import Path
import re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / "public/qr-atelier/rosie-qr"
JSX = (ROOT / "src/RosieQrAtelier.jsx").read_text()
SCALE = 4
NAMES = ("seated", "presenting", "peeking", "blank")

for name in NAMES:
    match = re.search(
        r'[{]id:"' + re.escape(name) + r'".*?openingPath:"(M[^"]+)"',
        JSX,
    )
    if not match:
        raise RuntimeError(f"Missing original aperture geometry for {name}")
    points = [(int(x), int(y)) for x, y in re.findall(r'([0-9]+),([0-9]+)', match.group(1))]
    if len(points) < 20:
        raise RuntimeError(f"Invalid inner opening for {name}")
    original = Image.open(FRAMES / f"rosie-frame-{name}.webp").convert("RGBA")
    w, h = original.size
    if (w, h) != (1448, 1086):
        raise RuntimeError(f"Unexpected frame size: {name}: {w} x {h}")

    # Exact original aperture; do NOT multiply these points by 1.1.
    high = Image.new("L", (w*SCALE, h*SCALE), 0)
    draw = ImageDraw.Draw(high)
    draw.polygon([(x*SCALE,y*SCALE) for x,y in points], fill=255)
    hole = high.resize((w,h), Image.Resampling.LANCZOS)
    inside = np.asarray(hole, dtype=np.uint8)
    original_px = np.array(original, dtype=np.uint8)
    rgba = original_px.copy()
    # Use a pixel mask rather than a runtime SVG: ensures genuinely transparent
    # holes even for previously white/gray matte pixels.
    rgba[:,:,3] = (
        original_px[:,:,3].astype(np.uint16) * (255-inside.astype(np.uint16)) // 255
    ).astype(np.uint8)

    # Clean the low-opacity, neutral-color fringe from the original matte,
    # but never remove saturated gold detail from the outer ornament.
    fringe = np.asarray(hole.filter(ImageFilter.MaxFilter(15)),dtype=np.uint8) > 0
    fringe &= inside < 20
    rgb = original_px[:,:,:3].astype(np.int16)
    chroma = np.max(rgb,axis=2)-np.min(rgb,axis=2)
    neutral_matte = (chroma < 32) & (np.min(rgb,axis=2) > 112)
    rgba[:,:,3][fringe & neutral_matte] = 0

    # The originals also have a very thin neutral matte halo against the inner
    # lip. Identify the actual connected transparent opening, then clear only
    # neutral-color remnants immediately adjacent to it. Saturated gilding,
    # shadows and Rosie's details stay untouched.
    cx, cy = {
        "seated": (941, 492), "presenting": (962, 500),
        "peeking": (829, 531), "blank": (722, 496)
    }[name]
    hole_candidates = Image.fromarray(
        (rgba[:,:,3] < 25).astype(np.uint8)*255, "L"
    ).copy()
    ImageDraw.floodfill(hole_candidates, (cx, cy), 128, thresh=0)
    actual_hole = np.asarray(hole_candidates) == 128
    if int(actual_hole.sum()) < 150000:
        raise RuntimeError(f"{name}: could not isolate transparent oval")
    ring_fringe = np.asarray(
        Image.fromarray((actual_hole.astype(np.uint8)*255), "L")
        .filter(ImageFilter.MaxFilter(35))
    ) > 0
    source_rgb = original_px[:,:,:3].astype(np.int16)
    matte_neutral = (
        (np.max(source_rgb,axis=2)-np.min(source_rgb,axis=2)<35)
        & (np.min(source_rgb,axis=2)>115)
    )
    halo = ring_fringe & matte_neutral & ~actual_hole & (rgba[:,:,3]>0)
    rgba[:,:,3][halo] = 0
    print(f"MATTE {name}: removed {int(halo.sum())} residual edge pixels")

    # Remove hidden RGB garbage from completely transparent pixels.
    rgba[rgba[:,:,3] == 0,:3] = 0
    dest = FRAMES / f"rosie-frame-{name}-hollow.webp"
    Image.fromarray(rgba,"RGBA").save(dest,"WEBP",lossless=True,method=6)

    # Fail loudly if inside-center matte survived, and validate preserved art.
    from PIL import Image as _Image
    test = np.asarray(_Image.open(dest).convert("RGBA"))
    cx,cy = {
       "seated":(941,492),"presenting":(962,500),
       "peeking":(829,531),"blank":(722,496)
    }[name]
    if test[cy,cx,3] != 0:
        raise RuntimeError(f"{name}: central matte still opaque")
    if np.count_nonzero(test[:,:,3]>245) < 120000:
        raise RuntimeError(f"{name}: lost too much of the original gold/Rosie art")
    print(f"HOLLOW {name}: {dest.stat().st_size} bytes, center alpha={test[cy,cx,3]}, original artwork preserved")

print("DONE: four genuinely transparent hollow frame assets")
