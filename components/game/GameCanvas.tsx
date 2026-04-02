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
import { GAME_CONFIG } from '@/lib/gameConfig';
import { saveToLeaderboard } from '@/lib/leaderboard';
import { Button } from '@/components/ui/Button';
import { IEEECoin } from './IEEECoin';

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER';

interface State {
  status: GameState;
  score: number;
  currentSpeed: number;
  frames: number;
  eraName: string;
}

type Action = 
  | { type: 'START' }
  | { type: 'GAME_OVER' }
  | { type: 'TICK'; scoreBonus?: number }
  | { type: 'RESET'; eraName: string }
  | { type: 'UPDATE_SPEED'; speed: number }
  | { type: 'UPDATE_ERA'; name: string };

const initialState: State = {
  status: 'MENU',
  score: 0,
  currentSpeed: GAME_CONFIG.baseSpeed,
  frames: 0,
  eraName: "Vacuum Tubes"
};

function gameReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return { ...state, status: 'PLAYING' };
    case 'GAME_OVER':
      return { ...state, status: 'GAME_OVER' };
    case 'TICK':
      return { 
        ...state, 
        frames: state.frames + 1,
        score: state.score + 1 + (action.scoreBonus || 0),
        currentSpeed: Math.min(state.currentSpeed + GAME_CONFIG.speedIncrement, GAME_CONFIG.maxSpeed)
      };
    case 'RESET':
      return { ...initialState, status: 'PLAYING', eraName: action.eraName };
    case 'UPDATE_SPEED':
      return { ...state, currentSpeed: action.speed };
    case 'UPDATE_ERA':
      return { ...state, eraName: action.name };
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
  const eraManagerRef = useRef<EraManager | null>(null);
  const coinRef = useRef<IEEECoin | null>(null);
  const [showIEEEBanner, setShowIEEEBanner] = useState(false);
  const [playerName, setPlayerName] = useState("");

  const IEEE_SCORE = 1946;

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
    eraManagerRef.current = new EraManager();
    coinRef.current = null;

    for (let i = 0; i < 3; i++) {
        const cloud = new Cloud(canvas.width, canvas.height, GAME_CONFIG.baseSpeed);
        cloud.x = Math.random() * canvas.width;
        cloudsRef.current.push(cloud);
    }
  };

  const handleEntities = (canvas: HTMLCanvasElement) => {
    if (state.frames % 350 === 0) cloudsRef.current.push(new Cloud(canvas.width, canvas.height, state.currentSpeed));

    cloudsRef.current.forEach(c => c.update());
    cloudsRef.current = cloudsRef.current.filter(c => !c.markedForDeletion);
    
    particlesRef.current.forEach(p => p.update(state.currentSpeed));
    particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);

    const eraId = eraManagerRef.current?.currentEra.id || 1;

    if (obstaclesRef.current.length === 0 || 
        (canvas.width - obstaclesRef.current[obstaclesRef.current.length - 1].x > GAME_CONFIG.minObstacleGap && Math.random() < 0.02)) {
            obstaclesRef.current.push(new Obstacle(canvas, eraId, state.currentSpeed));
    }

    obstaclesRef.current.forEach(obs => obs.update(state.currentSpeed));
    obstaclesRef.current = obstaclesRef.current.filter(obs => !obs.markedForDeletion);

    if (Math.floor(state.score) === IEEE_SCORE && !coinRef.current) {
        coinRef.current = new IEEECoin(canvas.width, canvas.height);
    }
    if (coinRef.current) {
        coinRef.current.update(state.currentSpeed, state.frames);
        if (coinRef.current.markedForDeletion) coinRef.current = null;
    }
  };

  const checkCollisions = () => {
    if (!playerRef.current) return false;
    const p = playerRef.current;
    const px = p.x;
    const py = p.y;
    const pw = p.width;
    const ph = p.height;

    for (const obs of obstaclesRef.current) {
        const oh = obs.getHitbox();
        if (
            px < oh.x + oh.width &&
            px + pw > oh.x &&
            py < oh.y + oh.height &&
            py + ph > oh.y
        ) {
            return true;
        }
    }

    if (coinRef.current) {
      const ch = coinRef.current.getHitbox();
      if (
            px < ch.x + ch.width &&
            px + pw > ch.x &&
            py < ch.y + ch.height &&
            py + ph > ch.y
      ) {
         coinRef.current = null;
         dispatch({ type: 'TICK', scoreBonus: 500 });
         setShowIEEEBanner(true);
         setTimeout(() => setShowIEEEBanner(false), 3000);
      }
    }

    return false;
  };

  const drawEnvironment = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const era = eraManagerRef.current?.currentEra;
    if (!era) return;

    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, era.bgTop); 
    grad.addColorStop(1, era.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 234, 167, 0.9)';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.3, 40, 0, Math.PI * 2);
    ctx.fill();

    cloudsRef.current.forEach(c => c.draw(ctx));

    ctx.fillStyle = era.groundColor;
    const groundY = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio);
    ctx.fillRect(0, groundY, canvas.width, canvas.height * GAME_CONFIG.groundHeightRatio);
    
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, groundY, canvas.width, 4);

    if (playerRef.current) {
        ctx.save();
        let shadowY = groundY;
        let heightAboveGround = groundY - (playerRef.current.y + playerRef.current.height);
        let shadowAlpha = Math.max(0.05, 0.4 - (heightAboveGround * 0.003));
        let shadowWidth = playerRef.current.width * 0.8 + (playerRef.current.isGrounded ? Math.sin(state.frames * 0.3) * 5 : 0);
        
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(playerRef.current.x + playerRef.current.width/2, shadowY + 8, shadowWidth / 1.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
  };

  const drawMobileControls = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.rect(20, canvas.height - 80, 70, 60);
        if (keys.ArrowLeft) ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(100, canvas.height - 80, 70, 60);
        if (keys.ArrowRight) ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(canvas.width - 90, canvas.height - 80, 70, 60);
        if (keys.Space || keys.ArrowUp) ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(223, 230, 233, 0.8)';
        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('<', 55, canvas.height - 43);
        ctx.fillText('>', 135, canvas.height - 43);
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText('JUMP', canvas.width - 55, canvas.height - 45);

        ctx.restore();
    }
  };

  useGameLoop((deltaTime) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (state.status === 'PLAYING') {
      dispatch({ type: 'TICK' });

      if (eraManagerRef.current) {
         eraManagerRef.current.update(state.score);
         if (eraManagerRef.current.eraChanged) {
            dispatch({ type: 'UPDATE_SPEED', speed: state.currentSpeed + 1 });
            dispatch({ type: 'UPDATE_ERA', name: eraManagerRef.current.currentEra.name });
         }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawEnvironment(ctx, canvas);
      handleEntities(canvas);
      particlesRef.current.forEach(p => p.draw(ctx));
      obstaclesRef.current.forEach(obs => obs.draw(ctx));
      if (coinRef.current) coinRef.current.draw(ctx);

      if (playerRef.current) {
          playerRef.current.update(keys, state.frames, particlesRef.current);
          playerRef.current.draw(ctx, state.frames);
      }

      eraManagerRef.current?.drawBanner(ctx, canvas.width, canvas.height);
      drawMobileControls(ctx, canvas);

      if (checkCollisions()) {
          dispatch({ type: 'GAME_OVER' });
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

  useEffect(() => {
     const handleTouchStart = (e: TouchEvent) => {
         const canvas = canvasRef.current;
         if (!canvas) return;
         for(let i=0; i<e.changedTouches.length; i++) {
            let x = e.changedTouches[i].clientX;
            let y = e.changedTouches[i].clientY;
            if (y > canvas.height - 90) { 
                if (x < 95) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
                else if (x >= 95 && x <= 180) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
                else if (x > canvas.width - 100) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
            } else {
                window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
            }
         }
     };
     const handleTouchEnd = (e: TouchEvent) => {
         window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowLeft' }));
         window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));
         window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
     };

     window.addEventListener('touchstart', handleTouchStart, { passive: false });
     window.addEventListener('touchend', handleTouchEnd, { passive: false });

     return () => {
         window.removeEventListener('touchstart', handleTouchStart);
         window.removeEventListener('touchend', handleTouchEnd);
     };
  }, []);

  const saveScore = () => {
     if (!playerName.trim()) return;
     saveToLeaderboard({ name: playerName, score: Math.floor(state.score), era_reached: eraManagerRef.current?.currentEra.name || "Unknown" });
     router.push('/leaderboard');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 font-sans">
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {state.status === 'PLAYING' && (
        <HUD score={state.score} eraName={state.eraName} speed={state.currentSpeed} />
      )}

      {showIEEEBanner && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-8 py-4 rounded-xl shadow-2xl z-50 text-center animate-bounce border-4 border-yellow-300">
            <h2 className="text-3xl font-bold">Happy 80th, IEEE CompSoc!</h2>
            <p className="text-xl">+500 Points!</p>
        </div>
      )}

      {state.status === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50 p-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-red-500 tracking-wider">GAME OVER</h1>
          <p className="text-2xl md:text-3xl mb-2 font-mono">Score: {Math.floor(state.score)}</p>
          <p className="text-lg md:text-xl mb-8 text-gray-400">Era Reached: {eraManagerRef.current?.currentEra.name}</p>
          
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <input 
              type="text" 
              placeholder="Enter your name..." 
              className="text-black px-4 py-3 rounded-lg text-xl text-center focus:outline-none focus:ring-4 focus:ring-blue-500 font-mono"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
              autoFocus
            />
            <Button onClick={saveScore} className="w-full text-xl py-4 bg-green-600 hover:bg-green-500">
              Save Score
            </Button>
            <div className="flex gap-4 mt-2">
                <Button onClick={() => { initGame(); dispatch({ type: 'RESET', eraName: "Vacuum Tubes" }); setPlayerName(""); setShowIEEEBanner(false); }} className="flex-1 bg-blue-600 hover:bg-blue-500">
                  Retry
                </Button>
                <Button onClick={() => router.push('/')} className="flex-1 bg-gray-600 hover:bg-gray-500">
                  Menu
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
