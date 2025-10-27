// src/components/StatBar.jsx
import React from "react";

export default function StatBar({ label, value }){
  const pct = Math.min(100, Math.round((value/200)*100));
  const level = value >= 120 ? "high" : value >= 70 ? "mid" : "low";
  const color = level === "high" ? "#ef4444" : level === "mid" ? "#f59e0b" : "#22c55e";
  return (
    <div style={{display:"grid",gridTemplateColumns:"80px 1fr 36px",gap:8,alignItems:"center"}}>
      <div>{label.toUpperCase()}</div>
      <div style={{height:8,background:"#e4ecff",border:"1px solid #b0c3f1",borderRadius:8,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color}} />
      </div>
      <div>{value}</div>
    </div>
  );
}