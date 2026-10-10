#!/usr/bin/env python3
"""Make optically tight, transparent variants of the five original RosieVerse cards.

Keep the source illustrated WebPs unchanged. The mask retains the largest bright
connected foreground and fills its enclosed artwork, removing only the exterior
dark rectangular matte. Subpixel edge feathering avoids hard raster cutoffs.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INPUT_DIR = ROOT / "public" / "rosieverse"
OUTPUT_DIR = INPUT_DIR / "buttons"
NAMES = ("fortune", "cheese", "captain", "vault", "randomizers")


def render_button(name):
    original = INPUT_DIR / f"{name}.webp"
    with Image.open(original) as source:
        rgb = np.array(source.convert("RGB"))

    h, w = rgb.shape[:2]
    maximum = rgb.max(axis=2)
    saturation = maximum - rgb.min(axis=2)

    # Keep gold, blossom details and lit scenery. Remove the dark exterior mat.
    foreground = (maximum > 90) | ((maximum > 54) & (saturation > 36))
    kernel_size = max(3, int(round(min(h, w) * 0.018)) | 1)
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (kernel_size, kernel_size)
    )
    linked = cv2.morphologyEx(
        foreground.astype(np.uint8) * 255, cv2.MORPH_CLOSE, kernel
    )

    count, labels, areas, _ = cv2.connectedComponentsWithStats(linked)
    if count <= 1:
        raise RuntimeError(f"{name}: no foreground component")
    prominent = (np.argsort(areas[1:, cv2.CC_STAT_AREA])[-3:] + 1).tolist()
    linked = np.isin(labels, prominent).astype(np.uint8) * 255

    outlines, _ = cv2.findContours(
        linked, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    alpha = np.zeros((h, w), dtype=np.uint8)
    for contour in outlines:
        if cv2.contourArea(contour) > h * w * 0.005:
            cv2.drawContours(alpha, [contour], -1, 255, thickness=cv2.FILLED)
    # Smooth an approximately 1px edge at the actual phone display scale.
    alpha = cv2.GaussianBlur(alpha, (0, 0), max(1, min(h, w) * 0.004))

    covered = (alpha > 127).mean()
    if not 0.54 < covered < 0.96:
        raise RuntimeError(f"{name}: unreasonable opacity coverage {covered:.3f}")
    if alpha[h // 2, w // 2] < 240:
        raise RuntimeError(f"{name}: artwork center was masked")
    for yy, xx in ((0, 0), (0, w - 1), (h - 1, 0)):
        if alpha[yy, xx] > 24:
            raise RuntimeError(f"{name}: the exterior matte was not removed")

    rgba = np.dstack((rgb, alpha))
    target = OUTPUT_DIR / f"{name}.webp"
    Image.fromarray(rgba, mode="RGBA").save(
        target, "WEBP", quality=94, method=6, exact=True
    )
    with Image.open(target) as check:
        assert check.mode == "RGBA" and check.size == (w, h)
    print(f"{name}: {w}x{h}, coverage {covered:.1%}, {target.stat().st_size:,} bytes")


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for card in NAMES:
        render_button(card)
