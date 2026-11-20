#!/usr/bin/env python3
"""Reproducible Rosie Haiku archive import. Source ZIP masters remain in Dropbox."""
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path
from PIL import Image

ROOT = Path("public/rosieverse/haiku")
SOURCES = [
 ("a","01 Grand Zen Garden Masthead.png","ornaments/masthead-grand.webp"),
 ("a","02 Compact Zen Garden Masthead.png","ornaments/masthead-compact.webp"),
 ("a","03 Imperial Rosie Paw Crest.png","ornaments/imperial-paw-crest.webp"),
 ("a","04 Shoji Activity Panel Frame.png","ornaments/shoji-frame-original.webp"),
 ("a","05 Illuminated Washi Paper.png","ornaments/washi-paper-original.webp"),
 ("a","06 Individual Activity Tabs/Daily.png","ornaments/tab-daily.webp"),
 ("a","06 Individual Activity Tabs/Compose.png","ornaments/tab-compose.webp"),
 ("a","06 Individual Activity Tabs/Meditate.png","ornaments/tab-meditate.webp"),
 ("a","06 Individual Activity Tabs/Journal.png","ornaments/tab-journal.webp"),
 ("b","11 - Field Meadow Foreground Parallax.png","living-garden/field-meadow.webp"),
 ("b","12 - Sakura Canopy Left.png","living-garden/sakura-left.webp"),
 ("b","13 - Sakura Canopy Right.png","living-garden/sakura-right.webp"),
 ("b","14 - Sakura Petal Sprite Atlas.png","living-garden/petals-atlas.webp"),
 ("b","15 - Field Sunbeam and Sun Glow Overlay.png","living-garden/field-sunbeams.webp"),
 ("b","16 - Golden Pollen and Floating Dust Overlay.png","living-garden/golden-pollen.webp"),
 ("b","17 - Zen Raked Sand Light Sweep.png","living-garden/zen-sand-sheen.webp"),
 ("b","18 - Zen Koi Water Ripple and Reflection.png","living-garden/zen-water-ripples.webp"),
 ("b","19 - Temple Hanging Sakura Lantern.png","living-garden/temple-lantern.webp"),
 ("b","20 - Meditation Breathing Halo.png","living-garden/meditation-halo-alternate.webp"),
 ("b","Bonus Refined Assets/Optional Shoji Frame Remake.png","ornaments/shoji-frame-refined.webp"),
 ("b","Bonus Refined Assets/Optional Washi Texture Remake.png","ornaments/washi-paper-refined.webp"),
 ("b","Bonus Refined Assets/R07-1 Breathe with Rosie.png","ornaments/meditation-breathe.webp"),
 ("b","Bonus Refined Assets/R07-2 Quiet Sit.png","ornaments/meditation-quiet.webp"),
 ("b","Bonus Refined Assets/R07-3 A Little Calm.png","ornaments/meditation-calm.webp"),
 ("b","Bonus Refined Assets/R07-4 Evening Unwind.png","ornaments/meditation-unwind.webp"),
 ("b","Bonus Refined Assets/R07-5 Haiku Reflection.png","ornaments/meditation-reflect.webp"),
 ("b","Bonus Refined Assets/R10 Enlightened Rosie - Full Resolution.png","ornaments/rosie-enlightened-refined.webp"),
]

def load_png(z, suffix):
    matches=[n for n in z.namelist() if n.endswith(suffix) and n.lower().endswith(".png")]
    if len(matches)!=1: raise RuntimeError(f"Expected unique {suffix}: {matches}")
    raw=z.read(matches[0])
    return raw,Image.open(io.BytesIO(raw)).convert("RGBA")

def webp(im, dest):
    dest.parent.mkdir(parents=True,exist_ok=True)
    im.save(dest,"WEBP",quality=89,method=2,exact=True)
    check=Image.open(dest)
    if check.format!="WEBP" or check.size!=im.size: raise RuntimeError(f"Invalid {dest}")
    if check.getchannel("A").getextrema()[0]==255 and im.getchannel("A").getextrema()[0]<255:
        raise RuntimeError(f"Alpha lost: {dest}")
    return dest.stat().st_size

def main(a,b):
    with zipfile.ZipFile(a) as za,zipfile.ZipFile(b) as zb:
        archives={"a":za,"b":zb}
        log=[]
        for key,filename,target in SOURCES:
            raw,im=load_png(archives[key],filename)
            size=webp(im,ROOT/target)
            log.append({"path":target,"width":im.width,"height":im.height,"bytes":size,
                        "original_sha256":hashlib.sha256(raw).hexdigest()})
            print(target,size,flush=True)
        _,atlas=load_png(zb,"14 - Sakura Petal Sprite Atlas.png")
        if atlas.size!=(888,666): raise RuntimeError("Unknown petal atlas layout")
        for i in range(12):
            x,y=i%4,i//4
            im=atlas.crop((x*222,y*222,(x+1)*222,(y+1)*222))
            target=f"living-garden/petal-{i+1:02}.webp"
            size=webp(im,ROOT/target)
            log.append({"path":target,"width":222,"height":222,"bytes":size})
        report={"source_archives":[Path(a).name,Path(b).name],
                "total_assets":len(log),"bytes":sum(v["bytes"] for v in log),"assets":log}
        (ROOT/"archive-source-manifest.json").write_text(json.dumps(report,indent=2)+"\n")
        print("Imported",len(log),"optimized images; bytes",report["bytes"])

if __name__=="__main__":
    if len(sys.argv)!=3: sys.exit("Expected two source ZIP paths")
    main(sys.argv[1],sys.argv[2])
