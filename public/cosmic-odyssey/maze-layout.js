/* Match the phone maze to the actual playfield, keeping square cells and odd
   dimensions for the existing connected-maze generator. */
(function(root){
  function phone(width,height){
    const ratio=Math.max(1,height-10)/Math.max(1,width-10);
    const rows=Math.max(11,Math.min(19,2*Math.round((11*ratio-1)/2)+1));
    return {cols:11,rows};
  }
  root.CosmicMazeLayout={phone};
})(globalThis);
