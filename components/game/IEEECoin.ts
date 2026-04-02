import { GAME_CONFIG } from "@/lib/gameConfig";

export class IEEECoin {
  width: number = 40;
  height: number = 40;
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
    ctx.translate(this.x, this.y + this.floatOffset);
    
    // Draw Coin
    ctx.fillStyle = '#f1c40f'; // Golden
    ctx.beginPath();
    ctx.arc(this.width/2, this.height/2, this.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#f39c12'; // Inner ring
    ctx.beginPath();
    ctx.arc(this.width/2, this.height/2, this.width/2 - 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("IEEE", this.width/2, this.height/2 - 4);
    ctx.fillText("1946", this.width/2, this.height/2 + 6);
    
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
