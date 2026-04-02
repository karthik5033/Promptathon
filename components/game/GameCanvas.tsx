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
import { BackgroundSystem } from './BackgroundSystem';
import { EraManager } from './EraManager';
import { HUD } from './HUD';
import { GAME_CONFIG, ERAS, EraConfig } from '@/lib/gameConfig';
import { saveToLeaderboard } from '@/lib/leaderboard';
import { IEEECoin } from './IEEECoin';
import { DataBit, ShieldPowerUp, FlyingShield, ScoreMultiplierPerk } from './Collectibles';
import { applyDifficultySettings } from '@/lib/adaptiveDifficulty';
import { classifySkill, getStoredSkill, storeSkill, PlayerStats } from '@/lib/skillDetection';
import { HintOverlay, HintUrgency } from './HintOverlay';
import { LoreCard } from './LoreCard';

type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface State {
  status: GameState;
  eraRenderData: EraConfig | null;
  bannerVisible: boolean;
  gravityEnabled: boolean;
  muted: boolean;
}

type Action = 
  | { type: 'START' }
  | { type: 'GAME_OVER' }
  | { type: 'RESTART' }
  | { type: 'SAVE_SCORE' }
  | { type: 'CHANGE_ERA'; data: EraConfig }
  | { type: 'HIDE_BANNER' }
  | { type: 'TOGGLE_GRAVITY' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_PAUSE' };

const initialState: State = {
  status: 'MENU',
  eraRenderData: ERAS[0],
  bannerVisible: true,
  gravityEnabled: true,
  muted: false
};

function gameReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOGGLE_GRAVITY':
      const newGravity = !state.gravityEnabled;
      GAME_CONFIG.gravityEnabled = newGravity;
      return { ...state, gravityEnabled: newGravity };
    case 'START':
      GAME_CONFIG.gravityEnabled = true;
      return { ...state, status: 'PLAYING', bannerVisible: true, eraRenderData: ERAS[0], gravityEnabled: true };
    case 'GAME_OVER':
      return { ...state, status: 'GAME_OVER' };
    case 'RESTART':
      GAME_CONFIG.gravityEnabled = true;
      return { ...initialState, status: 'PLAYING', gravityEnabled: true };
    case 'SAVE_SCORE':
      return { ...state, status: 'MENU' };
    case 'CHANGE_ERA':
      return { ...state, eraRenderData: action.data, bannerVisible: true };
    case 'HIDE_BANNER':
      return { ...state, bannerVisible: false };
    case 'TOGGLE_PAUSE':
      if (state.status !== 'PLAYING' && state.status !== 'PAUSED') return state;
      const willPause = state.status === 'PLAYING';
      return { ...state, status: willPause ? 'PAUSED' : 'PLAYING' };
    case 'TOGGLE_MUTE':
      const newMuted = !state.muted;
      (GAME_CONFIG as any).muted = newMuted;
      return { ...state, muted: newMuted };
    default:
      return state;
  }
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  const [gravityToggleMsg, setGravityToggleMsg] = useState<{ text: string, color: string, id: number } | null>(null);
  const [gravityToggleFade, setGravityToggleFade] = useState(false);
  
  const toggleGravityCallback = () => {
     dispatch({ type: 'TOGGLE_GRAVITY' });
     const willBeGravityOn = !state.gravityEnabled;
     setGravityToggleMsg({
        text: willBeGravityOn ? "GRAVITY RESTORED" : "ZERO-G MODE",
        color: willBeGravityOn ? "text-blue-400" : "text-purple-400",
        id: Date.now()
     });
     setGravityToggleFade(false);
  };
  
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
  const bgSystemRef = useRef<BackgroundSystem | null>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const dataBitsRef = useRef<DataBit[]>([]);
  const shieldsRef = useRef<ShieldPowerUp[]>([]);
  const flyingShieldsRef = useRef<FlyingShield[]>([]);
  const scoreMultipliersRef = useRef<ScoreMultiplierPerk[]>([]);
  const eraManagerRef = useRef<EraManager | null>(null);
  const coinRef = useRef<IEEECoin | null>(null);
  
  const [showIEEEBanner, setShowIEEEBanner] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [speedMode, setSpeedMode] = useState<'AUTO' | 'CUSTOM'>('AUTO');
  const [customSpeed, setCustomSpeed] = useState<number>(3.0);

  const [hintsEnabled, setHintsEnabled] = useState(false);
  const [hintUrgency, setHintUrgency] = useState<HintUrgency>("SAFE");
  const [playerCanvasPos, setPlayerCanvasPos] = useState<{x: number, y: number} | null>(null);
  const [finalSkillInfo, setFinalSkillInfo] = useState<{score: number, skill: string, eraName: string, eraReached: number} | null>(null);

  const lastObstacleXRef = useRef<number>(0);

  const statsRef = useRef<PlayerStats>({
    deaths: 0,
    jumpsAttempted: 0,
    jumpsSuccessful: 0,
    totalFramesAlive: 0,
    eraReached: 1,
    obstaclesAvoided: 0
  });

  const speedModeRef = useRef<'AUTO' | 'CUSTOM'>('AUTO');
  const customSpeedRef = useRef<number>(3.0);

  useEffect(() => { speedModeRef.current = speedMode; }, [speedMode]);
  useEffect(() => { customSpeedRef.current = customSpeed; }, [customSpeed]);

  useEffect(() => {
    if (gravityToggleMsg) {
       const t1 = setTimeout(() => setGravityToggleFade(true), 50);
       const t2 = setTimeout(() => setGravityToggleMsg(null), 1500);
       return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [gravityToggleMsg]);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const gameOverAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bgmRef.current = new Audio('/music/theme.mp3');
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.4; 

    gameOverAudioRef.current = new Audio('/music/gameover.mp3');
    gameOverAudioRef.current.volume = 1.0; 
    gameOverAudioRef.current.playbackRate = 1.5; 
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.muted = state.muted;
    }
    if (gameOverAudioRef.current) {
      gameOverAudioRef.current.muted = state.muted;
    }
  }, [state.muted]);

  useEffect(() => {
    if (state.status === 'PLAYING' && !state.muted) {
       bgmRef.current?.play().catch(e => console.log('BGM play prevented:', e));
    } else {
       bgmRef.current?.pause();
    }
  }, [state.status, state.muted]);

  useEffect(() => {
    dispatch({ type: 'START' });
    initGame();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.repeat) {
        dispatch({ type: 'TOGGLE_MUTE' });
      }
      if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) {
        dispatch({ type: 'TOGGLE_PAUSE' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentSkill = getStoredSkill();
    applyDifficultySettings(currentSkill);
    setHintsEnabled(currentSkill === "BEGINNER");
    setHintUrgency("SAFE");

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
    bgSystemRef.current = new BackgroundSystem(canvas.width, canvas.height);
    obstaclesRef.current = [];
    platformsRef.current = [];
    dataBitsRef.current = [];
    shieldsRef.current = [];
    flyingShieldsRef.current = [];
    scoreMultipliersRef.current = [];
    eraManagerRef.current = new EraManager();
    coinRef.current = null;
    lastObstacleXRef.current = canvas.width;

    for (let i = 0; i < 6; i++) {
        const cloud = new Cloud(canvas.width, canvas.height, GAME_CONFIG.baseSpeed);
        cloud.x = Math.random() * canvas.width;
        cloudsRef.current.push(cloud);
    }

    if (bgmRef.current) {
        bgmRef.current.currentTime = 0;
        if (state.status === 'PLAYING' && !state.muted) {
            bgmRef.current.play().catch(() => {});
        } else {
            bgmRef.current.pause();
        }
    }

    if (gameOverAudioRef.current) {
        gameOverAudioRef.current.pause();
        gameOverAudioRef.current.currentTime = 0;
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
    // Obstacle and Platform Spawning — scaling gap with score
    const scoreScalingGap = Math.max(250, GAME_CONFIG.minObstacleGap - (g.score / 50));
    const gap = scoreScalingGap + Math.random() * 250;
    
    if (lastObstacleXRef.current < canvas.width - gap) {
        if (Math.random() < 0.40) { 
             const plat = new Platform(canvas.width, canvas.height, eraId);
             platformsRef.current.push(plat);
             
             for(let i=0; i < 3; i++) {
                let bit = new DataBit(canvas.width, canvas.height, eraId, g.frames);
                bit.x = plat.x + (plat.width/2) + (i*40 - 40);
                bit.y = plat.y - 35;
                dataBitsRef.current.push(bit);
             }
        } else {
             // Sky obstacle chance scales with score: starting at 40% up to 80% in flying mode
             const isFlying = !(GAME_CONFIG as any).gravityEnabled;
             const difficultyMultiplier = Math.min(0.8, 0.4 + (g.score / 50000));
             const isSky = isFlying && Math.random() < difficultyMultiplier;
             const obs = new Obstacle(canvas, eraId, isSky);
             obstaclesRef.current.push(obs);
             
             if (!isSky) {
               for (let i=-1; i<=1; i++) {
                  let bit = new DataBit(canvas.width, canvas.height, eraId, g.frames);
                  bit.x = obs.x + obs.width/2 + (i * 45); 
                  bit.y = obs.y - 65 - Math.cos(i) * 35; 
                  dataBitsRef.current.push(bit);
               }
             }
        }
        lastObstacleXRef.current = canvas.width;
    }
    lastObstacleXRef.current -= g.currentSpeed;

    // FLYING MODE (GRAVITY OFF) SPECIAL PERKS
    if (!(GAME_CONFIG as any).gravityEnabled) {
      if (g.frames % 400 === 0 && Math.random() < 0.2) {
          flyingShieldsRef.current.push(new FlyingShield(canvas.width, canvas.height, g.frames));
      }
      if (g.frames % 300 === 0 && Math.random() < 0.25) {
          scoreMultipliersRef.current.push(new ScoreMultiplierPerk(canvas.width, canvas.height, g.frames));
      }
    }

    // Power-ups spawn occasionally independent of structure
    if (Math.random() < GAME_CONFIG.powerUpSpawnChance && !p.hasShield && shieldsRef.current.length === 0) {
      shieldsRef.current.push(new ShieldPowerUp(canvas.width, canvas.height, g.frames));
    }

    obstaclesRef.current.forEach(obs => obs.update(g.currentSpeed));
    obstaclesRef.current = obstaclesRef.current.filter(obs => !obs.isOffScreen);

    obstaclesRef.current.forEach(obs => {
        if (!obs.passed && obs.x + obs.width < p.x) {
            obs.passed = true;
            statsRef.current.obstaclesAvoided++;
            statsRef.current.jumpsSuccessful++;
        }
    });

    platformsRef.current.forEach(plat => plat.update(g.currentSpeed, g.frames));
    platformsRef.current = platformsRef.current.filter(plat => !plat.markedForDeletion);

    dataBitsRef.current.forEach(bit => bit.update(g.currentSpeed, g.frames));
    dataBitsRef.current = dataBitsRef.current.filter(bit => !bit.markedForDeletion && !bit.collected);

    shieldsRef.current.forEach(shield => shield.update(g.currentSpeed, g.frames));
    shieldsRef.current = shieldsRef.current.filter(shield => !shield.markedForDeletion && !shield.collected);

    flyingShieldsRef.current.forEach(s => s.update(g.currentSpeed, g.frames));
    flyingShieldsRef.current = flyingShieldsRef.current.filter(s => !s.markedForDeletion && !s.collected);

    scoreMultipliersRef.current.forEach(m => m.update(g.currentSpeed, g.frames));
    scoreMultipliersRef.current = scoreMultipliersRef.current.filter(m => !m.markedForDeletion && !m.collected);

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
    const pBox = {
      x: px + 2,    // tightening hitboxes (less padding = more realistic collisions)
      y: py + 2,
      width: pw - 4,
      height: ph - 4
    };

    for (const obs of obstaclesRef.current) {
        const h = obs.hitbox;
        if (
          pBox.x < h.x + h.width &&
          pBox.x + pBox.width > h.x &&
          pBox.y < h.y + h.height &&
          pBox.y + pBox.height > h.y
        ) {
            if (!p.hitObstacle()) {
                obs.markedForDeletion = true;
                createExplosion(h.x + h.width/2, h.y + h.height/2, '#3498db');
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

    for (const fShield of flyingShieldsRef.current) {
      if (fShield.collected) continue;
      const fs = fShield.getHitbox();
      if (px < fs.x + fs.width && px + pw > fs.x && py < fs.y + fs.height && py + ph > fs.y) {
          fShield.collected = true;
          p.activateShield();
          createExplosion(fs.x + fs.width/2, fs.y + fs.height/2, '#00e5ff');
      }
    }

    for (const perk of scoreMultipliersRef.current) {
      if (perk.collected) continue;
      const b = perk.getHitbox();
      if (px < b.x + b.width && px + pw > b.x && py < b.y + b.height && py + ph > b.y) {
          perk.collected = true;
          g.score += 500; // instant bonus for picking it up
          // Boost future bit values temporarily? No, let's keep it score simple for now or double score decay
          createExplosion(b.x + b.width/2, b.y + b.height/2, '#ffd700');
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

    if (bgSystemRef.current) {
        bgSystemRef.current.draw(ctx, era.id, canvas.height);
    }


    ctx.save();
    ctx.shadowBlur = 40;
    ctx.shadowColor = era.starColor;
    ctx.fillStyle = era.starColor;
    ctx.beginPath();
    ctx.arc(canvas.width * 0.85, canvas.height * 0.25, 55 + Math.sin(g.frames * 0.02) * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    cloudsRef.current.forEach(c => c.draw(ctx));

    obstaclesRef.current.forEach(obs => obs.draw(ctx));
    platformsRef.current.forEach(plat => plat.draw(ctx));
    dataBitsRef.current.forEach(bit => bit.draw(ctx, g.frames));
    shieldsRef.current.forEach(shield => shield.draw(ctx, g.frames));
    flyingShieldsRef.current.forEach(f => f.draw(ctx, g.frames));
    scoreMultipliersRef.current.forEach(m => m.draw(ctx, g.frames));

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
      statsRef.current.totalFramesAlive++;

      if (eraManagerRef.current) {
         eraManagerRef.current.update(g.score);
         statsRef.current.eraReached = eraManagerRef.current.currentEra.id;
         if (eraManagerRef.current.eraChanged) {
            let prevSkill = getStoredSkill();
            let upgraded = false;
            if (statsRef.current.eraReached >= 3 && prevSkill === "BEGINNER") {
               storeSkill("INTERMEDIATE"); upgraded = true;
            } else if (statsRef.current.eraReached >= 4 && prevSkill !== "PRO") {
               storeSkill("PRO"); upgraded = true;
            }
            if (upgraded) applyDifficultySettings(getStoredSkill());

            const newEraProps = { ...eraManagerRef.current.currentEra };
            dispatch({ type: 'CHANGE_ERA', data: newEraProps });
         }
      }

      if ((keys.Space || keys.ArrowUp) && !(keys as any)._jumpConsumedStats) {
          statsRef.current.jumpsAttempted++;
          (keys as any)._jumpConsumedStats = true;
      }
      if (!keys.Space && !keys.ArrowUp) (keys as any)._jumpConsumedStats = false;
      
      if (keys.KeyH && !(keys as any)._hConsumed) {
         setHintsEnabled(prev => !prev);
         (keys as any)._hConsumed = true;
      }

      const isGameOver = checkCollisions();
      if (isGameOver) {
          statsRef.current.deaths++;
          const finalSkill = classifySkill(statsRef.current);
          storeSkill(finalSkill);

          setFinalSkillInfo({
             score: g.score,
             skill: finalSkill,
             eraReached: eraManagerRef.current?.currentEra.id || 1,
             eraName: eraManagerRef.current?.currentEra.name || "Unknown"
          });

          dispatch({ type: 'GAME_OVER' });
          bgmRef.current?.pause();
          if (!state.muted) {
              gameOverAudioRef.current?.play().catch(() => {});
          }
          return;
      }
      
      if (speedModeRef.current === 'AUTO') {
          const maxSpeeds: Record<number, number> = { 1: 8, 2: 10, 3: 12, 4: 14, 5: 16 };
          const eraId = eraManagerRef.current?.currentEra.id || 1;
          const speedCap = maxSpeeds[eraId] || 16;
          
          if (g.currentSpeed < speedCap) {
             g.currentSpeed += 0.0008;
          }
      } else {
          g.currentSpeed = customSpeedRef.current;
      }

      if (bgSystemRef.current) {
          bgSystemRef.current.update(g.currentSpeed, g.frames, canvas.width);
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

          if (hintsEnabled && g.frames % 30 === 0) {
             const hint = playerRef.current.predictJumpPath(obstaclesRef.current, g.currentSpeed);
             setHintUrgency(hint.urgency);
             const rect = canvas.getBoundingClientRect();
             setPlayerCanvasPos({ x: playerRef.current.x + rect.left + playerRef.current.width/2, y: playerRef.current.y + rect.top });
          }

          if (!state.gravityEnabled && g.frames % 5 === 0) {
             particlesRef.current.push(new Particle(
                playerRef.current.x + playerRef.current.width/2,
                playerRef.current.y + playerRef.current.height/2,
                (Math.random() - 0.5) * 2,
                -0.5,
                Math.random() * 2 + 1,
                'rgba(150, 100, 255, 0.6)'
             ));
          }

          if (!state.gravityEnabled) {
             ctx.save();
             ctx.shadowBlur = 20;
             ctx.shadowColor = '#a855f7';
             ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.arc(
               playerRef.current.x + playerRef.current.width/2,
               playerRef.current.y + playerRef.current.height/2,
               playerRef.current.width * 0.9,
               0, Math.PI * 2
             );
             ctx.stroke();
             ctx.restore();
          }
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
      <HintOverlay urgency={hintUrgency} playerPos={playerCanvasPos} enabled={hintsEnabled && state.status === 'PLAYING'} />
      
      {gravityToggleMsg && (
        <div 
           key={gravityToggleMsg.id} 
           className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none ${gravityToggleMsg.color} font-black text-4xl md:text-5xl tracking-[0.2em] font-mono transition-opacity duration-[1500ms] ease-out`}
           style={{
             textShadow: '0 0 15px currentColor',
             opacity: gravityToggleFade ? 0 : 1
           }}
        >
          {gravityToggleMsg.text}
        </div>
      )}

      {state.status === 'PLAYING' && state.eraRenderData && (
        <>
          <HUD gravityOn={state.gravityEnabled} toggleGravity={toggleGravityCallback} />
          <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2 p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl shadow-lg">
             <button
                onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
                className="w-full px-3 py-1.5 rounded-lg font-bold text-xs uppercase transition-all duration-200 border bg-yellow-900/60 border-yellow-400/50 text-yellow-300 hover:bg-yellow-800/60 mb-1"
              >
                ⏸︎ Pause Game
              </button>
             <button
                onClick={() => dispatch({ type: 'TOGGLE_MUTE' })}
                className={`w-full px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 border ${
                  !state.muted
                    ? 'bg-white text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                    : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {!state.muted ? '🎵 Music: ON' : '🔇 Music: OFF'}
              </button>
             <div className="flex bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-sm">
                <button 
                  onClick={() => setSpeedMode('AUTO')} 
                  className={`px-4 py-1.5 font-bold text-xs uppercase tracking-wider transition-all duration-300 ${speedMode === 'AUTO' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >Auto</button>
                <div className="w-px bg-white/10"></div>
                <button 
                  onClick={() => setSpeedMode('CUSTOM')} 
                  className={`px-4 py-1.5 font-bold text-xs uppercase tracking-wider transition-all duration-300 ${speedMode === 'CUSTOM' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
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
          <div className="absolute bottom-4 left-4 z-30 text-white/50 text-[10px] uppercase font-mono tracking-widest font-bold hidden md:block">
            Hints: {hintsEnabled ? "ON" : "OFF"} (Press H)
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

       {state.status === 'PAUSED' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-[60] animate-fade-in">
          <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-3xl text-center shadow-2xl">
            <h2 className="text-5xl font-black mb-8 tracking-tighter">GAME PAUSED</h2>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
                className="px-12 py-4 bg-white text-black font-black text-xl rounded-xl hover:scale-105 active:scale-95 transition-all"
              >
                RESUME SESSION
              </button>
              <button 
                onClick={() => { initGame(); dispatch({ type: 'RESTART' }); }} 
                className="px-12 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all uppercase text-sm tracking-widest"
              >
                Restart Current
              </button>
              <button 
                onClick={() => router.push('/')} 
                className="text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-widest mt-4"
              >
                Exit to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {state.status === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center text-white z-50 p-4 transition-all duration-500 overflow-hidden">
          <div className="bg-[#0a0a0a] p-6 md:p-10 rounded-3xl border border-white/5 shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col items-center max-w-lg w-full max-h-[95vh] overflow-y-auto animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-black mb-2 text-white uppercase tracking-tighter drop-shadow-sm shrink-0">
              GAME OVER
            </h1>
            
            <div className="w-full bg-black/50 rounded-2xl p-5 mb-5 border border-white/5 text-center shadow-inner mt-2 shrink-0">
              <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1 font-semibold">Final Score</p>
              <p className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {Math.floor(gRef.current.score).toLocaleString()}
              </p>
              <div className="h-px bg-white/10 w-full my-4"></div>
              <div className="flex justify-between items-center text-left">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1 font-semibold">Era</p>
                  <p className="text-lg font-bold text-white">
                    {state.eraRenderData?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-1 font-semibold">Skill Level</p>
                  <p className="text-lg font-bold text-white">
                    {finalSkillInfo?.skill || 'MEASURING...'}
                  </p>
                </div>
              </div>
            </div>

            {finalSkillInfo && (
               <LoreCard 
                 eraReached={finalSkillInfo.eraReached} 
                 eraName={finalSkillInfo.eraName} 
                 score={Math.floor(finalSkillInfo.score)} 
                 skillLevel={finalSkillInfo.skill} 
               />
            )}
            
            <div className="flex flex-col gap-3 w-full shrink-0 mt-4">
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
                    onClick={() => { dispatch({ type: 'TOGGLE_MUTE' }); }} 
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-3 font-bold transition-all text-gray-300 text-sm uppercase"
                  >
                    {state.muted ? 'Music: OFF' : 'Music: ON'}
                  </button>
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
