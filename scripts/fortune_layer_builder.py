#!/usr/bin/env python3
"""Source-registered draft alpha layers. Never modifies the production stage.

All cutout RGB pixels come from the checked-in original painting. Backfill is a
temporary draft produced by inpainting; it is NOT a polished empty-plate asset.
"""
from __future__ import annotations
import argparse
import json
from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageStat

W, H = 1522, 1430

# Native source coordinates, traced against original painting, not the iPhone crop.
# Shapes are intentionally conservative. Each boundary needs hand review.
SHAPES = {
 "set/curtain-left": [
  [(15,97),(417,98),(385,160),(332,234),(270,315),(169,450),
   (178,647),(201,901),(0,901),(0,139)]
 ],
 "set/curtain-right": [
  [(1117,104),(1488,95),(1522,145),(1522,963),(1371,965),
   (1342,849),(1360,704),(1387,478),(1324,443),
   (1245,337),(1187,231)]
 ],
 "set/lantern-left": [
  [(354,125),(383,125),(379,214),(397,259),(433,300),(447,362),
   (450,541),(416,597),(391,639),(385,695),(382,792),
   (347,793),(347,689),(323,646),(277,605),(265,535),
   (268,373),(286,303),(320,267),(346,236)]
 ],
 "set/lantern-right": [
  [(1230,179),(1266,186),(1259,290),(1284,319),(1334,361),
   (1345,405),(1348,559),(1331,615),(1302,654),(1284,706),
   (1276,789),(1252,789),(1242,695),(1206,655),(1176,597),
   (1165,425),(1180,359),(1218,308)]
 ],
 "rosie/torso": [
  [(573,622),(631,592),(710,605),(805,629),(916,634),
   (1009,656),(1093,706),(1167,808),(1225,938),
   (1289,1115),(1330,1248),(1360,1430),(313,1430),
   (337,1207),(339,1046),(354,938),(389,828),(457,734),(506,680)]
 ],
 "rosie/head-front": [
  [(704,107),(734,127),(757,168),(783,236),(790,253),
   (824,194),(885,163),(966,143),(1020,167),(1075,183),
   (1110,229),(1115,322),(1140,323),(1192,308),
   (1251,325),(1253,377),(1216,448),(1167,495),
   (1125,514),(1110,570),(1095,639),(1053,706),
   (1007,752),(935,786),(861,807),(778,810),
   (702,783),(626,738),(586,680),(563,605),
   (557,519),(581,443),(627,374),(663,329),(651,264),
   (663,180),(687,130)]
 ],
 "orb/glass-assembled": [
  [(766,834),(867,851),(943,893),(1008,966),(1046,1050),
   (1060,1134),(1047,1210),(1024,1280),(1007,1308),
   (518,1308),(496,1281),(480,1205),(474,1112),(494,1023),
   (545,926),(628,859),(699,840)]
 ],
 "rosie/raised-paw": [
  [(489,783),(514,749),(544,732),(587,728),(623,743),
   (655,765),(681,775),(704,798),(721,836),(704,870),
   (679,891),(620,905),(551,903),(503,873),(472,841)]
 ],
}
# Props and fixtures that remain baked into the static background for this
# first alpha-extraction pass: books, moon, orb pedestal, crystals, armillary,
# and treats. Later drafts must isolate these without erasing their source detail.

def poly_mask(polygons):
    mask = np.zeros((H,W),np.uint8)
    for polygon in polygons:
        cv2.fillPoly(mask,[np.array(polygon,np.int32)],255)
    return mask

def clip_to_known_occlusion(masks):
    # Preserve the foreground book stack. These pixels are not Rosie.
    for name in ("rosie/torso",):
        masks[name][899:1410, :423] = 0
    # Keep immobile foreground props in the base plate; they must not move
    # along with Rosie's chest breathing. These exclusions also prevent
    # contamination from the armillary, treat bowl and orb pedestal.
    masks["rosie/torso"][1277:, 415:1115] = 0
    masks["rosie/torso"][1178:, 1100:] = 0
    masks["rosie/torso"][783:1089, 1140:1335] = 0
    # The celestial and lamp parts remain behind Rosie, and the orb in front
    # of her torso. Assign every pixel to exactly one native RGB cutout.
    ordering = [
       "set/curtain-left","set/curtain-right",
       "set/lantern-left","set/lantern-right",
       "rosie/torso","rosie/head-front",
       "orb/glass-assembled","rosie/raised-paw",
    ]
    assigned = np.zeros((H,W),np.uint8)
    owned = {}
    for name in reversed(ordering):
        owned[name] = cv2.bitwise_and(masks[name],cv2.bitwise_not(assigned))
        assigned = cv2.bitwise_or(assigned,masks[name])
    return ordering,owned,assigned

