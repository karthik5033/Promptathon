'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHARACTERS, CharacterId } from '@/lib/gameConfig';

export default function CharacterSelectPage() {
  const [selectedId, setSelectedId] = useState<CharacterId>('robot');
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('selectedCharacter');
    if (saved) setSelectedId(saved as CharacterId);
  }, []);

  const handleSelect = (id: CharacterId) => {
    setSelectedId(id);
    localStorage.setItem('selectedCharacter', id);
  };

  const handleStart = () => {
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white font-mono p-8 flex flex-col items-center">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
          CHOOSE YOUR LEGEND
        </h1>
        <p className="text-gray-400 text-sm md:text-lg uppercase tracking-widest">
          Each hero shaped computing history
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl w-full mb-16">
        {CHARACTERS.map((char) => (
          <div 
            key={char.id}
            onClick={() => handleSelect(char.id)}
            className={`
              relative p-4 rounded-xl bg-gray-900 border-2 transition-all duration-300 cursor-pointer
              ${selectedId === char.id 
                ? `border-[${char.color}] ring-2 ring-[${char.color}] shadow-2xl scale-105 z-10` 
                : 'border-white/10 hover:border-white/30'}
            `}
            style={{ 
              borderColor: selectedId === char.id ? char.color : undefined,
              boxShadow: selectedId === char.id ? `0 0 20px ${char.color}44` : undefined
            }}
          >
            <div className="h-32 flex items-center justify-center mb-4 bg-black/40 rounded-lg overflow-hidden">
               <CharacterPreview characterId={char.id} color={char.color} />
            </div>
            
            <h3 className="text-xl font-bold mb-1 truncate">{char.name}</h3>
            <p className="text-[10px] text-gray-500 mb-4 h-8 transition-colors">
              {char.description}
            </p>

            <button 
              className={`
                w-full py-2 text-[10px] uppercase font-bold rounded flex items-center justify-center gap-2
                ${selectedId === char.id ? 'bg-white text-black' : 'bg-gray-800 text-gray-400'}
              `}
            >
              {selectedId === char.id ? 'SELECTED ✓' : 'SELECT'}
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={handleStart}
        className="group relative px-12 py-4 bg-white text-black font-black text-xl hover:scale-110 active:scale-95 transition-all"
      >
        <span className="relative z-10 flex items-center gap-3">
          START GAME →
        </span>
        <div className="absolute inset-0 bg-white blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
      </button>

      <style jsx>{`
        .grid::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function CharacterPreview({ characterId, color }: { characterId: CharacterId, color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Setup units based on a 36x40 player at 0.6 scale inside 80x100
    const w = 36;
    const h = 40;
    const u = w / 10;
    const v = h / 16;
    
    ctx.save();
    ctx.translate(canvas.width/2 - (w * 0.8)/2, canvas.height/2 - (h * 0.8)/2);
    ctx.scale(1.2, 1.2); // scaled up for preview visibility

    const stride = 1.5;
    const frames = 0;

    // Drawing methods translated to functional preview
    switch(characterId) {
      case 'mario':
        drawMario(ctx, u, v, stride);
        break;
      case 'bill':
        drawBill(ctx, u, v, stride);
        break;
      case 'robot':
        drawRobot(ctx, u, v, stride);
        break;
      case 'ada':
        drawAda(ctx, u, v, stride);
        break;
      case 'linus':
        drawLinus(ctx, u, v, stride);
        break;
    }
    
    ctx.restore();
  }, [characterId]);

  return <canvas ref={canvasRef} width={80} height={100} />;
}

// Private drawing helpers for preview (scoped to file)
function drawMario(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
    ctx.fillStyle = '#5c3a21'; ctx.fillRect(1*u, 2.5*v, 7*u, 2*v);
    ctx.fillStyle = '#e52521'; ctx.fillRect(2*u, 0, 6*u, 2*v); ctx.fillRect(u, 1.8*v, 8.5*u, 1.2*v);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(4*u, 0.5*v, 2*u, 1*v);
    ctx.fillStyle = '#e52521'; ctx.fillRect(4.8*u, 0.7*v, 0.4*u, 0.8*v);
    ctx.fillStyle = '#ffcca6'; ctx.fillRect(2*u, 3*v, 6*u, 3.5*v);
    ctx.fillStyle = '#000'; ctx.fillRect(3.5*u, 3.8*v, 1*u, 1.2*v); ctx.fillRect(6.5*u, 3.8*v, 1*u, 1.2*v);
    ctx.fillStyle = '#f0a07a'; ctx.fillRect(4.5*u, 5*v, 2*u, 1*v);
    ctx.fillStyle = '#442b1a'; ctx.fillRect(2*u, 5.5*v, 6.5*u, 1.5*v); ctx.fillRect(1.5*u, 6.2*v, 1.5*u, 0.8*v);
    ctx.fillStyle = '#0043bb'; ctx.fillRect(2*u, 7*v, 6*u, 4.5*v);
    ctx.fillRect(2.8*u, 6.5*v, 1.2*u, 1.5*v); ctx.fillRect(6*u, 6.5*v, 1.2*u, 1.5*v);
    ctx.fillStyle = '#f6c90e'; ctx.fillRect(3*u, 8.5*v, u*0.8, u*0.8); ctx.fillRect(6.2*u, 8.5*v, u*0.8, u*0.8);
    ctx.fillStyle = '#e52521'; ctx.fillRect(1*u, 7.5*v, 1.5*u, 2.5*v); ctx.fillRect(7.5*u, 7.5*v, 1.5*u, 2.5*v);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0.5*u, 9.5*v, 2*u, 1.8*v); ctx.fillRect(7.5*u, 9.5*v, 2*u, 1.8*v);
    ctx.fillStyle = '#0043bb'; ctx.fillRect((2 - stride/2)*u, 11.5*v, 2.2*u, 2.5*v); ctx.fillRect((5.8 + stride/2)*u, 11.5*v, 2.2*u, 2.5*v);
    ctx.fillStyle = '#442b1a'; ctx.fillRect((1.5 - stride/2)*u, 14*v, 3.5*u, 2*v); ctx.fillRect((5 + stride/2)*u, 14*v, 3.5*u, 2*v);
}

function drawBill(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
    ctx.fillStyle = '#442b1a'; ctx.fillRect(1.5*u, 0, 7*u, 2.5*v); ctx.fillRect(1*u, 1*v, u, 2*v); ctx.fillRect(8*u, 1*v, u, 2*v);
    ctx.fillStyle = '#ffcca6'; ctx.fillRect(2*u, 1.5*v, 6*u, 4.5*v);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.strokeRect(2.5*u, 2.5*v, 2*u, 1.5*v); ctx.strokeRect(5.5*u, 2.5*v, 2*u, 1.5*v);
    ctx.fillStyle = 'rgba(100,200,255,0.2)'; ctx.fillRect(2.5*u, 2.5*v, 2*u, 1.5*v); ctx.fillRect(5.5*u, 2.5*v, 2*u, 1.5*v);
    ctx.beginPath(); ctx.strokeStyle = '#DAA520'; ctx.moveTo(4.5*u, 3*v); ctx.lineTo(5.5*u, 3*v); ctx.stroke();
    ctx.fillStyle = '#1e3a5f'; ctx.fillRect(1*u, 6*v, 8*u, 5.5*v);
    ctx.fillStyle = '#2c5282'; ctx.beginPath(); ctx.moveTo(4*u, 6*v); ctx.lineTo(3*u, 9*v); ctx.lineTo(4*u, 9*v); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6*u, 6*v); ctx.lineTo(7*u, 9*v); ctx.lineTo(6*u, 9*v); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(4.2*u, 6*v, 1.6*u, 4.5*v);
    ctx.fillStyle = '#2b6cb0'; ctx.fillRect(4.6*u, 6.5*v, 0.8*u, 4*v);
    ctx.fillStyle = '#1e3a5f'; ctx.fillRect(0.5*u, 6*v, 1*u, 3*v); ctx.fillRect(8.5*u, 6*v, 1*u, 3*v);
    ctx.fillStyle = '#ffcca6'; ctx.fillRect(0.3*u, 8.5*v, 1.4*u, 1.5*v); ctx.fillRect(8.3*u, 8.5*v, 1.4*u, 1.5*v);
    ctx.fillStyle = '#2c5282'; ctx.fillRect((2.2 - stride/2)*u, 11*v, 2.2*u, 3*v); ctx.fillRect((5.6 + stride/2)*u, 11*v, 2.2*u, 3*v);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect((1.8 - stride/2)*u, 14*v, 3*u, 2*v); ctx.fillRect((5.2 + stride/2)*u, 14*v, 3*u, 2*v);
}

function drawRobot(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
    ctx.fillStyle = '#cbd5e0'; ctx.fillRect(2.5*u, 0, 5*u, 4.5*v);
    ctx.fillStyle = '#718096'; ctx.fillRect(2.5*u, 0, 0.5*u, 4.5*v); ctx.fillRect(7*u, 0, 0.5*u, 4.5*v);
    ctx.fillStyle = '#1a202c'; ctx.fillRect(3.2*u, 1*v, 3.6*u, 2.5*v);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(3.8*u, 1.8*v, 0.8*u, 0.8*v); ctx.fillRect(5.4*u, 1.8*v, 0.8*u, 0.8*v);
    ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(3*u, 0); ctx.lineTo(2*u, -1.5*v); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7*u, 0); ctx.lineTo(8*u, -1.5*v); ctx.stroke();
    ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(2*u, -1.5*v, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#00ff00'; ctx.beginPath(); ctx.arc(8*u, -1.5*v, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#a0aec0'; ctx.fillRect(2*u, 5*v, 6*u, 5.5*v);
    ctx.fillStyle = '#2c5282'; ctx.fillRect(3.5*u, 6.2*v, 3*u, 3*v);
    ctx.fillStyle = '#ffffff'; ctx.font = `bold ${u*0.8}px sans-serif`; ctx.fillText('IEEE', 3.8*u, 8.2*v);
    ctx.fillStyle = '#718096'; ctx.fillRect(1*u, 5.5*v, 1*u, 3.5*v); ctx.fillRect(8*u, 5.5*v, 1*u, 3.5*v);
    ctx.fillStyle = '#4a5568'; ctx.beginPath(); ctx.arc(1*u, 8*v, 1.2*u, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(9*u, 8*v, 1.2*u, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#2d3748'; ctx.fillRect((2.2 - stride/2)*u, 11*v, 2.5*u, 3.5*v); ctx.fillRect((5.3 + stride/2)*u, 11*v, 2.5*u, 3.5*v);
    ctx.fillStyle = '#1a202c'; ctx.beginPath(); ctx.arc((3.4 - stride/2)*u, 14.5*v, 1.2*u, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc((6.5 + stride/2)*u, 14.5*v, 1.2*u, 0, Math.PI*2); ctx.fill();
}

function drawAda(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
    ctx.fillStyle = '#2c1810'; ctx.beginPath(); ctx.ellipse(5*u, 2*v, 3.5*u, 2.5*v, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5*u, 3*v, 1.2*u, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(7.5*u, 3*v, 1.2*u, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f0c8a0'; ctx.fillRect(3*u, 2*v, 4*u, 4.5*v);
    ctx.fillStyle = '#1a0b05'; ctx.fillRect(3.8*u, 3.5*v, 0.8*u, 0.8*v); ctx.fillRect(5.4*u, 3.5*v, 0.8*u, 0.8*v);
    ctx.fillStyle = '#44337a'; ctx.fillRect(2.5*u, 6.5*v, 5*u, 4*v);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(3*u, 6.5*v, 4*u, 0.6*v);
    ctx.fillStyle = '#553c9a'; ctx.beginPath(); ctx.moveTo(2.5*u, 10.5*v); ctx.lineTo(7.5*u, 10.5*v); ctx.lineTo(9.5*u, 16*v); ctx.lineTo(0.5*u, 16*v); ctx.fill();
    ctx.fillStyle = '#f0c8a0'; ctx.fillRect(1.5*u, 7*v, 1.2*u, 2.5*v); ctx.fillRect(7.3*u, 7*v, 1.2*u, 2.5*v);
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(7.5*u, 8*v, 2.5*u, 3.5*v);
    ctx.strokeStyle = '#d97706'; ctx.strokeRect(7.5*u, 8*v, 2.5*u, 3.5*v);
}

function drawLinus(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(1.5*u, 0, 7.5*u, 2.5*v); ctx.fillRect(1*u, 1*v, 1.2*u, 3*v); ctx.fillRect(8*u, 1*v, 1.2*u, 3*v);
    ctx.fillStyle = '#ffcca6'; ctx.fillRect(2*u, 2.5*v, 6*u, 3.8*v);
    ctx.fillStyle = '#000'; ctx.fillRect(3.2*u, 3.8*v, 1.2*u, 1*v); ctx.fillRect(6.2*u, 3.8*v, 1.2*u, 1*v);
    ctx.fillStyle = '#2d3748'; ctx.fillRect(1*u, 6.5*v, 8*u, 5*v);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(4.8*u, 6.5*v, 0.2*u, 2.5*v); ctx.fillRect(5.4*u, 6.5*v, 0.2*u, 2.5*v);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(4*u, 8*v, 2.5*u, 2.3*v);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(4.5*u, 8.2*v, 1.5*u, 1*v);
    ctx.fillStyle = '#f6c90e'; ctx.fillRect(5*u, 9.5*v, 0.6*u, 0.5*v);
    ctx.fillStyle = '#2d3748'; ctx.fillRect(0.2*u, 7*v, 1.2*u, 3*v); ctx.fillRect(8.6*u, 7*v, 1.2*u, 3*v);
    ctx.fillStyle = '#ffcca6'; ctx.fillRect(0*u, 9.5*v, 1.4*u, 1.4*v); ctx.fillRect(8.6*u, 9.5*v, 1.4*u, 1.4*v);
    ctx.fillStyle = '#2b4490'; ctx.fillRect((2.2 - stride/2)*u, 11.5*v, 2.3*u, 3*v); ctx.fillRect((5.5 + stride/2)*u, 11.5*v, 2.3*u, 3*v);
    ctx.fillStyle = '#ffffff'; ctx.fillRect((1.8 - stride/2)*u, 14.5*v, 3.2*u, 1.5*v); ctx.fillRect((5 + stride/2)*u, 14.5*v, 3.2*u, 1.5*v);
    ctx.fillStyle = '#e52521'; ctx.fillRect((1.8 - stride/2)*u, 15.2*v, 3.2*u, 0.8*v); ctx.fillRect((5 + stride/2)*u, 15.2*v, 3.2*u, 0.8*v);
}
