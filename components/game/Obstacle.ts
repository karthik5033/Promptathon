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
} as const;

export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  eraId: number;
  type: keyof typeof OBSTACLE_SIZES;
  passed: boolean = false;
  scored: boolean = false;
  hitboxPadding: number = 8;
  markedForDeletion: boolean = false;

  constructor(canvas: HTMLCanvasElement, eraId: number) {
    this.eraId = eraId;
    
    let possibleTypes: (keyof typeof OBSTACLE_SIZES)[] = [];
    if (eraId === 1) possibleTypes = ['vacuum_tube', 'punchcard'];
    else if (eraId === 2) possibleTypes = ['reel_tape', 'mainframe'];
    else if (eraId === 3) possibleTypes = ['floppy', 'crt_monitor'];
    else if (eraId === 4) possibleTypes = ['browser', 'server_rack'];
    else if (eraId >= 5) possibleTypes = ['neural_node', 'glitch_stream'];
    else possibleTypes = ['vacuum_tube']; // fallback
    
    this.type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    const config = OBSTACLE_SIZES[this.type];
    
    this.width = config.width;
    this.height = config.height;
    
    // Always spawn at far right
    this.x = canvas.width;
    
    if (config.floating) {
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
    }
  }
}
