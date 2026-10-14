from io import BytesIO
from pathlib import Path
import json, os, urllib.request
from PIL import Image, ImageFilter

dest = Path("public/ember-drill")
dest.mkdir(parents=True, exist_ok=True)
items = json.loads(os.environ["EMBER_FEATURE_URLS"])
sizes = {
    "gate": (490, 585), "lantern": (190, 250), "chest": (320, 260),
    "coin": (130, 130), "rockburst": (380, 380), "boosttrail": (390, 290),
    "crystaloverlay": (530, 420),
}
manifest = {}
for kind, url in items:
    req = urllib.request.Request(url, headers={"User-Agent": "Rosie-Asset-Importer"})
    with urllib.request.urlopen(req, timeout=90) as response:
        raw = response.read()
    img = Image.open(BytesIO(raw)).convert("RGBA")
    alpha = img.getchannel("A")
    corners = [alpha.getpixel((x, y)) for x in (0, img.width - 1) for y in (0, img.height - 1)]
    has_alpha = min(corners) < 248 or alpha.getextrema()[0] < 200
    if has_alpha:
        bounds = alpha.point(lambda p: 255 if p > 10 else 0).getbbox()
        if bounds:
            img = img.crop(bounds)
    else:
        # Opaque concept illustrations may be used as softly feathered
        # vignettes - never paste their rectangular background over gameplay.
        width, height = img.size
        margin = max(16, min(width, height) // 15)
        mask = Image.new("L", (width, height), 255)
        from PIL import ImageDraw
        d = ImageDraw.Draw(mask)
        d.rectangle((0,0,width,height),fill=0)
        d.rounded_rectangle((margin,margin,width-margin,height-margin),radius=margin*2,fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(radius=margin*1.2))
        img.putalpha(mask)
    limit = sizes[kind]
    img.thumbnail(limit, Image.Resampling.LANCZOS)
    filename = "feature-" + kind + ".webp"
    img.save(dest / filename, "WEBP", quality=88, method=6)
    manifest[kind] = {"file": filename, "size": list(img.size), "transparent_source": has_alpha,
                      "bytes": (dest / filename).stat().st_size}
    assert manifest[kind]["bytes"] < 800000, filename
    print(kind, manifest[kind])
(dest / "feature-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
