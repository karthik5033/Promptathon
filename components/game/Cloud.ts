export class Cloud {
  width: number;
  height: number;
  x: number;
  y: number;
  speed: number;
  markedForDeletion: boolean = false;

  constructor(canvasWidth: number, canvasHeight: number, currentSpeed: number) {
    this.width = 100 + Math.random() * 60;
    this.height = 40 + Math.random() * 20;
    this.x = canvasWidth + Math.random() * 100;
    this.y = Math.random() * (canvasHeight / 2 - this.height);
    this.speed = (Math.random() * 0.5 + 0.1) * (currentSpeed * 0.2);
  }

  update() {
    this.x -= this.speed;
    if (this.x + this.width < 0) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85; 
    
    ctx.beginPath();
    ctx.arc(this.width * 0.2, this.height * 0.7, this.height * 0.3, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(this.width * 0.45, this.height * 0.4, this.height * 0.4, Math.PI, Math.PI * 2);
    ctx.arc(this.width * 0.75, this.height * 0.5, this.height * 0.3, Math.PI, Math.PI * 2);
    ctx.arc(this.width * 0.85, this.height * 0.75, this.height * 0.25, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath(); 
    ctx.fill();
    
    ctx.restore();
  }
}