def candidate_head_refinement(rgb, rough):
    # Trial matte only. Keep canonical source polygons unchanged until manual
    # review of the candidate at 100%: turban ornaments and black fur are easy
    # to lose against the dark velvet background.
    trimap=np.full((H,W),cv2.GC_BGD,np.uint8)
    kernel_outer=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(45,45))
    kernel_inner=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(23,23))
    outer=cv2.dilate(rough,kernel_outer)
    inner=cv2.erode(rough,kernel_inner)
    trimap[outer>0]=cv2.GC_PR_BGD
    trimap[rough>0]=cv2.GC_PR_FGD
    trimap[inner>0]=cv2.GC_FGD
    bgmodel=np.zeros((1,65),np.float64)
    fgmodel=np.zeros((1,65),np.float64)
    try:
        cv2.grabCut(cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR),trimap,None,
                    bgmodel,fgmodel,5,cv2.GC_INIT_WITH_MASK)
        return np.where((trimap==cv2.GC_FGD)|
                        (trimap==cv2.GC_PR_FGD),255,0).astype(np.uint8)
    except cv2.error:
        return rough.copy()

def save_rgba(path, rgb, alpha):
    path.parent.mkdir(parents=True,exist_ok=True)
    # Transparent pixels must be true black, not RGB fragments from source.
    # Prevents fringes in WebP viewers and materially reduces asset size.
    clean_rgb = np.where(alpha[:,:,None]>0, rgb, np.zeros_like(rgb))
    rgba = np.dstack((clean_rgb,alpha))
    img = Image.fromarray(rgba,"RGBA")
    img.save(path, "WEBP", lossless=True, method=5)

