"use client";
import React from 'react';

export type HintUrgency = "NOW" | "SOON" | "SAFE";

interface HintOverlayProps {
  urgency: HintUrgency;
  playerPos: { x: number; y: number } | null;
  enabled: boolean;
}

export const HintOverlay: React.FC<HintOverlayProps> = ({ urgency, playerPos, enabled }) => {
  if (!enabled || urgency === "SAFE" || !playerPos) return null;

  return (
    <div 
      className={`absolute z-40 pointer-events-none flex flex-col items-center justify-end transform -translate-x-1/2 -translate-y-[100%] pb-4 transition-all ${
        urgency === "NOW" ? "animate-pulse" : "animate-bounce"
      }`}
      style={{ left: `${playerPos.x}px`, top: `${playerPos.y - 10}px` }}
    >
      {urgency === "NOW" ? (
        <>
          <span className="text-red-500 font-extrabold text-lg drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">JUMP!</span>
          <span className="text-red-500 text-3xl drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">⬇</span>
        </>
      ) : (
        <>
          <span className="text-yellow-400 font-bold text-sm drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">READY</span>
          <span className="text-yellow-400 text-2xl drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">⬇</span>
        </>
      )}
    </div>
  );
};
