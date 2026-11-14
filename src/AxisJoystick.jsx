import React, {useRef, useState} from "react";
import "./AxisJoystick.css";

/** Single-axis, pointer-captured controller shared by Yacht Dash and Tunnel Drill.
 * A direction fires on entering a side, and an explicit release clears holds.
 * Switching modes never changes the game's keyboard or existing mechanics. */
export default function AxisJoystick({axis="horizontal",onDirection,onRelease,disabled=false,label="Joystick"}){
  const pointer=useRef(null),active=useRef(0),handlers=useRef({onDirection,onRelease});
  const [knob,setKnob]=useState(0);
  handlers.current={onDirection,onRelease};
  const vertical=axis==="vertical";
  const reset=()=>{
    pointer.current=null;
    if(active.current){active.current=0;handlers.current.onRelease?.();}
    setKnob(0);
  };
  const read=e=>{
    if(pointer.current!==e.pointerId || disabled)return;
    const rect=e.currentTarget.getBoundingClientRect();
    const amount=vertical?e.clientY-(rect.top+rect.height/2):e.clientX-(rect.left+rect.width/2);
    const max=(vertical?rect.height:rect.width)*.25;
    setKnob(Math.max(-max,Math.min(max,amount)));
    const next=Math.abs(amount)>10?Math.sign(amount):0;
    if(next!==active.current){
      if(active.current)handlers.current.onRelease?.();
      active.current=next;
      if(next)handlers.current.onDirection?.(next);
    }
  };
  return <div className={"axis-stick"+(vertical?" axis-stick-vertical":"")} role="group"
      aria-label={label+" "+(vertical?"up and down":"left and right")}>
    <div className="axis-stick-track" onPointerDown={e=>{
        if(disabled||pointer.current!==null)return;
        e.preventDefault();pointer.current=e.pointerId;
        e.currentTarget.setPointerCapture?.(e.pointerId);read(e);
      }} onPointerMove={e=>{if(pointer.current===e.pointerId){e.preventDefault();read(e);}}}
      onPointerUp={e=>{if(pointer.current===e.pointerId)reset();}}
      onPointerCancel={e=>{if(pointer.current===e.pointerId)reset();}}
      onLostPointerCapture={e=>{if(pointer.current===e.pointerId)reset();}}>
      <span className="axis-stick-rail" aria-hidden="true"/>
      <span className="axis-stick-knob" style={{transform:vertical?
        `translate(-50%, calc(-50% + ${knob}px))`:
        `translate(calc(-50% + ${knob}px), -50%)`}} aria-hidden="true"/>
    </div>
  </div>;
}
