#!/usr/bin/env python3
"""Make prominent, transparent geological formations from actual original Ember PNGs.

Unlike the repeatable contact material in derive-ember-og-edges.py, these are
INDIVIDUAL original rock/root clusters placed at distinct world coordinates.
They are NOT background tiles or generated replacement rocks.
"""
from __future__ import annotations
import hashlib
import io
import json
import math
import statistics
import sys
import zipfile
from pathlib import Path
from PIL import Image

OUT = Path("public/ember-drill/edge/formation")
OUT.mkdir(parents=True, exist_ok=True)
archive = Path(sys.argv[1] if len(sys.argv)>1 else "/tmp/EmberOGAssets.zip")
z = zipfile.ZipFile(archive)
entries = {Path(n).name:n for n in z.namelist()}
made = []
SIZE_LIMIT = 660
SOURCE_DESCRIPTIONS = {
    "20 - Cavern Ceiling Overlay.png": "rich hanging rock, roots and amber lantern formations",
    "21 - Crystal Floor Overlay.png": "rising ruby crystal strata, ore, stones, rubble",
    "14 - Hanging Roots.png": "thick original forest root branching and fine tendrils",
    "32 - Dynamic Tunnel Edge A.png": "OG Barkroot flat native geological profiles",
    "33 - Dynamic Tunnel Edge B.png": "OG first sloped natural tunnel profile",
    "34 - Dynamic Tunnel Edge C.png": "OG second sloped natural tunnel profile",
    "35 - Dynamic Tunnel Edge D.png": "OG richly rooted alternate cut faces",
    "36 - Dynamic Tunnel Edge E.png": "OG alternate sculpted cut faces",
}
def load(name):
    path = entries[name]
    raw = z.read(path)
    return Image.open(io.BytesIO(raw)).convert("RGBA"),hashlib.sha256(raw).hexdigest()
def occupied_line(image, side, xlo, xhi, source):
    # Deterministic alpha contour, robust against stray translucent effects.
    a=image.getchannel("A")
    xs=range(xlo+15,min(xhi-15,image.width),12)
    ys=[]
    for x in xs:
        if side=="ceiling":
            end = 465 if source.startswith("20 - ") else 365
            found = [y for y in range(25,min(image.height,end),4)
                     if a.getpixel((x,y)) >= 108]
            ys.append(max(found) if found else 195)
        else:
            begin = 145 if source.startswith("21 - ") else 365
            found=[y for y in range(begin,min(image.height,700),4)
                   if a.getpixel((x,y)) >= 108]
            ys.append(min(found) if found else 505)
    return int(statistics.median(ys))
def formation(name, source, side, x0, x1, suffix, max_depth=286):
    image,digest=load(source)
    bound=occupied_line(image,side,x0,x1,source)
    # Reserve a short 12-18px native inward extent so actual roots/crystals
    # can project just past the structural cut face; outside stays substantial.
    allowance=26 if side=="ceiling" else 24
    if side=="ceiling":
        hi=min(image.height,bound+allowance)
        lo=max(0,hi-max_depth)
    else:
        lo=max(0,bound-allowance)
        hi=min(image.height,lo+max_depth)
    cropped=image.crop((x0,lo,x1,hi))
    if cropped.width>SIZE_LIMIT:
        neww=SIZE_LIMIT;newh=round(cropped.height*neww/cropped.width)
        cropped=cropped.resize((neww,newh),Image.Resampling.LANCZOS)
    w,h=cropped.size
    pixels=cropped.load()
    # Air is alpha: do not substitute opaque dirt or artificial backgrounds.
    # Feather ONLY the horizontal extremities of each non-repeating cluster;
    # preserve the entire natural inward rock silhouette vertically.
    taper=max(15,round(w*.115))
    for x in range(w):
        edge=min(x,w-1-x)
        fade=min(1,edge/taper)
        fade=fade*fade*(3-2*fade)
        for y in range(h):
            r,g,b,a=pixels[x,y]
            if a<=4: pixels[x,y]=(0,0,0,0)
            elif fade<.999: pixels[x,y]=(r,g,b,round(a*fade))
    cropped.save(OUT/(name+".webp"),"WEBP",quality=94,method=6,exact=True)
    made.append({
        "name":name+".webp",
        "source":source,"sourceSha256":digest,
        "crop":[x0,lo,x1,hi],"size":[w,h],"orientation":side,
        "anchor":"ceiling: alpha nose 12-18px into corridor, rest outward; floor: alpha tips max 12-18px into corridor",
        "edits":"original pixels only; intact natural alpha silhouettes, isolated source contact, horizontal alpha feather, Lanczos WebP",
        "role":"nonrepeating large sculptural cliff/root/crystal formation; register to local tunnel tangent and outward normal"
    })
    print(name,source,"boundary",bound,"crop",(x0,lo,x1,hi),"output",w,h)
