import { GAME_CONFIG } from "@/lib/gameConfig";

export class IEEECoin {
  width: number = 24;
  height: number = 24;
  x: number;
  y: number;
  markedForDeletion: boolean = false;
  floatOffset: number = 0;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth;
    const groundY = canvasHeight - (canvasHeight * GAME_CONFIG.groundHeightRatio);
    this.y = groundY - 100; // Floating reasonably above ground
  }

  update(currentSpeed: number, frames: number) {
    this.x -= currentSpeed;
    this.floatOffset = Math.sin(frames * 0.1) * 10;
    if (this.x + this.width < 0) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + this.floatOffset);
    
    // Draw Coin with glowing effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#f1c40f'; // Golden / yellow
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Text "80"
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("80", 0, 1);
    
    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y + this.floatOffset,
      width: this.width,
      height: this.height
    };
  }
}
