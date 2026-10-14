// World-locked formations shared by rendering and physics.
// Source dimensions match public/ember-drill/edge/formation/formations.json.
const SIZES={
 ogCanopyA:[660,279],ogCanopyB:[660,255],ogCanopyC:[660,280],
 ogCrystalA:[660,335],ogCrystalB:[660,228],ogCrystalC:[660,351],
 ogRichRoofA:[660,186],ogRichRoofB:[660,205],
 ogRichFloorA:[660,167],ogRichFloorB:[660,201],
 ogSlopeRoofA:[660,168],ogSlopeRoofB:[660,174],
 ogSlopeFloorA:[660,153],ogSlopeFloorB:[660,161],
 ogRootsOne:[385,480],ogRootsTwo:[368,480]
};
const HAZARDS=new Set([1890,2690,3900,5350,6830,8760,9430,10980,11630]);
export const FORMATION_LAYOUT = [
  // Handplaced, world-locked ceiling overhangs, roots and floor strata.
  {at:520, side:-1, key:"ogCanopyA", width:465, alpha:.99},
  {at:820, side:1, key:"ogCrystalA", width:425, alpha:.98},
  {at:1570,side:-1,key:"ogRootsOne",width:222,alpha:1},
  {at:1890,side:1,key:"ogRichFloorA",width:425,alpha:1},
  {at:2690,side:-1,key:"ogSlopeRoofA",width:420,alpha:.96},
  {at:3220,side:1,key:"ogCrystalB",width:395,alpha:1},
  {at:3900,side:-1,key:"ogCanopyB",width:445,alpha:1},
  {at:4660,side:1,key:"ogSlopeFloorA",width:445,alpha:.95},
  {at:5350,side:-1,key:"ogRichRoofA",width:445,alpha:.98},
  {at:6090,side:1,key:"ogCrystalC",width:465,alpha:1},
  {at:6830,side:-1,key:"ogRootsTwo",width:237,alpha:.99},
  {at:7320,side:1,key:"ogRichFloorB",width:425,alpha:.98},
  {at:8130,side:-1,key:"ogCanopyC",width:450,alpha:1},
  {at:8760,side:1,key:"ogSlopeFloorB",width:415,alpha:.97},
  {at:9430,side:-1,key:"ogRichRoofB",width:450,alpha:1},
  {at:10190,side:1,key:"ogCrystalA",width:440,alpha:.98},
  {at:10980,side:-1,key:"ogSlopeRoofB",width:435,alpha:.97},
  {at:11630,side:1,key:"ogCrystalC",width:450,alpha:.98},
  {at:12240,side:-1,key:"ogCanopyB",width:445,alpha:1},
  {at:12960,side:1,key:"ogRichFloorA",width:435,alpha:1},
  // Later scenery is deliberately untouched until the Ruby visual gate.
].map(f=>({...f, obstacle:HAZARDS.has(f.at)}));
export function formationIntrusion(f){
 const [w,h]=SIZES[f.key];
 // Project at most 60% of the preserved formation into the *expanded*
 // corridor; the remaining rock visibly continues into its parent wall.
 return Math.min(f.key.startsWith("ogRoots")?129:116, f.width*h/w*.61);
}
export function formationClearance(f, worldX){
 const distance=Math.abs(worldX-f.at)/(f.width*.30);
 if(distance>=1) return 0;
 // Conservative central collision hull, smaller than the illustrated sprite.
 return formationIntrusion(f)*.73*Math.pow(1-distance*distance,1.15);
}
