"use client";

import React, { useRef, useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Player } from './Player';
import { Particle } from './ParticleSystem';
import { Cloud } from './Cloud';
import { Obstacle } from './Obstacle';
import { Platform } from './Platform';
import { EraManager } from './EraManager';
import { HUD } from './HUD';
import { GAME_CONFIG, ERAS, EraConfig } from '@/lib/gameConfig';
import { saveToLeaderboard } from '@/lib/leaderboard';
import { IEEECoin } from './IEEECoin';
import { DataBit, ShieldPowerUp } from './Collectibles';

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

interface State {
  status: GameState;
  eraRenderData: EraConfig | null;
  bannerVisible: boolean;
}

type Action = 
  | { type: 'START' }
  | { type: 'GAME_OVER' }
  | { type: 'RESTART' }
  | { type: 'SAVE_SCORE' }
  | { type: 'CHANGE_ERA'; data: EraConfig }
  | { type: 'HIDE_BANNER' };

const initialState: State = {
  status: 'MENU',
  eraRenderData: ERAS[0],
  bannerVisible: true
};

function gameReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return { ...state, status: 'PLAYING', bannerVisible: true, eraRenderData: ERAS[0] };
    case 'GAME_OVER':
      return { ...state, status: 'GAME_OVER' };
    case 'RESTART':
      return { ...initialState, status: 'PLAYING' };
    case 'SAVE_SCORE':
      return { ...state, status: 'MENU' };
    case 'CHANGE_ERA':
      return { ...state, eraRenderData: action.data, bannerVisible: true };
    case 'HIDE_BANNER':
      return { ...state, bannerVisible: false };
    default:
      return state;
  }
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const keys = useKeyboard();
  const router = useRouter();

  const gRef = useRef({
    score: 0,
    currentSpeed: GAME_CONFIG.baseSpeed,
    frames: 0,
    combo: 0,
    comboMultiplier: 1,
    lastComboTime: 0
  });

  const playerRef = useRef<Player | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const dataBitsRef = useRef<DataBit[]>([]);
  const shieldsRef = useRef<ShieldPowerUp[]>([]);
  const eraManagerRef = useRef<EraManager | null>(null);
  const coinRef = useRef<IEEECoin | null>(null);
  
  const [showIEEEBanner, setShowIEEEBanner] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [speedMode, setSpeedMode] = useState<'AUTO' | 'CUSTOM'>('AUTO');
  const [customSpeed, setCustomSpeed] = useState<number>(3.0);

  const speedModeRef = useRef<'AUTO' | 'CUSTOM'>('AUTO');
  const customSpeedRef = useRef<number>(3.0);

  useEffect(() => { speedModeRef.current = speedMode; }, [speedMode]);
  useEffect(() => { customSpeedRef.current = customSpeed; }, [customSpeed]);

  useEffect(() => {
    dispatch({ type: 'START' });
    initGame();
  }, []);

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gRef.current = {
        score: 0,
        currentSpeed: GAME_CONFIG.baseSpeed,
        frames: 0,
        combo: 0,
        comboMultiplier: 1,
        lastComboTime: 0
    };

    playerRef.current = new Player(canvas);
    particlesRef.current = [];
    cloudsRef.current = [];
    obstaclesRef.current = [];
    platformsRef.current = [];
    dataBitsRef.current = [];
    shieldsRef.current = [];
    eraManagerRef.current = new EraManager();
    coinRef.current = null;

    for (let i = 0; i < 6; i++) {
        const cloud = new Cloud(canvas.width, canvas.height, GAME_CONFIG.baseSpeed);
        cloud.x = Math.random() * canvas.width;
        cloudsRef.current.push(cloud);
    }
  };

  useEffect(() => {
     if (state.bannerVisible && state.status === 'PLAYING') {
         const t = setTimeout(() => {
             dispatch({ type: 'HIDE_BANNER' });
         }, 3000);
         return () => clearTimeout(t);
     }
  }, [state.bannerVisible, state.status]);

  const updateHUD = () => {
      const g = gRef.current;
      const scoreEl = document.getElementById('hud-score');
      const speedEl = document.getElementById('hud-speed');
      const comboEl = document.getElementById('hud-combo');
      const comboContainerEl = document.getElementById('hud-combo-container');
      const shieldEl = document.getElementById('hud-shield');
      const djEl = document.getElementById('hud-doublejump');
      const eraNameEl = document.getElementById('hud-era-name');
      const eraYearsEl = document.getElementById('hud-era-years');

      if (scoreEl) scoreEl.innerText = Math.floor(g.score).toString().padStart(6, '0');
      if (speedEl) speedEl.innerText = g.currentSpeed.toFixed(1) + 'x';
      
      if (comboContainerEl && comboEl) {
          if (g.combo > 0) {
              comboContainerEl.style.display = 'block';
              comboEl.innerText = `${g.comboMultiplier}x COMBO 🔥 (${g.combo})`;
          } else {
              comboContainerEl.style.display = 'none';
          }
      }

      if (shieldEl && playerRef.current) {
          shieldEl.style.display = playerRef.current.hasShield ? 'inline-block' : 'none';
      }
      
      if (djEl && playerRef.current) {
          djEl.style.display = playerRef.current.canDoubleJump ? 'inline-block' : 'none';
      }

      if (eraManagerRef.current) {
          if (eraNameEl) eraNameEl.innerText = eraManagerRef.current.currentEra.name;
          if (eraYearsEl) eraYearsEl.innerText = eraManagerRef.current.currentEra.years;
      }
  };

  const handleEntities = (canvas: HTMLCanvasElement) => {
    const p = playerRef.current;
    const g = gRef.current;
    if (!p) return;

    if (g.frames % 250 === 0) cloudsRef.current.push(new Cloud(canvas.width, canvas.height, g.currentSpeed));

    cloudsRef.current.forEach(c => c.update());
    cloudsRef.current = cloudsRef.current.filter(c => !c.markedForDeletion);
    
    particlesRef.current.forEach(pt => pt.update(g.currentSpeed));
    particlesRef.current = particlesRef.current.filter(pt => !pt.markedForDeletion);

    const eraId = eraManagerRef.current?.currentEra.id || 1;

    // Obstacle and Platform Spawning
    const lastEntityX = Math.max(
       obstaclesRef.current.length > 0 ? obstaclesRef.current[obstaclesRef.current.length - 1].x : 0,
       platformsRef.current.length > 0 ? platformsRef.current[platformsRef.current.length - 1].x : 0
    );

    const canSpawnEntity = (canvas.width - lastEntityX > GAME_CONFIG.minObstacleGap);
    
    if (canSpawnEntity && Math.random() < GAME_CONFIG.obstacleSpawnChance) {
        if (Math.random() < 0.35) { // 35% chance to spawn platforms
             platformsRef.current.push(new Platform(canvas.width, canvas.height, eraId));
        } else {
             obstaclesRef.current.push(new Obstacle(canvas, eraId, g.currentSpeed));
        }
    }

    if (Math.random() < GAME_CONFIG.dataBitSpawnChance) {
      dataBitsRef.current.push(new DataBit(canvas.width, canvas.height, eraId, g.frames));
    }
    if (Math.random() < GAME_CONFIG.powerUpSpawnChance && !p.hasShield && shieldsRef.current.length === 0) {
      shieldsRef.current.push(new ShieldPowerUp(canvas.width, canvas.height, g.frames));
    }

    obstaclesRef.current.forEach(obs => {
        obs.update(g.currentSpeed);
        if (!obs.scored && obs.x + obs.width < p.x) {
            obs.scored = true;
        }
    });
    obstaclesRef.current = obstaclesRef.current.filter(obs => !obs.markedForDeletion);

    platformsRef.current.forEach(plat => plat.update(g.currentSpeed, g.frames));
    platformsRef.current = platformsRef.current.filter(plat => !plat.markedForDeletion);

    dataBitsRef.current.forEach(bit => bit.update(g.currentSpeed, g.frames));
    dataBitsRef.current = dataBitsRef.current.filter(bit => !bit.markedForDeletion && !bit.collected);

    shieldsRef.current.forEach(shield => shield.update(g.currentSpeed, g.frames));
    shieldsRef.current = shieldsRef.current.filter(shield => !shield.markedForDeletion && !shield.collected);

    if (Math.floor(g.score) === GAME_CONFIG.ieeeScore && !coinRef.current && !showIEEEBanner) {
        coinRef.current = new IEEECoin(canvas.width, canvas.height);
    }
    if (coinRef.current) {
        coinRef.current.update(g.currentSpeed, g.frames);
        if (coinRef.current.markedForDeletion) coinRef.current = null;
    }
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 20; i++) {
        particlesRef.current.push(new Particle(x, y, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, Math.random() * 4 + 2, color));
    }
  }

  const checkCollisions = () => {
    const g = gRef.current;
    if (!playerRef.current) return false;
    const p = playerRef.current;
    const px = p.x;
    const py = p.y;
    const pw = p.width;
    const ph = p.height;

    // Check if pushed completely off left screen bounds
    if (px < -pw) return true;

    // Obstacles
    for (const obs of obstaclesRef.current) {
        const oh = obs.getHitbox();
        if (px + 4 < oh.x + oh.width && px + pw - 4 > oh.x && py + 4 < oh.y + oh.height && py + ph - 4 > oh.y) {
            if (!p.hitObstacle()) {
                obs.markedForDeletion = true;
                createExplosion(oh.x + oh.width/2, oh.y + oh.height/2, '#3498db');
                g.combo = 0;
                g.comboMultiplier = 1;
            } else {
                return true; 
            }
        }
    }

    // DataBits
    for (const bit of dataBitsRef.current) {
      if (bit.collected) continue;
      const b = bit.getHitbox();
      if (px < b.x + b.width && px + pw > b.x && py < b.y + b.height && py + ph > b.y) {
          bit.collected = true;
          g.combo++;
          g.comboMultiplier = Math.min(1 + Math.floor(g.combo / 5), GAME_CONFIG.maxComboMultiplier);
          g.lastComboTime = g.frames;
          g.score += (GAME_CONFIG.dataBitValue * g.comboMultiplier);
          createExplosion(b.x + b.width/2, b.y + b.height/2, ERAS[bit.eraId - 1].collectibleColor);
      }
    }

    // Shields
    for (const shield of shieldsRef.current) {
      if (shield.collected) continue;
      const s = shield.getHitbox();
      if (px < s.x + s.width && px + pw > s.x && py < s.y + s.height && py + ph > s.y) {
          shield.collected = true;
          p.activateShield();
          createExplosion(s.x + s.width/2, s.y + s.height/2, '#3498db');
      }
    }

    // IEEE Coin
    if (coinRef.current) {
      const ch = coinRef.current.getHitbox();
      if (px < ch.x + ch.width && px + pw > ch.x && py < ch.y + ch.height && py + ph > ch.y) {
         coinRef.current = null;
         g.score += GAME_CONFIG.ieeeBonusPoints;
         setShowIEEEBanner(true);
         setTimeout(() => setShowIEEEBanner(false), 4000);
         createExplosion(ch.x + ch.width/2, ch.y + ch.height/2, '#f1c40f');
      }
    }

    return false;
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const era = eraManagerRef.current?.currentEra;
    const g = gRef.current;
    if (!era) return;

    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, era.bgTop); 
    grad.addColorStop(1, era.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = era.starColor;
    ctx.fillStyle = era.starColor;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.85, canvas.height * 0.25, 55 + Math.sin(g.frames * 0.02) * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    cloudsRef.current.forEach(c => c.draw(ctx));

    const groundY = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio);
    let groundGrad = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGrad.addColorStop(0, era.groundColor);
    groundGrad.addColorStop(1, '#050505');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, canvas.width, canvas.height * GAME_CONFIG.groundHeightRatio);
    
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,0.07)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for(let i = 0; i < canvas.width + 500; i+= 80) {
      const offset = (i - (g.frames * (g.currentSpeed * 0.5))) % 80;
      ctx.moveTo(offset + i, groundY);
      ctx.lineTo(offset + i - 200, canvas.height);
    }
    ctx.stroke();

    for(let j = 1; j < 5; j++) {
        const yLine = groundY + Math.pow(j, 1.5) * 10;
        if(yLine < canvas.height) {
            ctx.beginPath();
            ctx.moveTo(0, yLine);
            ctx.lineTo(canvas.width, yLine);
            ctx.stroke();
        }
    }
    ctx.restore();

    ctx.shadowBlur = 15;
    ctx.shadowColor = era.groundAccent;
    ctx.fillStyle = era.groundAccent;
    ctx.fillRect(0, groundY, canvas.width, 3);
    ctx.shadowBlur = 0;

    if (playerRef.current) {
        ctx.save();
        let p = playerRef.current;
        let shadowY = groundY;
        // Floor shadow based on absolute ground regardless of platforms
        let heightAboveGround = groundY - (p.y + p.height);
        let shadowAlpha = Math.max(0.0, 0.4 - (heightAboveGround * 0.002));
        if (shadowAlpha > 0) {
            let shadowWidth = p.width * 0.9 + (p.isGrounded ? Math.sin(g.frames * 0.3) * 3 : 0);
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(p.x + p.width/2, shadowY + 8, shadowWidth / 1.5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
  };

  useGameLoop((deltaTime) => {
    const canvas = canvasRef.current;
    const g = gRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (state.status === 'PLAYING') {
      g.frames++;
      
      if (g.frames - g.lastComboTime > GAME_CONFIG.comboDecayTime && g.combo > 0) {
          g.combo = 0;
          g.comboMultiplier = 1;
      }

      g.score += (0.1 * g.comboMultiplier);

      if (eraManagerRef.current) {
         eraManagerRef.current.update(g.score);
         if (eraManagerRef.current.eraChanged) {
            g.currentSpeed += GAME_CONFIG.eraSpeedBoost;
            const newEraProps = { ...eraManagerRef.current.currentEra };
            dispatch({ type: 'CHANGE_ERA', data: newEraProps });
         }
      }

      const isGameOver = checkCollisions();
      if (isGameOver) {
          dispatch({ type: 'GAME_OVER' });
          return;
      }
      
      if (speedModeRef.current === 'AUTO') {
          g.currentSpeed = Math.min(g.currentSpeed + (GAME_CONFIG.speedIncrement * 0.1), GAME_CONFIG.maxSpeed);
      } else {
          g.currentSpeed = customSpeedRef.current;
      }

      updateHUD();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawEnvironment(ctx, canvas);
      handleEntities(canvas);
      
      platformsRef.current.forEach(plat => plat.draw(ctx));
      dataBitsRef.current.forEach(b => b.draw(ctx, g.frames));
      shieldsRef.current.forEach(s => s.draw(ctx, g.frames));
      obstaclesRef.current.forEach(obs => obs.draw(ctx));
      particlesRef.current.forEach(p => p.draw(ctx));
      
      if (coinRef.current) coinRef.current.draw(ctx);

      if (playerRef.current) {
          playerRef.current.update(keys, g.frames, particlesRef.current, platformsRef.current, g.currentSpeed);
          playerRef.current.draw(ctx, g.frames, g.currentSpeed);
      }
    }
  }, state.status === 'PLAYING');

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
         canvasRef.current.width = window.innerWidth;
         canvasRef.current.height = window.innerHeight;
         if (playerRef.current) {
            const groundY = window.innerHeight - (window.innerHeight * GAME_CONFIG.groundHeightRatio);
            if (playerRef.current.isGrounded) {
                playerRef.current.y = groundY - playerRef.current.height;
            }
         }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveScore = () => {
     if (!playerName.trim()) return;
     const finalScore = gRef.current.score;
     saveToLeaderboard({ 
       name: playerName, 
       score: Math.floor(finalScore), 
       era_reached: state.eraRenderData?.name || "Unknown" 
     });
     dispatch({ type: 'SAVE_SCORE' });
     router.push('/leaderboard');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black font-sans selection:bg-purple-500/30">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {state.status === 'PLAYING' && state.eraRenderData && (
        <>
          <HUD />
          <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2 p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl shadow-lg">
             <div className="flex bg-gray-800 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setSpeedMode('AUTO')} 
                  className={`px-3 py-1 font-bold text-xs uppercase ${speedMode === 'AUTO' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >Auto</button>
                <button 
                  onClick={() => setSpeedMode('CUSTOM')} 
                  className={`px-3 py-1 font-bold text-xs uppercase ${speedMode === 'CUSTOM' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                >Custom</button>
             </div>
             {speedMode === 'CUSTOM' && (
                <div className="flex flex-col items-end">
                   <label className="text-white/60 text-[10px] uppercase font-bold mb-1">Set Speed: {customSpeed.toFixed(1)}x</label>
                   <input 
                     type="range" 
                     min="1" max="10" step="0.5" 
                     value={customSpeed} 
                     onChange={(e) => setCustomSpeed(parseFloat(e.target.value))} 
                     className="w-24 accent-purple-500 cursor-pointer"
                   />
                </div>
             )}
          </div>
        </>
      )}

      {state.eraRenderData && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-8 flex flex-col items-center justify-center transition-all duration-[2000ms] ease-out pointer-events-none drop-shadow-2xl ${state.bannerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
             <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
               <div className="relative bg-black/80 backdrop-blur-xl px-20 py-10 rounded-full border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] text-center overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: state.eraRenderData.groundAccent }}></div>
                  <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text tracking-[0.1em] uppercase mb-3 drop-shadow-sm" 
                      style={{ backgroundImage: `linear-gradient(to bottom right, #fff, ${state.eraRenderData.textColor})` }}>
                      {state.eraRenderData.name}
                  </h2>
                  <h3 className="text-2xl md:text-3xl text-gray-400 font-mono font-medium tracking-widest opacity-80">
                      {state.eraRenderData.years}
                  </h3>
                  <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: state.eraRenderData.groundAccent }}></div>
               </div>
             </div>
          </div>
      )}

      {showIEEEBanner && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-12 py-6 rounded-3xl shadow-[0_0_80px_rgba(250,204,21,0.8)] z-50 text-center animate-bounce border border-yellow-200 backdrop-blur-md pointer-events-none">
            <h2 className="text-5xl font-black tracking-tighter drop-shadow-sm">IEEE CompSoc 80th!</h2>
            <p className="text-xl font-bold text-yellow-950 mt-2 uppercase tracking-widest">+500 Points Secret</p>
        </div>
      )}

      {state.status === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center text-white z-50 p-4 transition-all duration-500 overflow-hidden">
          <div className="bg-[#0a0a0a] p-6 md:p-10 rounded-3xl border border-white/5 shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col items-center max-w-lg w-full max-h-[95vh] overflow-y-auto animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 uppercase tracking-tighter drop-shadow-sm shrink-0">
              GAME OVER
            </h1>
            
            <div className="w-full bg-black/50 rounded-2xl p-5 mb-5 border border-white/5 text-center shadow-inner mt-2 shrink-0">
              <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1 font-semibold">Final Score</p>
              <p className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {Math.floor(gRef.current.score).toLocaleString()}
              </p>
              <div className="h-px bg-white/10 w-full my-4"></div>
              <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1 font-semibold">Era Survived</p>
              <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                {state.eraRenderData?.name}
              </p>
            </div>
            
            <div className="flex flex-col gap-3 w-full shrink-0">
               <h3 className="text-gray-400 font-semibold mb-1 uppercase text-xs tracking-widest text-center">Save YOUR SCORE</h3>
              <input 
                type="text" 
                placeholder="Enter Hacker Alias..." 
                className="w-full bg-white/5 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-lg text-center border focus:border-blue-500 focus:outline-none font-mono transition-all font-bold shadow-inner border-white/10 focus:ring-4 focus:ring-blue-500/20"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveScore()}
              />
              <button 
                onClick={saveScore} 
                className="w-full text-lg py-3 bg-white text-black hover:scale-[1.02] active:scale-95 rounded-xl font-black shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!playerName.trim()}
              >
                Upload
              </button>
              <div className="flex gap-3 mt-2">
                  <button 
                    onClick={() => { initGame(); dispatch({ type: 'RESTART' }); setPlayerName(""); setShowIEEEBanner(false); }} 
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-3 font-bold transition-all text-gray-300 text-sm uppercase"
                  >
                    Reboot
                  </button>
                  <button 
                    onClick={() => router.push('/')} 
                    className="flex-1 border border-white/5 hover:bg-white/5 rounded-xl py-3 font-bold transition-all text-gray-500 hover:text-white text-sm uppercase"
                  >
                    Disconnect
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
