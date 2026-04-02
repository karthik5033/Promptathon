import { GAME_CONFIG, CharacterId } from "@/lib/gameConfig";
import { Particle } from "./ParticleSystem";
import { Platform } from "./Platform";
import { drawMario, drawBill, drawRobot, drawAda, drawLinus } from "./CharacterRenderer";

export type HintUrgency = "NOW" | "SOON" | "SAFE";

export interface HintResult {
  shouldJump: boolean;
  urgency: HintUrgency;
  landingX: number;
  clearanceMargin: number;
}

export class Player {
  width: number = 36;
  height: number = 40;
  x: number;
  y: number;
  vy: number = 0;
  isGrounded: boolean = true;
  canvas: HTMLCanvasElement;
  characterId: CharacterId;

  canDoubleJump: boolean = false;
  hasDoubleJumped: boolean = false;

  hasShield: boolean = false;
  shieldTimer: number = 0;
  shieldMaxTime: number = 300;

  isInvincible: boolean = false;
  invincibleTimer: number = 0;

  isSuper: boolean = false;
  superTimer: number = 0;
  baseWidth: number = 36;
  baseHeight: number = 40;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.x = 120;
    this.y = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio) - this.height;
    
    // Load selected character or default to robot
    const savedChar = typeof window !== 'undefined' ? localStorage.getItem('selectedCharacter') : 'robot';
    this.characterId = (savedChar || 'robot') as CharacterId;
  }

  activateShield() {
    this.hasShield = true;
    this.shieldTimer = this.shieldMaxTime;
  }

  hitObstacle(): boolean {
    if (this.isInvincible || this.isSuper) return false;
    if (this.hasShield) {
      this.hasShield = false;
      this.shieldTimer = 0;
      this.isInvincible = true;
      this.invincibleTimer = 60;
      return false; 
    }
    return true; 
  }

  becomeSuper() {
    this.isSuper = true;
    this.superTimer = 400; // ~6.6 seconds at 60fps
    this.width = this.baseWidth * 1.5;
    this.height = this.baseHeight * 1.5;
    // Push up slightly so we don't fall through ground
    this.y -= (this.baseHeight * 0.5);
  }

  predictJumpPath(obstacles: any[], speed: number): HintResult {
    const upcoming = obstacles.filter(o => o.x > this.x && o.x - this.x < 600);
    if (upcoming.length === 0) return { shouldJump: false, urgency: "SAFE", landingX: 0, clearanceMargin: 0 };
    
    let nextObs = upcoming[0];
    for(let o of upcoming) if (o.x < nextObs.x) nextObs = o;
    if (!nextObs.getHitbox) return { shouldJump: false, urgency: "SAFE", landingX: 0, clearanceMargin: 0 };
    const obH = nextObs.getHitbox();
    
    const dist = nextObs.x - this.x;
    let urgency: HintUrgency = "SAFE";
    if (dist < 400 && dist >= 200) urgency = "SOON";
    else if (dist < 200) urgency = "NOW";

    if (urgency === "SAFE") return { shouldJump: false, urgency, landingX: 0, clearanceMargin: 0 };

    let simX = this.x;
    let simY = this.y;
    let simVy = GAME_CONFIG.jumpForce;
    let wouldCollide = false;
    let maxT = 150;
    const absoluteGroundY = this.canvas.height - (this.canvas.height * GAME_CONFIG.groundHeightRatio);

    while (simY < absoluteGroundY - this.height && maxT > 0) {
      simX += speed; 
      simVy += GAME_CONFIG.gravity;
      simY += simVy;
      
      const realObstacleX = obH.x - (this.x - simX);

      if (simX + this.width > realObstacleX && simX < realObstacleX + obH.width) {
        if (simY + this.height > obH.y) {
          wouldCollide = true;
          break;
        }
      }
      maxT--;
    }

    return { 
      shouldJump: wouldCollide, 
      urgency: wouldCollide ? urgency : "SAFE", 
      landingX: simX, 
      clearanceMargin: 0 
    };
  }

  update(keys: { [key: string]: boolean }, frames: number, particles: Particle[], platforms: Platform[], speed: number) {
    const prevY = this.y;
    const prevX = this.x;

    const isDucking = keys.ArrowDown && this.isGrounded;
    const targetHeight = isDucking ? 20 : 40;
    const heightDiff = this.height - targetHeight;
    if (heightDiff !== 0) {
      this.height = targetHeight;
      this.y += heightDiff;
    }

    // Horizontal Movement
    if (keys.ArrowLeft) {
      this.x -= GAME_CONFIG.playerSpeed;
    }
    if (keys.ArrowRight) {
      this.x += GAME_CONFIG.playerSpeed;
    }

    // Gravity and Vertical Action
    if ((GAME_CONFIG as any).gravityEnabled) {
      this.vy += GAME_CONFIG.gravity;
    } else {
      if (keys.Space || keys.ArrowUp) {
        this.vy = -(GAME_CONFIG as any).flySpeed;
      } else if (keys.ArrowDown) {
        this.vy = (GAME_CONFIG as any).flySpeed;
      } else {
        this.vy = 0;
      }
    }

    // Super state decay
    if (this.isSuper) {
      this.superTimer--;
      if (this.superTimer <= 0) {
        this.isSuper = false;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
      }
    }

    if (this.isInvincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }

    this.y += this.vy;

    const absoluteGroundY = this.canvas.height - (this.canvas.height * GAME_CONFIG.groundHeightRatio);
    let floorY = absoluteGroundY;

    this.isGrounded = false;
    let standingOnPlatform = false;

    // Platform collisions
    for (const plat of platforms) {
      const ph = plat.getHitbox();
      
      // Horizontal intersection check
      const horizontalMatch = this.x + this.width > ph.x && this.x < ph.x + ph.width;
      const verticalMatch = this.y + this.height > ph.y && this.y < ph.y + ph.height;

      if (horizontalMatch && verticalMatch) {
         // Did we land on top?
         const wasAbove = prevY + this.height <= ph.y + 0.1; // +0.1 for float precision
         if (wasAbove && this.vy > 0) {
            this.y = ph.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
            standingOnPlatform = true;
            floorY = ph.y;
         } else {
             // Platform is one-way! We can jump through from the bottom or sides unharmed.
         }
      }
    }

    // Absolute Ground collision fallback
    if (this.y + this.height >= absoluteGroundY && !standingOnPlatform) {
      if (!this.isGrounded && prevY + this.height < absoluteGroundY) {
        for (let i = 0; i < 10; i++) {
          particles.push(new Particle(
            this.x + this.width / 2 + (Math.random() * 24 - 12),
            absoluteGroundY,
            (Math.random() - 0.5) * 4,
            -Math.random() * 3 - 1,
            Math.random() * 4 + 2,
            'rgba(236, 240, 241, 0.7)'
          ));
        }
      }
      this.y = absoluteGroundY - this.height;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      if ((GAME_CONFIG as any).gravityEnabled && !standingOnPlatform) {
        this.isGrounded = false;
      }
    }
    
    // Ceiling boundary
    if (this.y < 0) {
      this.y = 0;
      this.vy = 0;
    }

    if (this.isGrounded) {
       this.hasDoubleJumped = false;
       this.canDoubleJump = true;
    }

    // Jump logic
    if ((GAME_CONFIG as any).gravityEnabled) {
      // Normal jump — only when grounded
      if ((keys.Space || keys.ArrowUp) && !isDucking) {
        if (this.isGrounded) {
          this.vy = GAME_CONFIG.jumpForce;
          this.isGrounded = false;
          this.canDoubleJump = true;
          this.hasDoubleJumped = false;

          for (let i = 0; i < 8; i++) {
            particles.push(new Particle(
              this.x + this.width / 2 + (Math.random() * 16 - 8),
              floorY,
              -Math.random() * 2 - 1,
              -Math.random() * 2.5,
              Math.random() * 3 + 2,
              'rgba(236, 240, 241, 0.6)'
            ));
          }
        } else if (this.canDoubleJump && !this.hasDoubleJumped && !keys._jumpConsumed) {
          this.vy = GAME_CONFIG.doubleJumpForce;
          this.hasDoubleJumped = true;
          keys._jumpConsumed = true;

          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            particles.push(new Particle(
              this.x + this.width / 2,
              this.y + this.height / 2,
              Math.cos(angle) * 3,
              Math.sin(angle) * 3,
              Math.random() * 3 + 2,
              `hsla(${Math.random() * 60 + 180}, 100%, 70%, 0.8)`
            ));
          }
        }
      }
      if (!keys.Space && !keys.ArrowUp) {
        keys._jumpConsumed = false;
      }
    }

    // Dust particles
    if (this.isGrounded && frames % 6 === 0 && Array.isArray(particles)) {
      particles.push(new Particle(
        this.x + 8,
        floorY,
        -1.5 - Math.random() * 2,
        -Math.random() - 0.3,
        Math.random() * 2.5 + 1.5,
        'rgba(236, 240, 241, 0.4)'
      ));
    }

    // Bounds limit logic (Freely roam horizontally within screen, but die if pushed out left)
    if (this.x < -this.width) {
       // Allow going out extremely left (handled in checkCollisions Game Over)
    }
    if (this.x > this.canvas.width - this.width) {
      this.x = this.canvas.width - this.width;
    }

    if (this.hasShield) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) this.hasShield = false;
    }
    if (this.isInvincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }

    if (!(GAME_CONFIG as any).gravityEnabled) {
      // Left thruster trail
      particles.push(new Particle(
        this.x - 4,
        this.y + this.height * 0.5 + (Math.random() * 10 - 5),
        -(Math.random() * 3 + 2),
        (Math.random() - 0.5) * 1.5,
        Math.random() * 4 + 2,
        `hsl(${Math.random() * 60 + 200}, 100%, 70%)`
      ));

      if (keys.ArrowUp || keys.Space) {
        // Bottom thruster
        particles.push(new Particle(
          this.x + this.width * 0.5 + (Math.random() * 10 - 5),
          this.y + this.height + 2,
          (Math.random() - 0.5) * 1.5,
          Math.random() * 3 + 2,
          Math.random() * 4 + 3,
          `hsl(${Math.random() * 40 + 20}, 100%, 65%)`
        ));
      }

      if (keys.ArrowDown) {
        // Top thruster
        particles.push(new Particle(
          this.x + this.width * 0.5 + (Math.random() * 10 - 5),
          this.y - 2,
          (Math.random() - 0.5) * 1.5,
          -(Math.random() * 3 + 2),
          Math.random() * 4 + 3,
          `hsl(${Math.random() * 40 + 20}, 100%, 65%)`
        ));
      }
    } else if (!this.isGrounded && frames % 3 === 0) {
      particles.push(new Particle(
        this.x + this.width / 2 + (Math.random() * 6 - 3),
        this.y + this.height,
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5 + 0.5,
        Math.random() * 2 + 1,
        `hsla(200, 80%, 70%, ${0.3 + Math.random() * 0.3})`
      ));
    }
  }

  draw(ctx: CanvasRenderingContext2D, frames: number, speed: number) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const bounceY = this.isGrounded ? Math.abs(Math.sin(frames * 0.2)) * 2 : 0;
    ctx.translate(0, -bounceY);
    
    if (!(GAME_CONFIG as any).gravityEnabled) {
      const tilt = Math.max(-0.3, Math.min(0.3, this.vy * 0.04));
      ctx.translate(this.width/2, this.height/2);
      ctx.rotate(tilt);
      ctx.translate(-this.width/2, -this.height/2);
    }

    if (this.isInvincible && frames % 4 < 2) {
      ctx.globalAlpha = 0.4;
    }

    switch (this.characterId) {
      case 'mario': drawMario(ctx, this.width, this.height, frames, this.isGrounded); break;
      case 'bill':  drawBill(ctx, this.width, this.height, frames, this.isGrounded);  break;
      case 'robot': drawRobot(ctx, this.width, this.height, frames, this.isGrounded); break;
      case 'ada':   drawAda(ctx, this.width, this.height, frames, this.isGrounded);   break;
      case 'linus': drawLinus(ctx, this.width, this.height, frames, this.isGrounded); break;
      default:      drawRobot(ctx, this.width, this.height, frames, this.isGrounded); break;
    }

    if (this.hasShield) {
      ctx.save();
      const shimmer = 0.3 + Math.sin(frames * 0.1) * 0.15;
      const pulseAlpha = this.shieldTimer < 60 ? (Math.sin(frames * 0.3) * 0.3 + 0.3) : shimmer;
      ctx.strokeStyle = `rgba(52, 152, 219, ${pulseAlpha + 0.3})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#3498db';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(this.width / 2, this.height / 2, this.width * 0.7, this.height * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (!this.isGrounded && !this.hasDoubleJumped && this.canDoubleJump) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 100, ${0.4 + Math.sin(frames * 0.2) * 0.2})`;
      ctx.beginPath();
      ctx.arc(-2, this.height * 0.4, 3, 0, Math.PI * 2);
      ctx.arc(this.width + 2, this.height * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }


}

