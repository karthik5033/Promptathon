'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CHARACTERS, CharacterId } from '@/lib/gameConfig';
import { drawMario, drawBill, drawRobot, drawAda, drawLinus } from '@/components/game/CharacterRenderer';

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
        drawMario(ctx, w, h, frames, true);
        break;
      case 'bill':
        drawBill(ctx, w, h, frames, true);
        break;
      case 'robot':
        drawRobot(ctx, w, h, frames, true);
        break;
      case 'ada':
        drawAda(ctx, w, h, frames, true);
        break;
      case 'linus':
        drawLinus(ctx, w, h, frames, true);
        break;
    }
    
    ctx.restore();
  }, [characterId]);

  return <canvas ref={canvasRef} width={80} height={100} />;
}
<<<<<<< HEAD
=======

// Private drawing helpers for preview (scoped to file)
function drawMario(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
  // Hat with shade
  ctx.fillStyle = '#e52521';
  ctx.fillRect(2*u, 0, 6*u, 2*v);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(1*u, 1.8*v, 8*u, 0.8*v);
  ctx.fillStyle = '#e52521';
  ctx.fillRect(1*u, 2*v, 8*u, 1*v);

  // Hair / Sideburns
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(1.5*u, 3*v, 1*u, 2*v);
  ctx.fillRect(7.5*u, 3*v, 1*u, 2*v);

  // Face
  ctx.fillStyle = '#ffcca6';
  ctx.fillRect(2*u, 3*v, 6*u, 3.5*v);

  // Mustache
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(2.5*u, 5.2*v, 5*u, 0.8*v);
  ctx.fillRect(1.5*u, 4.8*v, 1.5*u, 1.2*v);

  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(3.2*u, 3.8*v, 1*u, 1.2*v);
  ctx.fillRect(5.8*u, 3.8*v, 1*u, 1.2*v);

  // Overalls body
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(2.2*u, 6.5*v, 5.6*u, 5*v);

  // Yellow Buttons
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(3.2*u, 7.5*v, 0.8*u, 0.8*v);
  ctx.fillRect(6*u, 7.5*v, 0.8*u, 0.8*v);

  // Red shirt sleeves
  ctx.fillStyle = '#e52521';
  ctx.fillRect(0.5*u, 7*v, 2*u, 3*v);
  ctx.fillRect(7.5*u, 7*v, 2*u, 3*v);

  // Overall straps
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(3.2*u, 6*v, 1.2*u, 1.5*v);
  ctx.fillRect(5.6*u, 6*v, 1.2*u, 1.5*v);

  // Hands
  ctx.fillStyle = '#ffcca6';
  ctx.fillRect(0, 9*v, 1.8*u, 1.8*v);
  ctx.fillRect(8.2*u, 9*v, 1.8*u, 1.8*v);

  // Legs and Boots
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect((2.2 - stride)*u, 11*v, 2.5*u, 3*v);
  ctx.fillRect((5.3 + stride)*u, 11*v, 2.5*u, 3*v);
  ctx.fillStyle = '#451a03';
  ctx.fillRect((1.8 - stride)*u, 13.8*v, 3.2*u, 2.2*v);
  ctx.fillRect((5 + stride)*u, 13.8*v, 3.2*u, 2.2*v);
}

