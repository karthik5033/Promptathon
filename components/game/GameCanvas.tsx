"use client";

import React, { useRef, useEffect, useReducer, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Player } from './Player';
import { Particle } from './ParticleSystem';
import { Cloud } from './Cloud';
import { Obstacle } from './Obstacle';
import { EraManager } from './EraManager';
import { HUD } from './HUD';
import { GAME_CONFIG, ERAS } from '@/lib/gameConfig';
import { saveToLeaderboard } from '@/lib/leaderboard';
import { IEEECoin } from './IEEECoin';
import { DataBit, ShieldPowerUp } from './Collectibles';

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

interface State {
  status: GameState;
  score: number;
  currentSpeed: number;
  frames: number;
  combo: number;
  comboMultiplier: number;
  lastComboTime: number;
  eraRenderData: { id: number; name: string; years: string } | null;
  bannerVisible: boolean;
}

type Action = 
  | { type: 'START' }
  | { type: 'GAME_OVER' }
  | { type: 'RESTART' }
  | { type: 'SAVE_SCORE' }
  | { type: 'CHANGE_ERA'; data: { id: number; name: string; years: string } }
  | { type: 'HIDE_BANNER' }
  | { type: 'TICK'; scoreBonus?: number; tickSpeed: number; doComboReset?: boolean; doComboAdd?: boolean };

