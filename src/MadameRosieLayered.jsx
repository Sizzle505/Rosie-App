import React from "react";
import "./madame-layered-preview.css";

/**
 * Source-registered rig. Every frame is a full 1522x1430 transparent canvas
 * with source-aligned original pixels. Feature gated by ?rosieLayers=1;
 * NEVER substitute this for the production artwork without visual QA.
 */
const ROOT = "/fortune-layer-drafts";
const sprites = {
  leftCurtain: ROOT + "/set/curtain-left.webp",
  rightCurtain: ROOT + "/set/curtain-right.webp",
  leftLamp: ROOT + "/set/lantern-left.webp",
  rightLamp: ROOT + "/set/lantern-right.webp",
  torso: ROOT + "/rosie/torso.webp",
  front: ROOT + "/rosie/head-front.webp",
  left: ROOT + "/rosie/head-left-existing-CANDIDATE.webp",
  paw: ROOT + "/rosie/raised-paw.webp",
  glassBack: ROOT + "/orb/glass-back.webp",
  glassFront: ROOT + "/orb/front-reflections.webp",
};

function Sprite({ name, type, className = "" }) {
  return <img
    className={`madame-sprite madame-sprite-${type} ${className}`}
    src={sprites[name]}
    alt=""
    aria-hidden="true"
    draggable="false"
    decoding="async"
  />;
}

/** Called instead of the single flat stage photo when rosieLayers=1. */
export default function MadameRosieLayered({ artRef, consulting, manifesting, flipped, turning }) {
  return <div className={[
      "madame-layered-stage",
      consulting ? "madame-consulting" : "",
      manifesting ? "madame-revealing" : "",
      flipped ? "madame-listening" : "",
      turning ? "madame-turning" : "",
    ].filter(Boolean).join(" ")} aria-label="Layered Madame Rosie renovation preview">
    <img
      ref={artRef}
      className="stage-art madame-backdrop"
      src={ROOT + "/empty-plate-DRAFT.webp"}
      alt="Madame Rosie's burgundy-and-gold fortune-telling booth"
      draggable="false"
    />
    <Sprite name="leftCurtain" type="curtain-left" />
    <Sprite name="rightCurtain" type="curtain-right" />
    <Sprite name="leftLamp" type="lamp-left" />
    <Sprite name="rightLamp" type="lamp-right" />
    <Sprite name="torso" type="torso" />
    <Sprite name="front" type="head-front" />
    <Sprite name="left" type="head-left" />
    {/* The globe is stationary; it never travels with the paw. */}
    <Sprite name="glassBack" type="orb-back" />
    <Sprite name="paw" type="paw" />
    <Sprite name="glassFront" type="orb-front" />
  </div>;
}