function drawBill(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
  // Hair shaded
  ctx.fillStyle = '#451a03';
  ctx.fillRect(2*u, 0, 6*u, 1.5*v);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(2.5*u, 0.2*v, 5*u, 0.5*v);

  // Face
  ctx.fillStyle = '#ffcca6';
  ctx.fillRect(2*u, 1.5*v, 6*u, 4.5*v);

  // Glasses — with bridge
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.strokeRect(2.5*u, 2.8*v, 2.2*u, 1.8*v);
  ctx.strokeRect(5.3*u, 2.8*v, 2.2*u, 1.8*v);
  ctx.beginPath(); ctx.moveTo(4.7*u, 3.5*v); ctx.lineTo(5.3*u, 3.5*v); ctx.stroke();
  ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
  ctx.fillRect(2.5*u, 2.8*v, 2.2*u, 1.8*v);
  ctx.fillRect(5.3*u, 2.8*v, 2.2*u, 1.8*v);

  // Smile
  ctx.strokeStyle = '#c0835a';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(5*u, 5.2*v, 1.2*u, 0.2, Math.PI - 0.2); ctx.stroke();

  // Suit jacket with lapels
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(1*u, 6*v, 8*u, 5.5*v);
  ctx.fillStyle = '#1e40af';
  ctx.fillRect(1*u, 6*v, 2.5*u, 5*v);
  ctx.fillRect(6.5*u, 6*v, 2.5*u, 5*v);

  // White shirt collar and tie
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(4*u, 6*v); ctx.lineTo(6*u, 6*v); ctx.lineTo(5*u, 8*v); ctx.fill();
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(4.7*u, 6*v, 0.6*u, 4.5*v);
  ctx.beginPath(); ctx.moveTo(4.7*u, 10.5*v); ctx.lineTo(5.3*u, 10.5*v); ctx.lineTo(5*u, 11*v); ctx.fill();

  // Hands
  ctx.fillStyle = '#ffcca6';
  ctx.fillRect(0, 8.5*v, 1.8*u, 1.8*v);
  ctx.fillRect(8.2*u, 8.5*v, 1.8*u, 1.8*v);

  // Legs and Shoes
  ctx.fillStyle = '#172554';
  ctx.fillRect((2.2 - stride)*u, 11.5*v, 2.5*u, 3*v);
  ctx.fillRect((5.3 + stride)*u, 11.5*v, 2.5*u, 3*v);
  ctx.fillStyle = '#020617';
  ctx.fillRect((1.8 - stride)*u, 14*v, 3.2*u, 2*v);
  ctx.fillRect((5 + stride)*u, 14*v, 3.2*u, 2*v);
}

function drawRobot(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
  // Metallic head with panel lines
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(2*u, 0, 6*u, 5*v);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(2.2*u, 0.2*v, 5.6*u, 1*v);

  // Eye screen
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(3*u, 1.5*v, 4*u, 2*v);
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(3.5*u, 2*v, 3*u, 1*v);

  // Antenna with signal pulse
  ctx.fillStyle = '#64748b';
  ctx.fillRect(4.8*u, -2.5*v, 0.4*u, 2.5*v);
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath(); ctx.arc(5*u, -2.5*v, 1.8, 0, Math.PI * 2); ctx.fill();

  // Body — armored suit
  ctx.fillStyle = '#334155';
  ctx.fillRect(1.5*u, 5.5*v, 7*u, 5*v);
  // Glowing circuit lines
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(2.5*u, 6*v); ctx.lineTo(2.5*u, 9*v); ctx.lineTo(4*u, 9*v); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7.5*u, 6*v); ctx.lineTo(7.5*u, 9*v); ctx.lineTo(6*u, 9*v); ctx.stroke();

  // Badge
  ctx.fillStyle = '#eab308';
  ctx.fillRect(4*u, 6.5*v, 2*u, 1.5*v);

  // Arms and Hands
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0.2*u, 6*v, 1.5*u, 3*v);
  ctx.fillRect(8.3*u, 6*v, 1.5*u, 3*v);
  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.arc(1*u, 9*v, 1.2*u, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9*u, 9*v, 1.2*u, 0, Math.PI * 2); ctx.fill();

  // Legs and Boots
  ctx.fillStyle = '#1e293b';
  ctx.fillRect((2.2 - stride)*u, 11*v, 2.5*u, 3.5*v);
  ctx.fillRect((5.3 + stride)*u, 11*v, 2.5*u, 3.5*v);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect((1.8 - stride)*u, 14*v, 3.2*u, 2*v);
  ctx.fillRect((5 + stride)*u, 14*v, 3.2*u, 2*v);
}