const initialState: State = {
  status: 'MENU',
  score: 0,
  currentSpeed: GAME_CONFIG.baseSpeed,
  frames: 0,
  combo: 0,
  comboMultiplier: 1,
  lastComboTime: 0,
  eraRenderData: ERAS[0],
  bannerVisible: true // show initial
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
    case 'TICK':
      let newCombo = state.combo;
      let newMult = state.comboMultiplier;

      if (action.doComboReset) {
         newCombo = 0;
         newMult = 1;
      } else if (action.doComboAdd) {
         newCombo++;
         newMult = Math.min(1 + Math.floor(newCombo / 5), GAME_CONFIG.maxComboMultiplier);
      } else if (state.frames - state.lastComboTime > GAME_CONFIG.comboDecayTime && state.combo > 0) {
         newCombo = 0;
         newMult = 1;
      }

      return { 
        ...state, 
        frames: state.frames + 1,
        score: state.score + (0.1 * state.comboMultiplier) + (action.scoreBonus || 0) + (action.doComboAdd ? (GAME_CONFIG.dataBitValue * newMult) : 0),
        currentSpeed: action.tickSpeed,
        combo: newCombo,
        comboMultiplier: newMult,
        lastComboTime: action.doComboAdd ? state.frames : state.lastComboTime
      };
    default:
      return state;
  }
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const keys = useKeyboard();
  const router = useRouter();

  const playerRef = useRef<Player | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const dataBitsRef = useRef<DataBit[]>([]);
  const shieldsRef = useRef<ShieldPowerUp[]>([]);
  const eraManagerRef = useRef<EraManager | null>(null);
  const coinRef = useRef<IEEECoin | null>(null);
  
  const [showIEEEBanner, setShowIEEEBanner] = useState(false);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    dispatch({ type: 'START' });
    initGame();
  }, []);

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    playerRef.current = new Player(canvas);
    particlesRef.current = [];
    cloudsRef.current = [];
    obstaclesRef.current = [];
    dataBitsRef.current = [];
    shieldsRef.current = [];
    eraManagerRef.current = new EraManager();
    coinRef.current = null;

    for (let i = 0; i < 4; i++) {
        const cloud = new Cloud(canvas.width, canvas.height, GAME_CONFIG.baseSpeed);
        cloud.x = Math.random() * canvas.width;
        cloudsRef.current.push(cloud);
    }
  };

  useEffect(() => {
     if (state.bannerVisible && state.status === 'PLAYING') {
         const t = setTimeout(() => {
             dispatch({ type: 'HIDE_BANNER' });
         }, 2000);
         return () => clearTimeout(t);
     }
  }, [state.bannerVisible, state.status]);

  const handleEntities = (canvas: HTMLCanvasElement) => {
    const p = playerRef.current;
    if (!p) return;

    if (state.frames % 350 === 0) cloudsRef.current.push(new Cloud(canvas.width, canvas.height, state.currentSpeed));

    cloudsRef.current.forEach(c => c.update());
    cloudsRef.current = cloudsRef.current.filter(c => !c.markedForDeletion);
    
    particlesRef.current.forEach(pt => pt.update(state.currentSpeed));
    particlesRef.current = particlesRef.current.filter(pt => !pt.markedForDeletion);

    const eraId = eraManagerRef.current?.currentEra.id || 1;

    // Obstacle spawning
    const canSpawnObstacle = obstaclesRef.current.length === 0 || 
        (canvas.width - obstaclesRef.current[obstaclesRef.current.length - 1].x > GAME_CONFIG.minObstacleGap);
    
    if (canSpawnObstacle && Math.random() < GAME_CONFIG.obstacleSpawnChance) {
        obstaclesRef.current.push(new Obstacle(canvas, eraId, state.currentSpeed));
    }

    if (Math.random() < GAME_CONFIG.dataBitSpawnChance) {
      dataBitsRef.current.push(new DataBit(canvas.width, canvas.height, eraId, state.frames));
    }
    if (Math.random() < GAME_CONFIG.powerUpSpawnChance && !p.hasShield && shieldsRef.current.length === 0) {
      shieldsRef.current.push(new ShieldPowerUp(canvas.width, canvas.height, state.frames));
    }

    obstaclesRef.current.forEach(obs => {
        obs.update(state.currentSpeed);
        if (!obs.scored && obs.x + obs.width < p.x) {
            obs.scored = true;
        }
    });
    obstaclesRef.current = obstaclesRef.current.filter(obs => !obs.markedForDeletion);

    dataBitsRef.current.forEach(bit => bit.update(state.currentSpeed, state.frames));
    dataBitsRef.current = dataBitsRef.current.filter(bit => !bit.markedForDeletion && !bit.collected);

    shieldsRef.current.forEach(shield => shield.update(state.currentSpeed, state.frames));
    shieldsRef.current = shieldsRef.current.filter(shield => !shield.markedForDeletion && !shield.collected);

    if (Math.floor(state.score) === GAME_CONFIG.ieeeScore && !coinRef.current && !showIEEEBanner) {
        coinRef.current = new IEEECoin(canvas.width, canvas.height);
    }
    if (coinRef.current) {
        coinRef.current.update(state.currentSpeed, state.frames);
        if (coinRef.current.markedForDeletion) coinRef.current = null;
    }
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 20; i++) {
        particlesRef.current.push(new Particle(x, y, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, Math.random() * 4 + 2, color));
    }
  }

  const checkCollisions = () => {
    if (!playerRef.current) return { gameOver: false, scoreBonus: 0, doComboReset: false, doComboAdd: false };
    const p = playerRef.current;
    const px = p.x;
    const py = p.y;
    const pw = p.width;
    const ph = p.height;
    
    let scoreBonus = 0;
    let doComboReset = false;
    let doComboAdd = false;

    // Obstacles
    for (const obs of obstaclesRef.current) {
        const oh = obs.getHitbox();
        if (px < oh.x + oh.width && px + pw > oh.x && py < oh.y + oh.height && py + ph > oh.y) {
            if (!p.hitObstacle()) {
                obs.markedForDeletion = true;
                createExplosion(oh.x + oh.width/2, oh.y + oh.height/2, '#3498db');
                doComboReset = true;
            } else {
                return { gameOver: true, scoreBonus: 0, doComboReset: false, doComboAdd: false };
            }
        }
    }

    // DataBits
    for (const bit of dataBitsRef.current) {
      if (bit.collected) continue;
      const b = bit.getHitbox();
      if (px < b.x + b.width && px + pw > b.x && py < b.y + b.height && py + ph > b.y) {
          bit.collected = true;
          doComboAdd = true;
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
         scoreBonus += GAME_CONFIG.ieeeBonusPoints;
         setShowIEEEBanner(true);
         setTimeout(() => setShowIEEEBanner(false), 4000);
         createExplosion(ch.x + ch.width/2, ch.y + ch.height/2, '#f1c40f');
      }
    }

    return { gameOver: false, scoreBonus, doComboReset, doComboAdd };
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const era = eraManagerRef.current?.currentEra;
    if (!era) return;

    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, era.bgTop); 
    grad.addColorStop(1, era.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = era.starColor;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.25, 45 + Math.sin(state.frames * 0.02) * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    cloudsRef.current.forEach(c => c.draw(ctx));

    const groundY = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio);
    ctx.fillStyle = era.groundColor;
    ctx.fillRect(0, groundY, canvas.width, canvas.height * GAME_CONFIG.groundHeightRatio);
    
    ctx.strokeStyle = `rgba(255,255,255,0.05)`;
    ctx.lineWidth = 2;
    for(let i = 0; i < canvas.width; i+= 60) {
      const offset = (i - (state.frames * (state.currentSpeed * 0.5))) % 60;
      ctx.beginPath();
      ctx.moveTo(offset + i, groundY);
      ctx.lineTo(offset + i - 40, canvas.height);
      ctx.stroke();
    }

    ctx.fillStyle = era.groundAccent;
    ctx.fillRect(0, groundY, canvas.width, 5);

    if (playerRef.current) {
        ctx.save();
        let shadowY = groundY;
        let heightAboveGround = groundY - (playerRef.current.y + playerRef.current.height);
        let shadowAlpha = Math.max(0.05, 0.4 - (heightAboveGround * 0.003));
        let shadowWidth = playerRef.current.width * 0.8 + (playerRef.current.isGrounded ? Math.sin(state.frames * 0.3) * 5 : 0);
        
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(playerRef.current.x + playerRef.current.width/2, shadowY + 12, shadowWidth / 1.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
  };

  useGameLoop((deltaTime) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (state.status === 'PLAYING') {
      let speedIncrement = state.currentSpeed;

      if (eraManagerRef.current) {
         eraManagerRef.current.update(state.score);
         if (eraManagerRef.current.eraChanged) {
            speedIncrement += GAME_CONFIG.eraSpeedBoost;
            const newEraProps = { ...eraManagerRef.current.currentEra };
            dispatch({ type: 'CHANGE_ERA', data: newEraProps });
         }
      }

      const collData = checkCollisions();
      if (collData.gameOver) {
          dispatch({ type: 'GAME_OVER' });
          return;
      }
      
      const targetSpeed = Math.min(speedIncrement + GAME_CONFIG.speedIncrement, GAME_CONFIG.maxSpeed);
      dispatch({ type: 'TICK', scoreBonus: collData.scoreBonus, tickSpeed: targetSpeed, doComboAdd: collData.doComboAdd, doComboReset: collData.doComboReset });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawEnvironment(ctx, canvas);
      handleEntities(canvas);
      
      dataBitsRef.current.forEach(b => b.draw(ctx, state.frames));
      shieldsRef.current.forEach(s => s.draw(ctx, state.frames));
      obstaclesRef.current.forEach(obs => obs.draw(ctx));
      particlesRef.current.forEach(p => p.draw(ctx));
      
      if (coinRef.current) coinRef.current.draw(ctx);

      if (playerRef.current) {
          playerRef.current.update(keys, state.frames, particlesRef.current);
          playerRef.current.draw(ctx, state.frames);
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
     saveToLeaderboard({ 
       name: playerName, 
       score: Math.floor(state.score), 
       era_reached: state.eraRenderData?.name || "Unknown" 
     });
     dispatch({ type: 'SAVE_SCORE' });
     router.push('/leaderboard');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-950 font-sans selection:bg-purple-500/30">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {state.status === 'PLAYING' && state.eraRenderData && (
        <HUD 
          score={state.score} 
          eraName={state.eraRenderData.name} 
          eraYears={state.eraRenderData.years}
          speed={state.currentSpeed} 
          combo={state.combo}
          comboMultiplier={state.comboMultiplier}
          hasShield={playerRef.current?.hasShield || false}
          canDoubleJump={playerRef.current?.canDoubleJump || false}
        />
      )}

      {/* DOM Era transition banner */}
      {state.eraRenderData && (
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-8 flex flex-col items-center justify-center transition-opacity duration-[2000ms] pointer-events-none drop-shadow-2xl ${state.bannerVisible ? 'opacity-100' : 'opacity-0'}`}>
             <div className="bg-black/90 backdrop-blur-md px-16 py-8 rounded-full border-t-2 border-b-2" style={{ borderColor: ERAS.find(e => e.id === state.eraRenderData?.id)?.groundAccent }}>
                <h2 className="text-3xl md:text-5xl font-black text-white text-center tracking-widest uppercase mb-2" style={{ color: ERAS.find(e => e.id === state.eraRenderData?.id)?.textColor }}>
                    {state.eraRenderData.name}
                </h2>
                <h3 className="text-xl md:text-2xl text-gray-400 text-center font-mono">
                    {state.eraRenderData.years}
                </h3>
             </div>
          </div>
      )}

      {showIEEEBanner && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white px-10 py-5 rounded-2xl shadow-[0_0_50px_rgba(250,204,21,0.6)] z-50 text-center animate-bounce border-4 border-yellow-200 backdrop-blur-md pointer-events-none">
            <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-lg text-black">IEEE CompSoc 80th!</h2>
            <p className="text-2xl font-bold text-yellow-950 mt-1">+500 Points Secret Discovered!</p>
        </div>
      )}

      {state.status === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white z-50 p-4 transition-all duration-500">
          <div className="bg-gray-900/90 p-10 rounded-3xl border border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col items-center max-w-lg w-full animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 uppercase tracking-widest drop-shadow-lg">
              GAME OVER
            </h1>
            
            <div className="w-full bg-black rounded-xl p-6 mb-8 border border-white/10 text-center shadow-inner mt-4">
              <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Final Score</p>
              <p className="text-5xl font-mono font-bold text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">
                {Math.floor(state.score).toLocaleString()}
              </p>
              <div className="h-px bg-white/10 w-full my-4"></div>
              <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Era Survived</p>
              <p className="text-xl font-bold text-purple-400">
                {state.eraRenderData?.name}
              </p>
            </div>
            
            <div className="flex flex-col gap-4 w-full">
               <h3 className="text-yellow-400 font-bold mb-1 uppercase tracking-wider text-center">Save YOUR SCORE</h3>
              <input 
                type="text" 
                placeholder="Enter Hacker Alias..." 
                className="w-full bg-white text-black placeholder-gray-500 px-6 py-4 rounded-xl text-xl text-center border-4 border-gray-300 focus:border-blue-500 focus:outline-none font-mono transition-all font-bold"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveScore()}
              />
              <button 
                onClick={saveScore} 
                className="w-full text-xl py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed text-white"
                disabled={!playerName.trim()}
              >
                Save Score
              </button>
              <div className="flex gap-4 mt-2">
                  <button 
                    onClick={() => { initGame(); dispatch({ type: 'RESTART' }); setPlayerName(""); setShowIEEEBanner(false); }} 
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl py-3 font-semibold transition-all text-white"
                  >
                    Reboot
                  </button>
                  <button 
                    onClick={() => router.push('/')} 
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-3 font-semibold transition-all text-gray-300"
                  >
                    Menu
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
