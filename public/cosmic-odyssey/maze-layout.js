/* Match the phone maze to the actual playfield, keeping square cells and odd
   dimensions for the existing connected-maze generator. The maze never drops
   below its designed 11x15 portrait (Mitchell, 2026-11-26: the gameplay
   window is limited only by the screen width, its height significantly
   beyond its width, as designed — a short viewport must not collapse the
   maze toward square). */
(function(root){
  function phone(width,height){
    const ratio=Math.max(1,height-10)/Math.max(1,width-10);
    const rows=Math.max(15,Math.min(19,2*Math.round((11*ratio-1)/2)+1));
    return {cols:11,rows};
  }
  root.CosmicMazeLayout={phone};
})(globalThis);