def preview_contact(source, empty, composite, alpha_total, output):
    from PIL import ImageDraw
    scale=0.36
    w,h=round(W*scale),round(H*scale)
    tiles=[("ORIGINAL",Image.fromarray(source)),
           ("DRAFT EMPTY PLATE",Image.fromarray(empty)),
           ("RESTACKED",Image.fromarray(composite)),
           ("EXTRACTION COVERAGE",Image.fromarray(
               cv2.cvtColor(alpha_total,cv2.COLOR_GRAY2RGB)))]
    canvas=Image.new("RGB",(w*2,h*2+68),(18,13,24))
    draw=ImageDraw.Draw(canvas)
    for i,(name,img) in enumerate(tiles):
        x=(i%2)*w;y=(i//2)*(h+34)
        canvas.paste(img.resize((w,h),Image.Resampling.LANCZOS),(x,y+30))
        draw.text((x+12,y+8),name,fill=(240,204,137))
    canvas.save(output,quality=92,subsampling=0)

def make_background(rgb,mask):
    # The original illustration contains no pixels behind Rosie. Inpainting
    # an image-sized object creates obvious color smears. Use a restrained
    # continuation of the existing midnight velvet stage instead. This is
    # an artist's provisional hidden surface, NOT a recovered source plate.
    yy,xx=np.indices((H,W),dtype=np.float32)
    ripples=np.sin(xx/35.0)*3.1+np.sin(xx/93.0+yy/245.0)*2.5
    shade=np.clip(1-((xx-W/2)/(W*.9))**2,0.68,1.0)
    lamp_left=np.exp(-(((xx-368)/230)**2+((yy-493)/330)**2))
    lamp_right=np.exp(-(((xx-1252)/220)**2+((yy-519)/350)**2))
    glow=lamp_left+lamp_right
    # Deep blue-black rear drapery, quietly enriched by real lamp positions.
    back=np.zeros((H,W,3),dtype=np.float32)
    back[:,:,0]=(15+ripples+glow*47)*shade
    back[:,:,1]=(14+ripples*.46+glow*25)*shade
    back[:,:,2]=(31+ripples*1.5+glow*10)*shade
    # Dark ruby velvet inside the outer curtains, rather than bright
    # hallucinated wall colors from an inpaint of a massive missing area.
    sides=(xx<220)|(xx>1380)
    ruby=np.stack((
        np.maximum(20,48+ripples*2.8+glow*17),
        np.maximum(5,9+ripples*.5+glow*12),
        np.maximum(10,22+ripples*.8+glow*7)),axis=2)
    back=np.where(sides[:,:,None],ruby,back)
    # Original stage floor cloth plausibly continues behind cape/pedestal.
    floor=np.clip((yy-1250)/110,0,1)[:,:,None]
    cloth=np.stack((72+ripples*2.0,14+ripples*.4,31+ripples),axis=2)
    back=back*(1-floor)+cloth*floor
    back=np.uint8(np.clip(back,0,255))
    empty=rgb.copy()
    empty[mask>0]=back[mask>0]
    # Lightly feather only the painted replacement transition; the exact
    # source-owned sprites still overwrite that seam at rest.
    return empty

def extract_existing_side_head(side_path,out):
    # Candidate from the app's actual existing side portrait, not AI-generated
    # or horizontally mirrored. Pose/collar edge still requires visual QA.
    if not side_path.exists():
        return False
    side=Image.open(side_path).convert("RGBA")
    arr=np.array(side)
    rows=np.arange(arr.shape[0],dtype=np.float32)
    fade=np.clip((482-rows)/42,0,1)[:,None]
    arr[:,:,3]=np.uint8(arr[:,:,3].astype(np.float32)*fade)
    arr[:,:,:3]=np.where(arr[:,:,3,None]>0,arr[:,:,:3],0)
    subject=Image.fromarray(arr,"RGBA")
    rescale=1.40
    subject=subject.resize((round(side.width*rescale),
                            round(side.height*rescale)),Image.Resampling.LANCZOS)
    frame=Image.new("RGBA",(W,H),(0,0,0,0))
    frame.alpha_composite(subject,(365,112))
    target=out/"rosie/head-left-existing-CANDIDATE.webp"
    target.parent.mkdir(parents=True,exist_ok=True)
    frame.save(target,"WEBP",lossless=True,method=5)
    return True

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--source",type=Path,required=True)
    p.add_argument("--side-source",type=Path,
                   default=Path("public/rosie-fortune-turn-side.webp"))
    p.add_argument("--out",type=Path,required=True)
    args=p.parse_args()
    source=Image.open(args.source).convert("RGB")
    if source.size != (W,H):
        raise RuntimeError(f"Expected native source {W}x{H}, got {source.size}")
    args.out.mkdir(parents=True,exist_ok=True)
    rgb=np.array(source)
    masks={name:poly_mask(parts) for name,parts in SHAPES.items()}
    order,owned,union=clip_to_known_occlusion(masks)
    side_candidate=extract_existing_side_head(args.side_source,args.out)
    refined_head=candidate_head_refinement(rgb,masks["rosie/head-front"])
    save_rgba(args.out/"rosie/head-grabcut-CANDIDATE.webp",rgb,refined_head)
    empty=make_background(rgb,union)
    Image.fromarray(empty).save(args.out/"empty-plate-DRAFT.webp",
                                    "WEBP",lossless=True,method=5)
    for name in order:
        save_rgba(args.out/(name+".webp"),rgb,owned[name])
    composite=empty.copy()
    for name in order:
        alpha=owned[name].astype(np.float32)[...,None]/255
        composite=(rgb*alpha+composite*(1-alpha)).astype(np.uint8)
    Image.fromarray(composite).save(args.out/"static-composite-DRAFT.webp",
                                    "WEBP",lossless=True,method=5)
    preview_contact(rgb,empty,composite,union,args.out/"inspection-contact-sheet.jpg")
    err=np.abs(rgb.astype(np.int16)-composite.astype(np.int16))
    report={
      "source":"public/rosie-fortune-stage.webp","native_canvas":[W,H],
      "stage":"INITIAL DRAFT - NO PRODUCTION USE", "source_repainted":False,
      "source_matched_rgb_cutouts":len(order),
      "draft_layers":order,
      "still_baked":["moon","sky","books","treat-bowl","armillary",
                     "pedestal","top-border","crystals","tassels"],
      "backplate":"Painted midnight-velvet continuation; provisional unseen areas",
      "boundary_type":"manual source-registered polygon; needs feather/hair matte QA",
      "head_refined_diagnostic_only":True,
      "head_left_candidate_from_existing_app_portrait":side_candidate,
      "static_composite_mean_abs_error":round(float(err.mean()),6),
      "fraction_pixels_changed_gt_24":round(float((err.max(2)>24).mean()),6),
      "empty_plate_approved":False,"motion_approved":False,
      "integration_approved":False
    }
    (args.out/"draft-report.json").write_text(json.dumps(report,indent=2)+"\\n")
    (args.out/"DRAFT_ONLY_README.txt").write_text(
        "MADAME ROSIE - UNAPPROVED SOURCE REGISTERED DRAFTS\\n"
        "All transparent cutouts are native 1522x1430 original painting pixels.\\n"
        "WARNING: mask boundaries are conservative polygons and need hand QA.\\n"
        "The empty plate is a generated velvet continuation, NOT true recovered art.\\n"
        "The exact static composite is NOT motion approval. Do not deploy these.\\n"
        "Use the connected GitHub branch's source generator for repeatable changes.\\n")
    with ZipFile(args.out/"madame-rosie-draft-layers.zip","w",ZIP_DEFLATED,compresslevel=6) as z:
        for file in sorted(args.out.rglob("*")):
            if file.is_file() and file.name!="madame-rosie-draft-layers.zip":
                z.write(file,file.relative_to(args.out).as_posix())
    print(json.dumps(report,indent=2))
if __name__=="__main__":
    main()
