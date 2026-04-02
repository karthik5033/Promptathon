import { GAME_CONFIG, ERAS } from "@/lib/gameConfig";

export class Obstacle {
  x: number;
  y: number;
  width: number = 32;
  height: number = 28;
  eraId: number;
  canvas: HTMLCanvasElement;
  markedForDeletion: boolean = false;
  animFrame: number = 0;
  scored: boolean = false;
  enemySpeed: number;
  
  bounceY: number = 0;
  isBouncing: boolean;

  constructor(canvas: HTMLCanvasElement, eraId: number, currentSpeed: number) {
    this.canvas = canvas;
    this.eraId = eraId;
    this.x = canvas.width + Math.random() * 200;
    
    // Some robots walk slowly, some bounce
    this.isBouncing = Math.random() > 0.6;
    this.enemySpeed = Math.random() * 1.5 + 0.5; 

    const groundY = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio);
    this.y = groundY - this.height;
  }

  update(currentSpeed: number) {
    this.animFrame += 1;
    this.x -= (currentSpeed + this.enemySpeed);

    if (this.isBouncing) {
       this.bounceY = Math.abs(Math.sin(this.animFrame * 0.15)) * 15; 
    }

    if (this.x + this.width < -100) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y - this.bounceY);

    const eraInfo = ERAS[this.eraId - 1];
    const u = this.width / 8;
    const v = this.height / 7;
    
    // Era styling tweaks
    const bodyColor = eraInfo?.groundAccent || '#d35400';
    const accentColor = '#2c3e50';
    
    // Mushroom / Robot Dome Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(1*u, 3*v);
    ctx.quadraticCurveTo(4*u, -2*v, 7*u, 3*v); // Dome top
    ctx.lineTo(8*u, 4*v);
    ctx.lineTo(0*u, 4*v);
    ctx.fill();

    // Eyes (Angry slant)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2*u, 2*v, 1.5*u, 1*v);
    ctx.fillRect(4.5*u, 2*v, 1.5*u, 1*v);
    
    // Pupils
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(2.5*u, 2.2*v, 0.5*u, 0.8*v);
    ctx.fillRect(5*u, 2.2*v, 0.5*u, 0.8*v);

    // Robot body / stalk
    ctx.fillStyle = accentColor;
    ctx.fillRect(2*u, 4*v, 4*u, 2*v);
    
    // Feet (animate walk cycle)
    ctx.fillStyle = '#0a0a0a';
    const stride = Math.sin(this.animFrame * 0.2) * 1.5;
    if (this.isBouncing && this.bounceY > 2) {
       // feet tucked when jumping
       ctx.fillRect(2*u, 6*v, 1.5*u, 1*v);
       ctx.fillRect(4.5*u, 6*v, 1.5*u, 1*v);
    } else {
       ctx.fillRect((2 - stride)*u, 6*v, 1.5*u, 1*v);
       ctx.fillRect((4.5 + stride)*u, 6*v, 1.5*u, 1*v);
    }
    
    // Glowing core
    ctx.shadowBlur = 8;
    ctx.shadowColor = eraInfo?.starColor || '#f1c40f';
    ctx.fillStyle = ctx.shadowColor;
    ctx.fillRect(3.5*u, 4.5*v, 1*u, 1*v);

    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x + 4,
      y: this.y - this.bounceY + 4,
      width: this.width - 8,
      height: this.height - 4
    };
  }
}