# Mixed NONREPEATING transparent original artwork. Each is world anchored.
formation("hanging-canopy-a","20 - Cavern Ceiling Overlay.png","ceiling",90,770,"a",360)
formation("hanging-canopy-b","20 - Cavern Ceiling Overlay.png","ceiling",760,1440,"b",360)
formation("hanging-canopy-c","20 - Cavern Ceiling Overlay.png","ceiling",1410,2110,"c",360)
formation("rising-crystal-a","21 - Crystal Floor Overlay.png","floor",60,780,"a",370)
formation("rising-crystal-b","21 - Crystal Floor Overlay.png","floor",750,1510,"b",370)
formation("rising-crystal-c","21 - Crystal Floor Overlay.png","floor",1420,2110,"c",370)
formation("rich-roof-a","35 - Dynamic Tunnel Edge D.png","ceiling",140,890,"a",312)
formation("rich-roof-b","36 - Dynamic Tunnel Edge E.png","ceiling",1090,1880,"b",312)
formation("rich-floor-a","35 - Dynamic Tunnel Edge D.png","floor",850,1650,"a",327)
formation("rich-floor-b","36 - Dynamic Tunnel Edge E.png","floor",170,960,"b",327)
formation("slope-roof-a","33 - Dynamic Tunnel Edge B.png","ceiling",320,1140,"a",318)
formation("slope-roof-b","34 - Dynamic Tunnel Edge C.png","ceiling",1150,1980,"b",318)
formation("slope-floor-a","33 - Dynamic Tunnel Edge B.png","floor",1050,1890,"a",340)
formation("slope-floor-b","34 - Dynamic Tunnel Edge C.png","floor",150,1000,"b",340)
# Standalone real root clusters. Keep thick trunks, root hairs, and transparency.
root,digest=load("14 - Hanging Roots.png")
for idx,(left,right) in enumerate(((100,665),(650,1190)),1):
    # Original root crown starts at y~180 and roots reach ~880.
    im=root.crop((left,180,right,885))
    im.thumbnail((410,480),Image.Resampling.LANCZOS)
    w,h=im.size
    pixels=im.load()
    taper=round(w*.095)
    for x in range(w):
        fade=min(1,x/max(1,taper),(w-1-x)/max(1,taper))
        fade=fade*fade*(3-2*fade)
        if fade>=1:continue
        for y in range(h):
            r,g,b,a=pixels[x,y];pixels[x,y]=(r,g,b,round(a*fade))
    name=f"original-roots-{idx}"
    im.save(OUT/(name+".webp"),"WEBP",quality=94,method=6,exact=True)
    made.append({"name":name+".webp","source":"14 - Hanging Roots.png","sourceSha256":digest,"crop":[left,180,right,885],
        "size":[w,h],"orientation":"ceiling","anchor":"tendrils register behind collision lip; fringe only just inside safe channel",
        "edits":"crop and resize source alpha, feather only horizontal ends; no invented roots",
        "role":"standalone substantial hanging root relief"})
record={
 "originalArchive":"/Rosie-App-Transfer/Timekeepers Asset Pack - Midnight Observatory/EmberOGAssets.zip",
 "originalArchiveBytes":72255395,
 "strategy":"real OG-asset scene dressing: structural continuous cut face below infrequent LARGE independent alpha formations, never replace with thin texture",
 "collision":"main ribbon v=0 unchanged; ornamental tips limited to <18 units into playable channel",
 "noRepeats":"explicit spaced world landmark placements, no tilePattern on formation images",
 "assets":made,
}
OUT.joinpath("formations.json").write_text(json.dumps(record,indent=2)+"\n")
print("OG FORMATIONS: "+str(len(made))+" separated sculptural assets.")
