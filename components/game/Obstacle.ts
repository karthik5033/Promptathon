import { GAME_CONFIG } from "@/lib/gameConfig";

const OBSTACLE_SIZES = {
  // ERA 1
  vacuum_tube:   { width: 30, height: 60, floating: false },
  punchcard:     { width: 60, height: 30, floating: true,  floatY: 0.55 },
  // ERA 2
  reel_tape:     { width: 40, height: 40, floating: false },
  mainframe:     { width: 40, height: 80, floating: false },
  // ERA 3
  floppy:        { width: 40, height: 40, floating: false },
  crt_monitor:   { width: 50, height: 70, floating: false },
  // ERA 4
  browser:       { width: 60, height: 50, floating: true,  floatY: 0.50 },
  server_rack:   { width: 35, height: 90, floating: false },
  // ERA 5
  neural_node:   { width: 40, height: 40, floating: true,  floatY: 0.45 },
  glitch_stream: { width: 80, height: 30, floating: false },
  // FLYING OBSTACLES (sky-only, all eras)
  satellite:     { width: 45, height: 35, floating: true, floatY: 0 },
  drone:         { width: 40, height: 30, floating: true, floatY: 0 },
  laser_grid:    { width: 70, height: 20, floating: true, floatY: 0 },
  firewall:      { width: 60, height: 40, floating: true, floatY: 0 },
  ai_drone:      { width: 50, height: 35, floating: true, floatY: 0 },
} as const;

const SKY_OBSTACLES: Record<number, (keyof typeof OBSTACLE_SIZES)[]> = {
  1: ['satellite'],
  2: ['satellite', 'drone'],
  3: ['drone', 'laser_grid'],
  4: ['laser_grid', 'firewall'],
  5: ['firewall', 'ai_drone'],
};

