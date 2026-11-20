/**
 * Optional Ember Tunnel expansion catalog.
 * This is intentionally inert until reviewed binaries are installed.
 * It does not replace the approved vehicle or change the existing 75s run.
 */
export const EXPANSION_ROOT="/ember-drill/expansion-batch-c/";
const immutable=(value)=>Object.freeze(value);

export const EMBER_WORLD_CATALOG=immutable([
  immutable({id:"barkroot",name:"Barkroot Passage",index:0,mechanic:"Excavate weakened earth",boss:null,background:"existing",playtestUnlocked:true}),
  immutable({id:"ruby",name:"Ruby Temple Galleries",index:1,mechanic:"Outrun crystal shutters",boss:null,background:"existing",playtestUnlocked:true}),
  immutable({id:"clockwork",name:"Clockwork Catacombs",index:2,mechanic:"Navigate piston and gear traps",boss:"copperjack",background:"pending",playtestUnlocked:true}),
  immutable({id:"molten",name:"Molten Depths",index:3,mechanic:"Avoid eruptions and falling basalt",boss:"cinderclaw",background:"pending",playtestUnlocked:true}),
  immutable({id:"treasury",name:"Royal Treasury",index:4,mechanic:"Defeat the Mole King and reclaim the treasury",boss:"mole-king",background:"pending",playtestUnlocked:true})
]);
export const EMBER_EXPANSION_ATLASES=immutable({
  "mole-king":immutable({file:"atlases/mole-king-atlas.webp",columns:4,rows:3,cell:384,frames:12}),
  "gear-crusher":immutable({file:"atlases/gear-crusher-atlas.webp",columns:4,rows:2,cell:448,frames:8}),
  "lava-geyser":immutable({file:"atlases/lava-geyser-atlas.webp",columns:3,rows:2,cell:512,frames:6}),
  "falling-basalt":immutable({file:"atlases/falling-basalt-atlas.webp",columns:4,rows:2,cell:448,frames:8}),
  "royal-earth-burst":immutable({file:"atlases/royal-earth-burst-atlas.webp",columns:4,rows:2,cell:448,frames:8}),
  "world-markers":immutable({file:"atlases/world-markers-atlas.webp",columns:3,rows:2,cell:512,frames:6}),
  "bonus-pickups":immutable({file:"atlases/bonus-pickups-atlas.webp",columns:3,rows:2,cell:512,frames:6})
});
// Boss animation sheets are supplied by the separately reviewed character packs.
// They intentionally are not part of the original seven-atlas import manifest.
export const EMBER_CHARACTER_ATLASES=immutable({
  cinderclaw:immutable({file:"atlases/cinderclaw-atlas.webp",columns:4,rows:3,cell:384,frames:12}),
  copperjack:immutable({file:"atlases/copperjack-atlas.webp",columns:4,rows:3,cell:512,frames:12})
});
export const EMBER_EXPANSION_TRANSITIONS=immutable({
  "ruby-clockwork":"transitions/ruby-clockwork.webp",
  "clockwork-molten":"transitions/clockwork-molten.webp",
  "molten-treasury":"transitions/molten-treasury.webp"
});
export const expansionFileUrl=(relative)=>EXPANSION_ROOT+relative;
export function atlasFrameRect(id,frame){
  const a=EMBER_EXPANSION_ATLASES[id]||EMBER_CHARACTER_ATLASES[id];
  if(!a)throw new RangeError("Unknown Ember atlas: "+id);
  if(!Number.isInteger(frame)||frame<0||frame>=a.frames)throw new RangeError("Invalid "+id+" frame: "+frame);
  return immutable({sx:frame%a.columns*a.cell,sy:Math.floor(frame/a.columns)*a.cell,sw:a.cell,sh:a.cell});
}
export function drawExpansionFrame(ctx,image,id,frame,x,y,width,height){
  // Assets are optional during review: the published two-passage course never
  // draws an absent file as a broken placeholder or changes its collision box.
  if(!ctx||!image?.complete||!(image.naturalWidth>0)||!(image.naturalHeight>0))return false;
  const {sx,sy,sw,sh}=atlasFrameRect(id,frame);
  if(sx+sw>image.naturalWidth||sy+sh>image.naturalHeight)return false;
  ctx.drawImage(image,sx,sy,sw,sh,x,y,width,height);
  return true;
}
export function worldAtIndex(index){
  return EMBER_WORLD_CATALOG.find(world=>world.index===index)||null;
}