function drawAda(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
  // Hair updo with details
  ctx.fillStyle = '#1a0d0a';
  ctx.fillRect(2*u, 0, 6*u, 2.5*v);
  ctx.beginPath(); ctx.arc(5*u, 1.5*v, 3.5*u, Math.PI, 0); ctx.fill();
  // Tiny ribbon
  ctx.fillStyle = '#ec4899';
  ctx.fillRect(4.5*u, 0, 1*u, 1*v);

  // Face
  ctx.fillStyle = '#f0c8a0';
  ctx.fillRect(2.5*u, 2.5*v, 5*u, 4.5*v);

  // Eyes with lashes
  ctx.fillStyle = '#1a0d0a';
  ctx.fillRect(3.5*u, 4*v, 1*u, 0.8*v);
  ctx.fillRect(6*u, 4*v, 1*u, 0.8*v);

  // Victorian dress — top with lace
  ctx.fillStyle = '#581c87';
  ctx.fillRect(2*u, 7*v, 6*u, 4*v);
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(3.5*u, 7*v, 3*u, 0.5*v);

  // Dress — wide layered skirt
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.moveTo(0*u, 11*v); ctx.lineTo(10*u, 11*v); 
  ctx.lineTo(11*u, 16*v); ctx.lineTo(-1*u, 16*v); ctx.fill();

  // Scroll with text
  ctx.fillStyle = '#feefc3';
  ctx.fillRect(8.5*u, 7.5*v, 2.2*u, 4*v);
  ctx.strokeStyle = '#92400e'; ctx.strokeRect(8.5*u, 7.5*v, 2.2*u, 4*v);
}

function drawLinus(ctx: CanvasRenderingContext2D, u: number, v: number, stride: number) {
  // Messy hair with highlights
  ctx.fillStyle = '#111';
  ctx.fillRect(1*u, 0, 8*u, 2.5*v);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(1.5*u, 0.5*v, 2*u, 0.5*v);

  // Face
  ctx.fillStyle = '#ffcca6';
  ctx.fillRect(2*u, 2*v, 6*u, 4.5*v);

  // Glasses and Beard
  ctx.strokeStyle = '#333'; ctx.strokeRect(2.8*u, 3.2*v, 1.8*u, 1.2*v); ctx.strokeRect(5.4*u, 3.2*v, 1.8*u, 1.2*v);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(2*u, 5.5*v, 6*u, 1.5*v);

  // Hoodie with drawstrings
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(1*u, 6.5*v, 8*u, 6*v);
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(4.2*u, 7.5*v, 0.2*u, 2*v);
  ctx.fillRect(5.6*u, 7.5*v, 0.2*u, 2*v);

  // Linux text
  ctx.fillStyle = '#fbbf24';
  ctx.font = `bold ${u*1.2}px font-mono`;
  ctx.fillText('LINUX', 2.3*u, 11*v);

  // Hands and Jeans
  ctx.fillStyle = '#ffcca6';
  ctx.fillRect(0, 9*v, 1.8*u, 1.8*v);
  ctx.fillRect(8.2*u, 9*v, 1.8*u, 1.8*v);
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect((2.2 - stride)*u, 12*v, 2.5*u, 3*v);
  ctx.fillRect((5.3 + stride)*u, 12*v, 2.5*u, 3*v);

  // Premium Sneakers
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect((1.8 - stride)*u, 14.5*v, 3.2*u, 2*v);
  ctx.fillRect((5 + stride)*u, 14.5*v, 3.2*u, 2*v);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect((1.8 - stride)*u, 15.5*v, 3.2*u, 0.5*v);
  ctx.fillRect((5 + stride)*u, 15.5*v, 3.2*u, 0.5*v);
}
>>>>>>> 1b1d55efa9f74e20d1fca125e7e41590edc3d567
