import { GAME_CONFIG } from "@/lib/gameConfig";

export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  eraId: number;
  canvas: HTMLCanvasElement;
  markedForDeletion: boolean = false;
  isFloating: boolean;
  animFrame: number = 0;
  scored: boolean = false; // For combo system — track if player passed this

  constructor(canvas: HTMLCanvasElement, eraId: number, currentSpeed: number) {
    this.canvas = canvas;
    this.eraId = eraId;
    this.x = canvas.width + Math.random() * 200;

    this.isFloating = Math.random() < 0.25; // 25% chance for floating

    const groundY = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio);

    // Era-dependent sizing for visual variety
    if (eraId <= 2) {
      this.width = 30 + Math.random() * 20;
      this.height = 35 + Math.random() * 25;
    } else if (eraId <= 4) {
      this.width = 35 + Math.random() * 25;
      this.height = 40 + Math.random() * 30;
    } else {
      this.width = 30 + Math.random() * 30;
      this.height = 35 + Math.random() * 35;
    }

    if (this.isFloating) {
      this.y = groundY - 55 - this.height - Math.random() * 30;
    } else {
      this.y = groundY - this.height;
    }

    // Choose obstacle type
    const rand = Math.random();
    if (eraId === 1) {
      this.type = rand > 0.5 ? 'tube' : 'punchcard';
    } else if (eraId === 2) {
      this.type = rand > 0.5 ? 'reeltoreel' : 'mainframe';
    } else if (eraId === 3) {
      if (rand < 0.33) this.type = 'floppy';
      else if (rand < 0.66) this.type = 'crt';
      else this.type = 'keyboard';
    } else if (eraId === 4) {
      if (rand < 0.33) this.type = 'browser';
      else if (rand < 0.66) this.type = 'wifi';
      else this.type = 'server';
    } else {
      if (rand < 0.33) this.type = 'neural';
      else if (rand < 0.66) this.type = 'tensor';
      else this.type = 'glitch';
    }

    this.animFrame = Math.random() * 100;
  }

  update(currentSpeed: number) {
    this.x -= currentSpeed;
    this.animFrame++;

    // Floating obstacles bob gently
    if (this.isFloating) {
      this.y += Math.sin(this.animFrame * 0.03) * 0.3;
    }

    if (this.x + this.width < -50) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Subtle entrance slide
    const entryAlpha = Math.min(1, (this.canvas.width - this.x - this.width) / 100);
    ctx.globalAlpha = Math.max(0.3, entryAlpha);

    if (this.eraId === 1) {
      this.drawEra1(ctx);
    } else if (this.eraId === 2) {
      this.drawEra2(ctx);
    } else if (this.eraId === 3) {
      this.drawEra3(ctx);
    } else if (this.eraId === 4) {
      this.drawEra4(ctx);
    } else {
      this.drawEra5(ctx);
    }

    ctx.restore();
  }

  private drawEra1(ctx: CanvasRenderingContext2D) {
    if (this.type === 'tube') {
      // Vacuum tube with glow effect
      const glow = 0.6 + Math.sin(this.animFrame * 0.08) * 0.3;
      ctx.shadowColor = '#ff4d4d';
      ctx.shadowBlur = 10 * glow;
      ctx.fillStyle = `rgba(255, 184, 184, ${0.7 + glow * 0.3})`;
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, [10, 10, 4, 4]);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Glass capsule highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(4, 3, this.width * 0.3, this.height - 12);

      // Internal filament
      ctx.strokeStyle = `rgba(255, 77, 77, ${glow})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.width / 2, 8);
      for (let i = 8; i < this.height - 8; i += 4) {
        ctx.lineTo(this.width / 2 + Math.sin(i * 0.3) * 4, i);
      }
      ctx.stroke();

      // Base pins
      ctx.fillStyle = '#666';
      ctx.fillRect(this.width * 0.2, this.height - 6, 4, 6);
      ctx.fillRect(this.width * 0.6, this.height - 6, 4, 6);
    } else {
      // Punchcard with realistic detail
      ctx.fillStyle = '#f5f0e0';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = '#c4a882';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, this.width, this.height);

      // Punched holes grid
      ctx.fillStyle = '#2d1b00';
      for (let i = 4; i < this.height - 4; i += 6) {
        for (let j = 4; j < this.width - 4; j += 5) {
          if (Math.sin(i * j * 0.7) > 0.2) {
            ctx.fillRect(j, i, 3, 4);
          }
        }
      }

      // Top stripe
      ctx.fillStyle = '#d4a76a';
      ctx.fillRect(0, 0, this.width, 5);
    }
  }

  private drawEra2(ctx: CanvasRenderingContext2D) {
    if (this.type === 'reeltoreel') {
      // Mainframe tape reel
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.strokeStyle = '#2f3640';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, this.width, this.height);

      // Spinning reels
      const spin = this.animFrame * 0.05;
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 2;
      const cx1 = this.width / 2;
      const cy1 = this.height / 4;
      const cx2 = this.width / 2;
      const cy2 = (this.height * 3) / 4;
      const r = Math.min(this.width, this.height) * 0.22;

      [{ x: cx1, y: cy1 }, { x: cx2, y: cy2 }].forEach((c) => {
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Spokes
        ctx.strokeStyle = '#666';
        for (let s = 0; s < 4; s++) {
          const a = spin + (s * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r);
          ctx.stroke();
        }

        // Center dot
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Mainframe block with blinking lights
      ctx.fillStyle = '#2c3a47';
      ctx.fillRect(0, 0, this.width, this.height);

      // Panel lines
      ctx.strokeStyle = '#3d5159';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, this.width - 4, this.height - 4);

      // Blinking indicator lights
      for (let i = 6; i < this.height - 6; i += 8) {
        const isOn = Math.sin(this.animFrame * 0.1 + i) > 0;
        ctx.fillStyle = isOn ? '#4cd137' : '#1e3521';
        ctx.fillRect(5, i, 6, 4);
        ctx.fillStyle = isOn ? '#e84118' : '#3d1f12';
        ctx.fillRect(this.width - 11, i, 6, 4);
      }
    }
  }

  private drawEra3(ctx: CanvasRenderingContext2D) {
    if (this.type === 'floppy') {
      // 3.5" floppy disk
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, 3);
      ctx.fill();

      // Metal shutter
      ctx.fillStyle = '#636e72';
      ctx.fillRect(this.width * 0.25, 0, this.width * 0.5, this.height * 0.25);

      // Label area
      ctx.fillStyle = '#dfe6e9';
      ctx.fillRect(this.width * 0.1, this.height * 0.4, this.width * 0.8, this.height * 0.45);

      // Write-protect tab
      ctx.fillStyle = '#b2bec3';
      ctx.fillRect(this.width - 8, this.height - 8, 6, 6);
    } else if (this.type === 'crt') {
      // CRT monitor with screen glow
      ctx.fillStyle = '#b2bec3';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height * 0.85, 4);
      ctx.fill();

      // Screen
      ctx.fillStyle = '#001a00';
      ctx.fillRect(4, 4, this.width - 8, this.height * 0.7);

      // Scanline effect
      ctx.fillStyle = 'rgba(0, 255, 65, 0.1)';
      for (let i = 4; i < this.height * 0.74; i += 3) {
        ctx.fillRect(4, i, this.width - 8, 1);
      }

      // Terminal text
      ctx.fillStyle = '#00ff41';
      ctx.font = `${Math.max(6, this.width * 0.18)}px monospace`;
      ctx.fillText('C:\\>', 7, this.height * 0.3);
      const cursor = this.animFrame % 40 < 20 ? '█' : '';
      ctx.fillText('>' + cursor, 7, this.height * 0.5);

      // Base/stand
      ctx.fillStyle = '#636e72';
      ctx.fillRect(this.width * 0.3, this.height * 0.82, this.width * 0.4, this.height * 0.18);
    } else {
      // Keyboard
      ctx.fillStyle = '#dfe6e9';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height * 0.5, 3);
      ctx.fill();

      // Key rows
      ctx.fillStyle = '#b2bec3';
      for (let row = 0; row < 3; row++) {
        for (let i = 2 + row; i < this.width - 3; i += 7) {
          ctx.fillRect(i, 3 + row * Math.floor(this.height * 0.14), 5, Math.floor(this.height * 0.1));
        }
      }
    }
  }

  private drawEra4(ctx: CanvasRenderingContext2D) {
    if (this.type === 'browser') {
      // Browser window
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, 4);
      ctx.fill();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Title bar
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, 12);

      // Traffic light buttons
      const btnY = 4;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath(); ctx.arc(8, btnY + 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f39c12';
      ctx.beginPath(); ctx.arc(16, btnY + 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#27ae60';
      ctx.beginPath(); ctx.arc(24, btnY + 2, 3, 0, Math.PI * 2); ctx.fill();

      // URL bar
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(4, 14, this.width - 8, 8);

      // Content lines
      ctx.fillStyle = '#bdc3c7';
      for (let i = 28; i < this.height - 6; i += 8) {
        ctx.fillRect(6, i, this.width * (0.4 + Math.random() * 0.4), 4);
      }
    } else if (this.type === 'wifi') {
      // WiFi signal with pulse animation
      const pulse = 0.5 + Math.sin(this.animFrame * 0.05) * 0.3;
      ctx.strokeStyle = `rgba(52, 152, 219, ${pulse + 0.2})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      const cx = this.width / 2;
      const cy = this.height;
      for (let i = 3; i >= 1; i--) {
        const arcAlpha = pulse + (3 - i) * 0.15;
        ctx.strokeStyle = `rgba(52, 152, 219, ${Math.min(1, arcAlpha)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, (this.width / 2) * (i / 3), Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      }

      // Center dot
      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Server rack with activity lights
      ctx.fillStyle = '#2c3a47';
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, 3);
      ctx.fill();

      // Server units
      for (let i = 3; i < this.height - 3; i += 10) {
        ctx.fillStyle = '#3d5159';
        ctx.fillRect(3, i, this.width - 6, 7);

        // Activity LED
        const active = Math.sin(this.animFrame * 0.1 + i * 2) > 0;
        ctx.fillStyle = active ? '#00a8ff' : '#1a3d4d';
        ctx.beginPath();
        ctx.arc(this.width - 8, i + 3.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Blinking ventilation slots
      ctx.fillStyle = 'rgba(0, 168, 255, 0.15)';
      ctx.fillRect(3, this.height - 8, this.width - 6, 5);
    }
  }

  private drawEra5(ctx: CanvasRenderingContext2D) {
    if (this.type === 'neural') {
      // Neural network node
      const pulse = 0.5 + Math.sin(this.animFrame * 0.06) * 0.4;
      ctx.shadowColor = '#e056fd';
      ctx.shadowBlur = 15 * pulse;

      // Connection lines
      ctx.strokeStyle = `rgba(224, 86, 253, ${pulse * 0.6})`;
      ctx.lineWidth = 1.5;
      const nodes = [
        { x: 0, y: 0 },
        { x: this.width, y: 0 },
        { x: 0, y: this.height },
        { x: this.width, y: this.height },
        { x: this.width * 0.3, y: this.height * 0.3 },
        { x: this.width * 0.7, y: this.height * 0.7 },
      ];
      const center = { x: this.width / 2, y: this.height / 2 };
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(center.x, center.y);
        ctx.stroke();
      });

      // Central node
      ctx.shadowBlur = 20 * pulse;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
      ctx.beginPath();
      ctx.arc(center.x, center.y, this.width * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Outer nodes
      ctx.fillStyle = `rgba(224, 86, 253, ${0.6 + pulse * 0.3})`;
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    } else if (this.type === 'tensor') {
      // Tensor/matrix block
      const hue = (this.animFrame * 0.5) % 360;
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.7)`;
      ctx.fillRect(0, 0, this.width, this.height);

      // Grid overlay
      ctx.strokeStyle = `hsla(${hue + 60}, 80%, 70%, 0.5)`;
      ctx.lineWidth = 1;
      for (let i = 0; i <= this.width; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, this.height);
        ctx.stroke();
      }
      for (let i = 0; i <= this.height; i += 8) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(this.width, i);
        ctx.stroke();
      }

      // Floating values
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          const val = (Math.sin(this.animFrame * 0.02 + r + c) * 0.5 + 0.5).toFixed(1);
          ctx.fillText(val, 4 + c * (this.width / 2), 12 + r * (this.height / 3));
        }
      }
    } else {
      // Glitch block — corrupted data
      ctx.fillStyle = '#1a0033';
      ctx.fillRect(0, 0, this.width, this.height);

      // Scanlines
      for (let i = 0; i < this.height; i += 2) {
        const glitchShift = Math.sin(this.animFrame * 0.15 + i * 0.5) > 0.7 ? (Math.random() * 6 - 3) : 0;
        const hue = (this.animFrame + i * 3) % 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.6)`;
        ctx.fillRect(glitchShift, i, this.width, 1);
      }

      // Error symbol
      ctx.fillStyle = 'rgba(255, 0, 100, 0.8)';
      ctx.font = `bold ${Math.max(10, this.width * 0.35)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ERR', this.width / 2, this.height / 2);
    }
  }

  getHitbox() {
    const marginX = this.width * 0.12;
    const marginY = this.height * 0.12;
    return {
      x: this.x + marginX,
      y: this.y + marginY,
      width: this.width * 0.76,
      height: this.height * 0.76,
    };
  }
}
