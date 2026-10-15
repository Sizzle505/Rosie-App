#!/usr/bin/env python3
"""Deterministic 10-frame Turbo Canvas atlas from the EXISTING original WebP.

HTMLImageElement animations are not guaranteed to advance when drawn to Canvas
from an unattached Image. Explicit frame extraction fixes the frozen Turbo.
Only source pixels are used; no new invented vehicle or duplicate drill.
"""
from pathlib import Path
from PIL import Image, ImageSequence, ImageChops
import hashlib
import json

source=Path("public/ember-drill/turbo-animation.webp")
outdir=Path("public/ember-drill")
raw=source.read_bytes()
im=Image.open(source)
assert im.size==(960,390),im.size
assert getattr(im,"n_frames",1)==10,"Expected ten source Turbo animation frames"
crop=(344,67,960,319)
tw,th=308,126
sheet=Image.new("RGBA",(tw*5,th*2),(0,0,0,0))
all_frames=[]
for j,frame in enumerate(ImageSequence.Iterator(im)):
    rgba=frame.convert("RGBA").crop(crop)
    rgba=rgba.resize((tw,th),Image.Resampling.LANCZOS)
    sheet.alpha_composite(rgba,((j%5)*tw,(j//5)*th))
    all_frames.append(rgba)
assert len(all_frames)==10
assert any(ImageChops.difference(all_frames[0],a).getbbox() for a in all_frames[1:]),"Original animation is unexpectedly static"
out=outdir/"turbo-head-frames.webp"
sheet.save(out,"WEBP",quality=95,method=6,exact=True)
manifest={
 "source":"turbo-animation.webp",
 "sourceSha256":hashlib.sha256(raw).hexdigest(),
 "sourceFrames":10,
 "sourceFrameDurationMs":60,
 "sourceDimensions":[960,390],
 "crop":list(crop),
 "sheet":"turbo-head-frames.webp",
 "atlasFrameDimensions":[tw,th],
 "grid":[5,2],
 "fullAtlasDimensions":list(sheet.size),
 "provenance":"All ten original animated WebP frames explicitly extracted, composited and resampled from original source; no external image generation",
 "render":"Clip to rotating auger silhouette; actual playback phase is since Turbo activation, 60ms/frame",
}
(outdir/"turbo-head-frames.json").write_text(json.dumps(manifest,indent=2)+"\n")
print("TURBO ATLAS READY",out,out.stat().st_size,"bytes",manifest["sourceSha256"])
