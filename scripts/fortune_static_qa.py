#!/usr/bin/env python3
"""Non-destructive Madame Rosie source-painting registration and composite QA.

Requires Pillow. Run before integrating any rebuilt assets into the live page.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat

SIZE = (1522, 1430)
# These layers must all share the original painting's coordinate space.
# Pose variants (head down, left/right, tilt) are NOT included in static registration.
LAYERS = [
  "stage/empty-booth.webp", "stage/sky-stars-static.webp",
  "stage/crescent-moon.webp", "set/lantern-left-chain.webp",
  "set/lantern-right-chain.webp", "set/lantern-left-body.webp",
  "set/lantern-right-body.webp", "set/lantern-light-mask.webp",
  "set/curtain-left.webp", "set/curtain-right.webp",
  "props/books.webp", "props/armillary.webp",
  "props/bowl-of-treats.webp", "props/small-crystals.webp",
  "rosie/torso.webp", "rosie/head-front.webp", "rosie/cape-near.webp",
  "orb/glass-back.webp", "orb/internal-nebula.webp",
  "orb/front-reflections.webp", "rosie/raised-paw.webp",
  "orb/pedestal.webp", "set/tassel-left.webp", "set/tassel-right.webp",
  "props/stage-top-border.webp",
]
# Approximate handoff landmarks, for reviewing registration only, NOT alpha masks.
GUIDES = {
  "Rosie head": (545, 105, 1260, 790),
  "Rosie cape": (350, 565, 1320, 1400),
  "Near forepaw": (450, 730, 725, 945),
  "Orb glass": (470, 830, 1065, 1315),
  "Pedestal": (440, 1270, 1110, 1430),
  "Lantern left": (268, 210, 470, 790),
  "Lantern right": (1160, 255, 1345, 785),
  "Books": (0, 895, 425, 1395),
  "Treats": (1080, 1190, 1510, 1430),
  "Moon": (460, 200, 600, 375),
}

def read_image(path):
    image = Image.open(path).convert("RGBA")
    if image.size != SIZE:
        raise ValueError(f"{path} is {image.size}; expected {SIZE}")
    return image

def make_guides(source, dest):
    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    drawer = ImageDraw.Draw(overlay)
    for i, (name, bounds) in enumerate(GUIDES.items()):
        color = [(255,196,80,235),(96,224,241,235),(221,150,255,235)][i % 3]
        drawer.rectangle(bounds, outline=color, width=3)
        x, y, _, _ = bounds
        drawer.rectangle((x, max(0,y-24), min(SIZE[0],x+max(120,len(name)*9)), y),
                         fill=(24,9,30,200))
        drawer.text((x+5, max(0,y-20)), name, fill=color)
    Image.alpha_composite(source, overlay).convert("RGB").save(dest)

def make_comparison(source, composite, out):
    original, candidate = source.convert("RGB"), composite.convert("RGB")
    diff = ImageChops.difference(original, candidate)
    mae = sum(ImageStat.Stat(diff).mean)/3
    changed = sum(1 for v in diff.convert("L").getdata() if v > 24)
    diff.point(lambda v:min(255,v*4)).save(out/"difference-amplified.png")
    side = Image.new("RGB", (SIZE[0]*2, SIZE[1]))
    side.paste(original, (0,0))
    side.paste(candidate, (SIZE[0],0))
    side.save(out/"source-vs-composite.jpg", quality=93, subsampling=0)
    return {"mean_absolute_channel_error":round(mae,4),
            "fraction_pixels_difference_gt_24":round(changed/(SIZE[0]*SIZE[1]),6)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source",type=Path,
                        default=Path("public/rosie-fortune-stage.webp"))
    parser.add_argument("--layers",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args = parser.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    original = read_image(args.source)
    make_guides(original,args.out/"registration-guides.png")
    composed = Image.new("RGBA", SIZE, (0,0,0,0))
    missing = []
    for name in LAYERS:
        path = args.layers / name
        if not path.exists():
            missing.append(name)
        else:
            composed = Image.alpha_composite(composed, read_image(path))
    report = {"source":str(args.source), "source_size":SIZE,
              "ordered_layers":LAYERS, "missing_layers":missing,
              "static_composite_complete":not missing, "approved":False}
    if missing:
        report["reason"] = "Static registration incomplete: no animations or app integration."
    else:
        if composed.getchannel("A").getextrema()[0] != 255:
            report["warning"] = "The composite has transparent holes."
        composed.save(args.out/"registered-composite.png")
        report["difference_metrics"] = make_comparison(original,composed,args.out)
    (args.out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({"missing_count":len(missing),
                      "static_composite_complete":not missing,
                      "report":str(args.out/"report.json")},indent=2))
    if missing:
        raise SystemExit(2)

if __name__ == "__main__":
    main()
