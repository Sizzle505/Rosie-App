import { DRILL_WIDTH, tunnelCenter, tunnelRadius } from "./emberDrillEngine.js";

/**
 * Barkroot ORIGINAL #32 cut-face ribbons.
 * The two derived sprites are registered to the physics boundary at v=0:
 * world-space arc length -> texture U, outward surface normal -> texture V.
 * These are NOT the unmodified 2172x724 source panels, nor 480px mural strips.
 */
const SAMPLES = 10;
const EDGE_DEPTH = 92;
const U_SCALE = 0.94;
const LIMIT = 36000;
const ARC_STEP = 10;
const lit = image => Boolean(image?.complete && image.naturalWidth > 0);

export function sampleTunnelEdge(worldX, side) {
  const center = tunnelCenter(worldX);
  const radius = tunnelRadius(worldX);
  const y = center + side * radius;
  const eps = 2.5;
  const d0 = tunnelCenter(worldX + eps) + side * tunnelRadius(worldX + eps);
  const d1 = tunnelCenter(worldX - eps) + side * tunnelRadius(worldX - eps);
  const slope = (d0 - d1) / (2 * eps);
  const length = Math.hypot(1, slope);
  return {
    x: worldX, y,
    tangentX: 1 / length,
    tangentY: slope / length,
    normalX: -side * slope / length,
    normalY: side / length
  };
}

// Integrate once in world coordinates, not screen coordinates. UV phase is
// identical for the same cave rock on every scroll frame and every curve.
const arcTables = new Map();
function arcTable(side) {
  if (arcTables.has(side)) return arcTables.get(side);
  const n = Math.ceil(LIMIT / ARC_STEP);
  const values = new Float64Array(n + 1);
  let previous = sampleTunnelEdge(0, side).y;
  for (let i = 1; i <= n; i++) {
    const y = sampleTunnelEdge(i * ARC_STEP, side).y;
    values[i] = values[i - 1] + Math.hypot(ARC_STEP, y - previous);
    previous = y;
  }
  arcTables.set(side, values);
  return values;
}
function arc(world, side) {
  if (world < 0) return world * Math.hypot(1, sampleTunnelEdge(0, side).tangentY);
  const a = arcTable(side);
  const f = Math.min(a.length - 1, world / ARC_STEP);
  const i = Math.floor(f);
  return a[i] + (i < a.length - 1 ? (f - i) * (a[i + 1] - a[i]) : Math.max(0, world - LIMIT));
}

function paintRibbon(c, scroll, side, image) {
  if (!lit(image)) return false;
  const tile = image.naturalWidth;
  const depth = EDGE_DEPTH;
  for (let x = -SAMPLES * 2; x < DRILL_WIDTH + SAMPLES * 2; x += SAMPLES) {
    const xNext = Math.min(DRILL_WIDTH + SAMPLES * 2, x + SAMPLES);
    const a = sampleTunnelEdge(scroll + x, side);
    const b = sampleTunnelEdge(scroll + xNext, side);
    const dx = xNext - x, dy = b.y - a.y;
    const seg = Math.hypot(dx, dy);
    const tx = dx / seg, ty = dy / seg;
    const nx = -side * ty, ny = side * tx;
    const u0 = arc(scroll + x, side) * U_SCALE;
    const u1 = arc(scroll + xNext, side) * U_SCALE;
    const span = u1 - u0;
    // One affine transform per shared pair of vertices; slice only the
    // purpose-extracted, registered, SEAM-REPAIRED material (never scenery).
    c.save();
    c.transform(tx, ty, nx, ny, x, a.y);
    let drawn = 0;
    while (drawn < span - 0.0001) {
      const u = ((u0 + drawn) % tile + tile) % tile;
      const take = Math.min(span - drawn, tile - u);
      const at = seg * drawn / span;
      const width = seg * take / span;
      // Tiny coverage overlap avoids cracks between adjacent quads;
      // only into the previous solid rock, never into the flight lane.
      c.drawImage(image, u, 0, take, image.naturalHeight,
        at, 0, width + 0.65, depth);
      drawn += take;
    }
    c.restore();
  }
  return true;
}

// The OG seam material originally stopped at 92px of depth, exposing the
// completely unrelated photographic panorama below it as a horizontal band.
// Extend the SAME real cut-face material outward as low-contrast cave mass,
// keeping the crisp original 92px collision contact painted on top.
function paintWallDepthTexture(c,scroll,side,image){
 if(!lit(image))return;
 const stride=20,depth=390,tile=image.naturalWidth;
 c.save();
 c.globalAlpha=.56;
 for(let x=-stride;x<DRILL_WIDTH+stride;x+=stride){
  const next=Math.min(DRILL_WIDTH+stride,x+stride);
  const a=sampleTunnelEdge(scroll+x,side),b=sampleTunnelEdge(scroll+next,side);
  const dx=next-x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  const tx=dx/len,ty=dy/len,nx=-side*ty,ny=side*tx;
  const u=arc(scroll+x,side)*U_SCALE;
  const srcX=((u%tile)+tile)%tile;
  c.save();c.transform(tx,ty,nx,ny,x,a.y);
  const span=len*U_SCALE;
  const first=Math.min(span,tile-srcX);
  c.drawImage(image,srcX,0,first,image.naturalHeight,0,0,len*first/span+.6,depth);
  if(first<span)c.drawImage(image,0,0,span-first,image.naturalHeight,
    len*first/span,0,len*(span-first)/span+.6,depth);
  c.restore();
 }
 c.restore();
}
export function paintTunnelRibbons(c, s, assets) {
  const top = assets?.edgeBarkrootTop;
  const floor = assets?.edgeBarkrootBottom;
  if (!lit(top) || !lit(floor)) return false;
  // The rock mass underneath the original-contact ribbon inherits its same\n  // world-space UV, rather than a detached mural strip.\n  paintWallDepthTexture(c,s.scroll,-1,top);\n  paintWallDepthTexture(c,s.scroll,+1,floor);\n  // Exactly the same function used for the collision boundaries.\n  paintRibbon(c, s.scroll, -1, top);
  paintRibbon(c, s.scroll, +1, floor);
  // A subtle interior shadow, NOT a bright painted route outline.
  for (const side of [-1, 1]) {
    c.save();
    c.beginPath();
    for (let x = -4; x < DRILL_WIDTH + 5; x += 8) {
      const y = sampleTunnelEdge(s.scroll + x, side).y;
      if (x === -4) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.strokeStyle = "rgba(18, 10, 13, 0.11)";
    c.lineWidth = 7;
    c.stroke();
    c.restore();
  }
  return true;
}
