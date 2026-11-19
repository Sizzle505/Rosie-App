"""Generate exact-center, scalable ornament for the Timekeeper clock."""
from pathlib import Path
from math import cos, sin, pi

ROOT = Path(__file__).resolve().parents[1] / "public/rosieverse/timekeeper/midnight-observatory"
FACES = ROOT / "face-overlays"
BEZELS = ROOT / "bezel-options"
HANDS = ROOT / "luxury/world-clock-hands"

def svg(body, size=640, defs=""):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
<defs><linearGradient id="gold" x2=".75" y2="1"><stop stop-color="#fff5c9"/><stop offset=".24" stop-color="#d59a3c"/><stop offset=".48" stop-color="#fff2b3"/><stop offset=".75" stop-color="#ae6426"/><stop offset="1" stop-color="#f2cc76"/></linearGradient>
<linearGradient id="silver" x2=".7" y2="1"><stop stop-color="#fffdf2"/><stop offset=".32" stop-color="#b7d4da"/><stop offset=".7" stop-color="#5d8194"/><stop offset="1" stop-color="#e8f4e7"/></linearGradient>
<radialGradient id="gem"><stop stop-color="#f7fcff"/><stop offset=".18" stop-color="#82bbec"/><stop offset=".54" stop-color="#11519a"/><stop offset=".82" stop-color="#08254f"/><stop offset="1" stop-color="#040d2e"/></radialGradient>
<radialGradient id="ruby"><stop stop-color="#fff4d8"/><stop offset=".22" stop-color="#f36d8b"/><stop offset=".65" stop-color="#9a143c"/><stop offset="1" stop-color="#3a061b"/></radialGradient>
<radialGradient id="jade"><stop stop-color="#e8ffeb"/><stop offset=".25" stop-color="#85d7b1"/><stop offset=".72" stop-color="#15734c"/><stop offset="1" stop-color="#073322"/></radialGradient>
<filter id="glow"><feGaussianBlur stdDeviation="2"/></filter>{defs}</defs>{body}</svg>'''

def circle(r, stroke, width, opacity=1):
    return f'<circle cx="320" cy="320" r="{r}" fill="none" stroke="{stroke}" stroke-width="{width}" opacity="{opacity}"/>'

def jewel(x,y,r,kind):
    return f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r+3}" fill="#4b260e" stroke="url(#gold)" stroke-width="3"/><circle cx="{x:.2f}" cy="{y:.2f}" r="{r}" fill="url(#{kind})"/><circle cx="{x-r*.28:.2f}" cy="{y-r*.35:.2f}" r="{r*.15:.2f}" fill="#fff6d6" opacity=".85"/>'

def polar(r,a): return (320+r*sin(a),320-r*cos(a))

bezel_specs = [
    ("imperial-sapphire", "#112a56", "gem", "crown"),
    ("gilded-laurel", "#213a28", "jade", "laurel"),
    ("rose-garnet", "#55162e", "ruby", "floral"),
    ("aurora-enamel", "#174a5c", "jade", "compass"),
    ("ivory-moonstone", "#eadcc0", "gem", "pearl"),
]
for name,enamel,stone,motif in bezel_specs:
    # Aperture remains open, and no ornament enters the 175px hand clearance.
    b = '<circle cx="320" cy="320" r="292" fill="none" stroke="#2a130b" stroke-width="43"/>'
    b += circle(291,"url(#gold)",8)+circle(278,"#70431d",2)+circle(270,"url(#gold)",3)
    b += circle(254,enamel,28)+circle(267,"url(#gold)",3)+circle(241,"url(#gold)",5)
    b += circle(227,"#3a220f",5)+circle(222,"url(#gold)",5)+circle(211,enamel,16)
    b += circle(205,"url(#gold)",3)+circle(199,"#fff0ad",1.4)+circle(188,"url(#gold)",5)+circle(179,"#8d5726",2)
    for i in range(72):
        a=2*pi*i/72
        x1,y1=polar(246,a);x2,y2=polar(258 if i%6==0 else 252,a)
        b+=f'<path d="M{x1:.2f} {y1:.2f}L{x2:.2f} {y2:.2f}" stroke="url(#gold)" stroke-width="{2 if i%6==0 else .8}"/>'
    for i in range(12):
        a=2*pi*i/12;x,y=polar(283,a)
        b+=jewel(x,y,10 if i%3==0 else 4,stone)
    for i in range(24):
        a=2*pi*(i+.5)/24;x,y=polar(285,a)
        b+=f'<circle cx="{x:.2f}" cy="{y:.2f}" r="2.3" fill="#fff2b2"/>'
    for i in range(8):
        a=2*pi*i/8;x,y=polar(306,a)
        if motif=="crown":
            shape=f'<path d="M0 17 Q-16 4 -13 -9 L-7 -5 0 -22 7 -5 13 -9 Q16 4 0 17Z" fill="{enamel}" stroke="url(#gold)" stroke-width="4"/>'
        elif motif=="laurel":
            shape='<path d="M0 18Q-18 4-9-15Q-3-5 0 0Q3-5 9-15Q18 4 0 18Z" fill="#215438" stroke="url(#gold)" stroke-width="3"/><path d="M0-12V16" stroke="#f6d782" stroke-width="2"/>'
        elif motif=="floral":
            shape='<path d="M0-20Q8-11 0-4Q15-15 19 0Q12 8 4 2Q14 16 0 20Q-13 15-4 2Q-14 8-19 0Q-15-15 0-4Q-8-11 0-20Z" fill="#9b4260" stroke="url(#gold)" stroke-width="3"/>'
        elif motif=="compass":
            shape='<path d="M0-25L8-8 25 0 8 8 0 25-8 8-25 0-8-8Z" fill="#0b4667" stroke="url(#gold)" stroke-width="3"/>'
        else:
            shape='<path d="M0-22C18-18 22-9 22 0S18 18 0 22C-18 18-22 9-22 0S-18-18 0-22Z" fill="#f3e6cd" stroke="url(#gold)" stroke-width="4"/>'
        b+=f'<g transform="translate({x:.2f} {y:.2f}) rotate({i*45})">{shape}</g>'
        b+=jewel(x,y,7,stone)
    (BEZELS/f"{name}.svg").write_text(svg(b))

roman=["XII","I","II","III","IV","V","VI","VII","VIII","IX","X","XI"]
face_specs=[
    ("astrolabe","Roman observatory","gem"),
    ("marquetry","inlaid star","jade"),
    ("rose-guilloche","floral engraving","ruby"),
    ("midnight-compass","compass","gem"),
    ("versailles-lace","lace","ruby"),
]
for name,style,stone in face_specs:
    b=circle(294,"url(#gold)",4)+circle(284,"#f5db9a",1)+circle(267,"url(#gold)",2)+circle(181,"url(#gold)",2)
    for i in range(60):
        a=2*pi*i/60;x1,y1=polar(271,a);x2,y2=polar(285 if i%5==0 else 277,a)
        b+=f'<path d="M{x1:.2f} {y1:.2f}L{x2:.2f} {y2:.2f}" stroke="url(#gold)" stroke-width="{2.5 if i%5==0 else 1}"/>'
    for i in range(12):
        a=2*pi*i/12;x,y=polar(231,a)
        if name in ("astrolabe","versailles-lace"):
            b+=f'<text x="{x:.2f}" y="{y+10:.2f}" text-anchor="middle" fill="#ffe6a0" stroke="#5c3515" stroke-width=".8" paint-order="stroke" font-family="Georgia,serif" font-size="{30 if len(roman[i])<3 else 25}" font-weight="bold">{roman[i]}</text>'
        elif name=="marquetry":
            b+=f'<g transform="translate({x:.2f} {y:.2f}) rotate({i*30})"><path d="M0-16L5-4 16 0 5 4 0 16-5 4-16 0-5-4Z" fill="url(#gold)" stroke="#553613" stroke-width="1.5"/></g>'
        elif name=="rose-guilloche":
            b+=f'<path d="M{x:.2f} {y-14:.2f}l6 14-6 14-6-14Z" fill="url(#gold)" stroke="#813c36" stroke-width="1.5"/>'
        else:
            b+=f'<g transform="translate({x:.2f} {y:.2f}) rotate({i*30})"><path d="M0-18L7 0 0 18-7 0Z" fill="url(#gold)" stroke="#432f24" stroke-width="1"/></g>'
    for i in range(12):
        a=2*pi*(i+.5)/12;x,y=polar(270,a)
        b+=jewel(x,y,3.5,stone)
    if name=="astrolabe":
        b+=circle(170,"#d3b16e",1.2)+circle(155,"#ba9d61",.8)
        for i in range(8):
            a=2*pi*i/8;x,y=polar(163,a);b+=f'<circle cx="{x:.2f}" cy="{y:.2f}" r="3" fill="#fce7a5"/>'
        b+='<path d="M270 201Q320 185 370 201M270 439Q320 455 370 439" fill="none" stroke="url(#gold)" stroke-width="2"/>'
    elif name=="marquetry":
        for i in range(24):
            a=2*pi*i/24;x,y=polar(173,a);b+=f'<g transform="translate({x:.2f} {y:.2f}) rotate({i*15})"><path d="M0-12L5 0 0 12-5 0Z" fill="#315e4c" stroke="url(#gold)" stroke-width="1"/></g>'
        b+=circle(147,"url(#gold)",2)
    elif name=="rose-guilloche":
        for i in range(48):
            a=2*pi*i/48;x,y=polar(170,a);b+=f'<ellipse cx="{x:.2f}" cy="{y:.2f}" rx="6" ry="14" transform="rotate({i*7.5} {x:.2f} {y:.2f})" fill="none" stroke="#e6b36f" stroke-width="1" opacity=".8"/>'
        b+=circle(144,"url(#gold)",2)
    elif name=="midnight-compass":
        for i in range(8):
            a=2*pi*i/8;x,y=polar(165,a)
            b+=f'<g transform="translate({x:.2f} {y:.2f}) rotate({i*45})"><path d="M0-18L6 0 0 18-6 0Z" fill="#cfae68" stroke="#593b20"/></g>'
        b+=circle(141,"#e8cb8c",1.5)
    else:
        for i in range(32):
            a=2*pi*i/32;x,y=polar(169,a)
            b+=f'<g transform="translate({x:.2f} {y:.2f}) rotate({i*11.25})"><path d="M0-14Q11-6 0 13Q-11-6 0-14Z" fill="none" stroke="url(#gold)" stroke-width="1.3"/></g>'
        b+=circle(144,"#ffe1af",1.5)
    (FACES/f"{name}.svg").write_text(svg(b))

# Each hand occupies the same 512 x 512 canvas and joins at (256, 256).
# Upright at zero degrees, with a short balanced tail below the pivot.
hand_styles={
    "regent": ("url(#gold)","#61371c","gem"),
    "rose": ("#e8b2a3","#6d3140","ruby"),
    "sapphire": ("#93c4e6","#102d63","gem"),
    "moonstone": ("url(#silver)","#526478","jade"),
}
for name,(metal,edge,stone) in hand_styles.items():
    for part,tip,shoulder,half in [("hour",99,198,10),("minute",54,188,8),("second",31,224,3.2)]:
        b=f'<path d="M256 {tip} Q{256+half*.6} {tip+14} {256+half} {shoulder} L{256+half*.65} 252 L{256+half*.75} 286 Q256 301 {256-half*.75} 286 L{256-half*.65} 252 L{256-half} {shoulder} Q{256-half*.6} {tip+14} 256 {tip}Z" fill="{metal}" stroke="{edge}" stroke-width="2.8" stroke-linejoin="round"/>'
        if part!="second":
            b+=f'<path d="M256 {tip+16}L256 236" stroke="#fff4d6" stroke-width="1.3" opacity=".84"/>'
            b+=f'<path d="M256 {shoulder-5}q{-half-8} 18 0 26q{half+8}-8 0-26Z" fill="none" stroke="{edge}" stroke-width="2"/>'
            b+=f'<path d="M256 {shoulder+2}q{-half-3} 12 0 20q{half+3}-8 0-20Z" fill="none" stroke="#f7dd9b" stroke-width="1.5"/>'
        else:
            b+=f'<circle cx="256" cy="283" r="8" fill="none" stroke="{metal}" stroke-width="2"/>'
        b+='<circle cx="256" cy="256" r="7" fill="#3e2719" stroke="url(#gold)" stroke-width="3"/>'
        (HANDS/f"{name}-{part}.svg").write_text(svg(b,512))
    b=f'<circle cx="64" cy="64" r="24" fill="#25172b" stroke="{metal}" stroke-width="6"/><circle cx="64" cy="64" r="16" fill="url(#{stone})" stroke="#fff0bb" stroke-width="2"/><circle cx="58" cy="56" r="4" fill="#fff" opacity=".7"/>'
    (HANDS/f"{name}-pivot.svg").write_text(svg(b,128))

print("Created 5 bezels, 5 faces, and 4 complete hand sets")
