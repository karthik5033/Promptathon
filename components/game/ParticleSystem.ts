import { GAME_CONFIG } from "@/lib/gameConfig";

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  markedForDeletion: boolean;

  constructor(x: number, y: number, vx: number, vy: number, size: number, color: string) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = Math.max(1, size);
    this.color = color;
    this.alpha = 1;
    this.markedForDeletion = false;
  }

  update(currentSpeed: number) {
    this.x += this.vx - currentSpeed;
    this.y += this.vy;
    this.alpha -= 0.04;
    this.size *= 0.95;
    if (this.alpha <= 0 || this.size < 0.2) this.markedForDeletion = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
