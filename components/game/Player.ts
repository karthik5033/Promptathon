import { GAME_CONFIG } from "@/lib/gameConfig";
import { Particle } from "./ParticleSystem";

export class Player {
  width: number = 30;
  height: number = 40;
  x: number;
  y: number;
  vy: number = 0;
  isGrounded: boolean = true;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.x = Math.min(100, canvas.width * 0.1);
    this.y = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio) - this.height;
  }

  update(keys: { [key: string]: boolean }, frames: number, particles: Particle[]) {
    this.vy += GAME_CONFIG.gravity;
    this.y += this.vy;

    const groundY = this.canvas.height - (this.canvas.height * GAME_CONFIG.groundHeightRatio);
    if (this.y + this.height >= groundY) {
      if (!this.isGrounded) {
        for(let i = 0; i < 8; i++) {
          particles.push(new Particle(
            this.x + this.width / 2 + (Math.random() * 20 - 10),
            groundY,
            (Math.random() - 0.5) * 3,
            -Math.random() * 2 - 1,
            Math.random() * 3 + 3,
            'rgba(236, 240, 241, 0.7)'
          ));
        }
      }
      this.y = groundY - this.height;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    if ((keys.Space || keys.ArrowUp) && this.isGrounded) {
      this.vy = GAME_CONFIG.jumpForce;
      this.isGrounded = false;
      
      for(let i = 0; i < 6; i++) {
        particles.push(new Particle(
          this.x + this.width / 2 + (Math.random() * 16 - 8),
          groundY,
          -Math.random() * 2 - 1,
          -Math.random() * 2,
          Math.random() * 3 + 2,
          'rgba(236, 240, 241, 0.6)'
        ));
      }
    }

    if (this.isGrounded && frames % 8 === 0) {
      particles.push(new Particle(
        this.x + 10,
        groundY,
        -1 - Math.random() * 2,
        -Math.random() - 0.5,
        Math.random() * 3 + 2,
        'rgba(236, 240, 241, 0.5)'
      ));
    }

    if (keys.ArrowLeft) {
      this.x -= GAME_CONFIG.playerSpeed;
    }
    if (keys.ArrowRight) {
      this.x += GAME_CONFIG.playerSpeed;
    }

    if (this.x < 0) this.x = 0;
    const playerLimitX = this.canvas.width / 2;
    if (this.x + this.width > playerLimitX) {
      this.x = playerLimitX - this.width;
    }
  }

  draw(ctx: CanvasRenderingContext2D, frames: number) {
    ctx.save();
    ctx.translate(this.x, this.y);

    let bounceY = this.isGrounded ? Math.abs(Math.sin(frames * 0.2)) * 2 : 0;
    ctx.translate(0, -bounceY);

    const u = this.width / 12; 
    const v = this.height / 16;
    
    const R = '#e52521'; 
    const BL = '#0043bb'; 
    const P = '#ffcca6'; 
    const BR = '#5c3a21'; 
    const Y = '#fdf104'; 

    // Hat
    ctx.fillStyle = R;
    ctx.fillRect(3*u, 0*v, 5*u, 2*v);
    ctx.fillRect(2*u, 2*v, 9*u, 1*v); 
    
    // Head 
    ctx.fillStyle = BR;
    ctx.fillRect(2*u, 3*v, 3*u, 3*v); 
    ctx.fillRect(1*u, 4*v, 1*u, 3*v); 
    
    ctx.fillStyle = P;
    ctx.fillRect(5*u, 3*v, 4*u, 4*v); 
    ctx.fillRect(9*u, 4*v, 2*u, 2*v); 
    ctx.fillRect(3*u, 6*v, 6*u, 1*v); 
    
    ctx.fillStyle = BR;
    ctx.fillRect(7*u, 3*v, 1*u, 2*v); 
    ctx.fillRect(7*u, 5*v, 4*u, 1*v); 
    
    // Body 
    ctx.fillStyle = R;
    ctx.fillRect(2*u, 7*v, 3*u, 4*v); 
    ctx.fillRect(7*u, 7*v, 3*u, 4*v); 
    ctx.fillRect(4*u, 7*v, 4*u, 2*v); 

    ctx.fillStyle = BL;
    ctx.fillRect(4*u, 9*v, 4*u, 4*v); 
    ctx.fillRect(3*u, 8*v, 1*u, 3*v); 
    ctx.fillRect(8*u, 8*v, 1*u, 3*v); 

    ctx.fillStyle = Y;
    ctx.fillRect(3*u, 10*v, 1*u, 1*v); 
    ctx.fillRect(8*u, 10*v, 1*u, 1*v); 

    // Hands
    ctx.fillStyle = P;
    ctx.fillRect(1*u, 9*v, 2*u, 2*v); 
    ctx.fillRect(9*u, 9*v, 2*u, 2*v); 

    // Legs/Shoes & Animation
    ctx.fillStyle = BR;
    let stride = this.isGrounded ? Math.sin(frames * 0.2) * 2 : 2;
    
    ctx.fillRect((3 - stride)*u, 13*v, 3*u, 2*v); 
    ctx.fillRect((6 + stride)*u, 13*v, 3*u, 2*v); 
    
    ctx.restore();
  }
}