export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  eraId: number;
  type: keyof typeof OBSTACLE_SIZES;
  passed: boolean = false;
  scored: boolean = false;
  hitboxPadding: number = 4;
  markedForDeletion: boolean = false;
  isSkyObstacle: boolean = false;

  constructor(canvas: HTMLCanvasElement, eraId: number, forceSky: boolean = false) {
    this.eraId = eraId;
    
    if (forceSky) {
      const skyTypes = SKY_OBSTACLES[eraId] || ['satellite'];
      this.type = skyTypes[Math.floor(Math.random() * skyTypes.length)];
      this.isSkyObstacle = true;
    } else {
      let possibleTypes: (keyof typeof OBSTACLE_SIZES)[] = [];
      if (eraId === 1) possibleTypes = ['vacuum_tube', 'punchcard'];
      else if (eraId === 2) possibleTypes = ['reel_tape', 'mainframe'];
      else if (eraId === 3) possibleTypes = ['floppy', 'crt_monitor'];
      else if (eraId === 4) possibleTypes = ['browser', 'server_rack'];
      else if (eraId >= 5) possibleTypes = ['neural_node', 'glitch_stream'];
      else possibleTypes = ['vacuum_tube'];
      this.type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    }
    
    const config = OBSTACLE_SIZES[this.type];
    this.width = config.width;
    this.height = config.height;
    this.x = canvas.width;
    
    if (this.isSkyObstacle) {
      // Spawn in upper 60% of screen
      this.y = 30 + Math.random() * (canvas.height * 0.50);
    } else if (config.floating && config.floatY) {
      this.y = canvas.height * (config.floatY as number);
    } else {
      const groundY = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio);
      this.y = groundY - this.height;
    }
  }

  update(currentSpeed: number) {
    this.x -= currentSpeed;
  }

  get isOffScreen(): boolean {
    return this.x + this.width < 0;
  }

  get hitbox() {
    return {
      x: this.x + this.hitboxPadding,
      y: this.y + this.hitboxPadding,
      width: this.width - this.hitboxPadding * 2,
      height: this.height - this.hitboxPadding * 2
    };
  }

  getHitbox() {
    return this.hitbox;
  }

  draw(ctx: CanvasRenderingContext2D) {
    switch (this.type) {
      case 'vacuum_tube':
        ctx.fillStyle = '#ff6b00';
        ctx.fillRect(this.x + 8, this.y, 14, this.height);
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(this.x + 12, this.y + 4, 6, this.height - 8);
        ctx.fillStyle = '#888';
        ctx.fillRect(this.x + 6, this.y + this.height - 6, 18, 6);
        break;
      case 'punchcard':
        ctx.fillStyle = '#f5deb3';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#8B4513';
        for(let i = 0; i < 5; i++) {
          ctx.fillRect(this.x + 4 + i*10, this.y + 6, 6, 4);
          ctx.fillRect(this.x + 4 + i*10, this.y + 14, 6, 4);
        }
        break;
      case 'reel_tape':
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 20, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 20, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'mainframe':
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#00ff00';
        for(let i = 0; i < 3; i++) {
          ctx.fillRect(this.x + 6, this.y + 8 + i*14, 8, 6);
        }
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x + 20, this.y + 10, 16, 30);
        break;
      case 'floppy':
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#888';
        ctx.fillRect(this.x + 8, this.y + 4, 24, 16);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 28, this.y + 28, 8, 8);
        break;
      case 'crt_monitor':
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#001100';
        ctx.fillRect(this.x + 6, this.y + 6, this.width-12, this.height-24);
        ctx.fillStyle = '#00ff00';
        ctx.font = '8px monospace';
        ctx.fillText('C:>', this.x + 10, this.y + 22);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(this.x + 14, this.y + this.height - 14, 12, 8);
        break;
      case 'browser':
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#4285f4';
        ctx.fillRect(this.x, this.y, this.width, 12);
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 4, this.y + 15, this.width - 8, 10);
        ctx.fillStyle = '#333';
        ctx.font = '7px monospace';
        ctx.fillText('404', this.x + 14, this.y + 38);
        break;
      case 'server_rack':
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#00aaff';
        for(let i = 0; i < 4; i++) {
          ctx.fillRect(this.x + 4, this.y + 8 + i*16, this.width-8, 10);
        }
        ctx.fillStyle = '#00ff88';
        for(let i = 0; i < 4; i++) {
          ctx.fillRect(this.x + this.width-10, this.y + 12 + i*16, 4, 4);
        }
        break;
      case 'neural_node':
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = '#cc00cc';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 20, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff88ff';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 20, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      case 'glitch_stream':
        ctx.fillStyle = `hsl(${Date.now() * 0.1 % 360}, 100%, 50%)`;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for(let i = 0; i < 4; i++) {
          ctx.fillRect(
            this.x + Math.random() * this.width * 0.8,
            this.y + Math.random() * this.height * 0.8,
            Math.random() * 20 + 5,
            3
          );
        }
        break;
      // === FLYING OBSTACLES ===
      case 'satellite':
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(Date.now() * 0.002);
        // Body
        ctx.fillStyle = '#aaa';
        ctx.fillRect(-8, -5, 16, 10);
        // Solar panels
        ctx.fillStyle = '#1a73e8';
        ctx.fillRect(-22, -3, 12, 6);
        ctx.fillRect(10, -3, 12, 6);
        // Panel lines
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.5;
        for (let i = -20; i < -10; i += 3) { ctx.beginPath(); ctx.moveTo(i, -3); ctx.lineTo(i, 3); ctx.stroke(); }
        for (let i = 12; i < 22; i += 3) { ctx.beginPath(); ctx.moveTo(i, -3); ctx.lineTo(i, 3); ctx.stroke(); }
        // Dish
        ctx.fillStyle = '#ddd';
        ctx.beginPath(); ctx.arc(0, -6, 4, Math.PI, 0); ctx.fill();
        // Antenna blink
        ctx.fillStyle = Date.now() % 800 < 400 ? '#ff0000' : '#660000';
        ctx.beginPath(); ctx.arc(0, -10, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        break;
      case 'drone':
        ctx.save();
        // Body
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(this.x + 8, this.y + 10, 24, 14);
        // Camera eye
        ctx.fillStyle = '#ff4444';
        ctx.shadowBlur = 6; ctx.shadowColor = '#ff4444';
        ctx.beginPath(); ctx.arc(this.x + 20, this.y + 17, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Arms
        ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(this.x + 8, this.y + 14); ctx.lineTo(this.x + 2, this.y + 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 32, this.y + 14); ctx.lineTo(this.x + 38, this.y + 6); ctx.stroke();
        // Propellers (spinning)
        const propAngle = Date.now() * 0.02;
        ctx.fillStyle = '#888';
        for (const px of [this.x + 2, this.x + 38]) {
          ctx.save(); ctx.translate(px, this.y + 5);
          ctx.rotate(propAngle);
          ctx.fillRect(-8, -1, 16, 2);
          ctx.restore();
        }
        ctx.restore();
        break;
      case 'laser_grid':
        ctx.save();
        const laserPulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.5;
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.6 + laserPulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = '#ff0000';
        // Horizontal beams
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(this.x, this.y + i * 8 + 2);
          ctx.lineTo(this.x + this.width, this.y + i * 8 + 2);
          ctx.stroke();
        }
        // End nodes
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(this.x - 3, this.y - 2, 6, this.height + 4);
        ctx.fillRect(this.x + this.width - 3, this.y - 2, 6, this.height + 4);
        ctx.shadowBlur = 0;
        ctx.restore();
        break;
      case 'firewall':
        ctx.save();
        // Brick pattern
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
        for (let row = 0; row < 4; row++) {
          const yy = this.y + row * 10;
          ctx.beginPath(); ctx.moveTo(this.x, yy); ctx.lineTo(this.x + this.width, yy); ctx.stroke();
          const off = row % 2 === 0 ? 0 : 15;
          for (let col = off; col < this.width; col += 30) {
            ctx.beginPath(); ctx.moveTo(this.x + col, yy); ctx.lineTo(this.x + col, yy + 10); ctx.stroke();
          }
        }
        // Fire top
        ctx.shadowBlur = 8; ctx.shadowColor = '#ff6600';
        for (let i = 0; i < 6; i++) {
          const fx = this.x + 5 + i * 10;
          const fh = 8 + Math.sin(Date.now() * 0.01 + i) * 5;
          ctx.fillStyle = i % 2 === 0 ? '#ff4400' : '#ffaa00';
          ctx.beginPath();
          ctx.moveTo(fx, this.y); ctx.lineTo(fx + 5, this.y - fh); ctx.lineTo(fx + 10, this.y);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
        break;
      case 'ai_drone':
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        // Outer shell
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
        // Inner ring
        ctx.strokeStyle = '#e056fd'; ctx.lineWidth = 2;
        ctx.shadowBlur = 12; ctx.shadowColor = '#e056fd';
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
        // AI Eye
        const eyePulse = 0.5 + Math.sin(Date.now() * 0.006) * 0.5;
        ctx.fillStyle = `rgba(224, 86, 253, ${0.7 + eyePulse * 0.3})`;
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        // Scanning beam
        ctx.strokeStyle = `rgba(224, 86, 253, ${0.2 + eyePulse * 0.3})`;
        ctx.lineWidth = 1;
        const scanAngle = Date.now() * 0.003;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(scanAngle) * 25, Math.sin(scanAngle) * 25);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        break;
    }
  }
}
