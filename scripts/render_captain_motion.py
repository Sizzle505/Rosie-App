#!/usr/bin/env python3
"""Render periodic image-registered waves from the existing Captain Rosie paintings.

Offline (CI) process: painting pixels and foam are warped locally below the
original shoreline. No water simulation, WebGL or per-frame JS runs on device.
"""
import argparse
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "captain-motion"
PAINTINGS = {
    "portrait": (ROOT / "public/captain-sakura-course-portrait.webp", 720, .413),
    "wide": (ROOT / "public/captain-sakura-course-wide.webp", 1280, .530),
}


def save_atmosphere(original, key, horizon):
    h, w = original.shape[:2]
    hsv = cv2.cvtColor(original, cv2.COLOR_RGB2HSV)
    yy = np.arange(h, dtype=np.float32)[:, None] / h
    xx = np.arange(w, dtype=np.float32)[None, :] / w
    sat = hsv[:, :, 1].astype(np.float32) / 255
    bright = hsv[:, :, 2].astype(np.float32) / 255
    sides = np.clip((xx - .025) / .09, 0, 1) * np.clip((.975 - xx) / .09, 0, 1)

    # Only original pale brushstrokes from the mountain mist, never invented rocks.
    band = np.clip((yy - .14) / .12, 0, 1) * np.clip((horizon + .02 - yy) / .12, 0, 1)
    mist = band * sides * np.clip((bright - .52) * 2.4, 0, 1) * np.clip((.62 - sat) * 2.0, 0, 1)
    mist = cv2.GaussianBlur(mist, (0, 0), sigmaX=w * .008, sigmaY=h * .006)
    mist_alpha = np.uint8(np.clip(mist * .57, 0, .40) * 255)
    Image.fromarray(np.dstack((original, mist_alpha))).save(
        ASSETS / f"captain-{key}-mist.webp", format="WEBP", quality=86, method=6)

    # Only luminous portions of original sky cloud painting. Feather all edges.
    sky = np.clip((yy - .012) / .09, 0, 1) * np.clip((.31 - yy) / .12, 0, 1)
    luminous = np.clip((bright - .55) * 2.4, 0, 1) * np.clip((sat - .16) * 2.0, 0, 1)
    cloud = sky * sides * luminous
    cloud = cv2.GaussianBlur(cloud, (0, 0), sigmaX=w * .006, sigmaY=h * .006)
    cloud_alpha = np.uint8(np.clip(cloud * .26, 0, .24) * 255)
    Image.fromarray(np.dstack((original, cloud_alpha))).save(
        ASSETS / f"captain-{key}-cloud.webp", format="WEBP", quality=86, method=6)


def frame_at(painting, x, y, horizon, cycle):
    h, w = painting.shape[:2]
    theta = 2 * np.pi * cycle
    depth = np.clip((y / h - horizon) / (1 - horizon), 0, 1) ** .9
    fade = np.clip((y / h - horizon) / .028, 0, 1)
    fade *= fade * (3 - 2 * fade)
    xx = x / w
    yy = y / h
    a = 2 * np.pi * (yy * 11.8 + xx * .88) - theta
    b = 2 * np.pi * (yy * 19.1 - xx * 1.33) + 2 * theta
    c = 2 * np.pi * (xx * 4.2 + yy * 3.8) + theta
    dx = fade * depth * (5.4 * np.sin(a) + 2.7 * np.sin(b) + 1.65 * np.sin(c))
    dy = fade * depth * (3.45 * np.sin(a + .8) + 1.8 * np.sin(b - .4) + 1.2 * np.sin(c))
    moving = cv2.remap(painting, (x + dx).astype(np.float32),
                       (y + dy).astype(np.float32),
                       cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    # Modulate only colors that are already painted gold and already moving.
    out = moving.astype(np.float32)
    red, green, blue = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    golden = np.clip((red - green * .97 - 3) / 55, 0, 1) * np.clip((green - blue * .95) / 60, 0, 1)
    shimmer = (.48 * np.sin(theta + 2 * np.pi * (yy * 16 + xx * 3.7))
               + .30 * np.sin(2 * theta - 2 * np.pi * (yy * 25 - xx * 1.9))
               + .22 * np.sin(theta + 2 * np.pi * (yy * 6 + xx * 6.2)))
    out *= (1 + golden * fade * (.043 * shimmer))[:, :, None]
    return np.uint8(np.clip(out, 0, 255))


def render(name, path, width, horizon, seconds, fps):
    painting = Image.open(path).convert("RGB")
    height = 2 * round((painting.height * width / painting.width) / 2)
    pixels = np.array(painting.resize((width, height), Image.Resampling.LANCZOS))
    h, w = pixels.shape[:2]
    x, y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    filename = ASSETS / f"captain-{name}-water.mp4"
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
               "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
               "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264",
               "-preset", "medium", "-crf", "25", "-pix_fmt", "yuv420p",
               "-movflags", "+faststart", "-r", str(fps), str(filename)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    count = round(seconds * fps)
    try:
        for i in range(count):
            process.stdin.write(frame_at(pixels, x, y, horizon, i / count).tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f"Video rendering failed for {name}")
    # VP9 prevents Chromium/Playwright systems without licensed H.264 decoding
    # from showing a static ocean while the video clock advances.
    webm = ASSETS / f"captain-{name}-water.webm"
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(filename),
         "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "28",
         "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", str(webm)],
        check=True
    )
    save_atmosphere(pixels, name, horizon)
    a = frame_at(pixels, x, y, horizon, 0)
    b = frame_at(pixels, x, y, horizon, .2)
    region = np.s_[round(h * (horizon + .06)):, :, :]
    channel_delta = np.mean(np.abs(a[region].astype(np.float32) - b[region].astype(np.float32)))
    if channel_delta < 3:
        raise RuntimeError(f"Water is insufficiently animated: {channel_delta:.2f}")
    print(f"{name}: {w}x{h}, {seconds}s x {fps}fps, mp4={filename.stat().st_size} bytes, webm={webm.stat().st_size} bytes, delta={channel_delta:.2f}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seconds", type=float, default=10)
    parser.add_argument("--fps", type=int, default=15)
    args = parser.parse_args()
    ASSETS.mkdir(parents=True, exist_ok=True)
    for name, (path, width, horizon) in PAINTINGS.items():
        render(name, path, width, horizon, args.seconds, args.fps)


if __name__ == "__main__":
    main()
