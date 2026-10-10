#!/usr/bin/env python3
"""Extract the EXISTING illustrated Captain Rosie portrait with its navy hat intact.

Uses only public/captain-rosie-illustrated.webp. The original dog pixels
are retained; connected blue studio background regions are made transparent.
No generative substitute, repaint, or modification of Rosie's features.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SOURCE = Path("public/captain-rosie-illustrated.webp")
OUTPUT = Path("public/captain-rosie-deck.webp")

rgb = np.asarray(Image.open(SOURCE).convert("RGB"), dtype=np.uint8)
red = rgb[:, :, 0].astype(np.int16)
green = rgb[:, :, 1].astype(np.int16)
blue = rgb[:, :, 2].astype(np.int16)

# Identify studio blue by excess blue relative to red/green. Then remove
# ONLY candidate regions connected to the OUTER image boundary. This keeps
# dark blue hat-brim/scarf details enclosed within the dog silhouette.
candidate = (
    (blue - red > 15)
    & (blue - green > 3)
    & (red < 110)
    & (blue < 170)
).astype(np.uint8)
components, labels, stats, _ = cv2.connectedComponentsWithStats(candidate, 8)
border_ids = np.unique(np.concatenate((
    labels[0], labels[-1], labels[:, 0], labels[:, -1]
)))
background = np.zeros(labels.shape, dtype=bool)
for label in border_ids:
    if label and stats[label, cv2.CC_STAT_AREA] > 15:
        background |= labels == label

if background.mean() < .06 or background.mean() > .75:
    raise RuntimeError(f"Unexpected Rosie extraction coverage: {background.mean():.3f}")

# Tight, softly antialiased border, without modifying the surviving face,
# hat, ears, chest, scarf, or dark coat pixels.
alpha = np.where(background, 0, 255).astype(np.uint8)
alpha = cv2.GaussianBlur(alpha, (3, 3), .52)
rgba = np.dstack((rgb, alpha))
Image.fromarray(rgba, mode="RGBA").save(OUTPUT, "WEBP", quality=91, method=6)
verify = Image.open(OUTPUT).convert("RGBA")
assert verify.size == (rgb.shape[1], rgb.shape[0])
assert verify.getchannel("A").getextrema() == (0, 255)
print(f"Preserved actual Captain Rosie as {OUTPUT}: {OUTPUT.stat().st_size} bytes, studio removal={background.mean():.1%}")
