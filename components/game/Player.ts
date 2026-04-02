import { GAME_CONFIG, CharacterId } from "@/lib/gameConfig";
import { Particle } from "./ParticleSystem";
import { Platform } from "./Platform";

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
    if (this.isInvincible) return false;
    if (this.hasShield) {
      this.hasShield = false;
      this.shieldTimer = 0;
      this.isInvincible = true;
      this.invincibleTimer = 60;
      return false; 
    }
    return true; 
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
      case 'mario': this.drawMario(ctx, frames); break;
      case 'bill':  this.drawBill(ctx, frames);  break;
      case 'robot': this.drawRobot(ctx, frames); break;
      case 'ada':   this.drawAda(ctx, frames);   break;
      case 'linus': this.drawLinus(ctx, frames); break;
      default:      this.drawRobot(ctx, frames); break;
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

  // ── MARIO ─────────────────────────────────────────
  private drawMario(ctx: CanvasRenderingContext2D, frames: number) {
    const u = this.width / 10;
    const v = this.height / 16;
    const stride = this.isGrounded ? Math.sin(frames * 0.25) * 1.5 : 1.5;

    // Hat with shade
    ctx.fillStyle = '#e52521';
    ctx.fillRect(2*u, 0, 6*u, 2*v);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(1*u, 1.8*v, 8*u, 0.8*v);
    ctx.fillStyle = '#e52521';
    ctx.fillRect(1*u, 2*v, 8*u, 1*v);

    // Hair / Sideburns
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(1.5*u, 3*v, 1*u, 2*v);
    ctx.fillRect(7.5*u, 3*v, 1*u, 2*v);

    // Face
    ctx.fillStyle = '#ffcca6';
    ctx.fillRect(2*u, 3*v, 6*u, 3.5*v);

    // Mustache
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(2.5*u, 5.2*v, 5*u, 0.8*v);
    ctx.fillRect(1.5*u, 4.8*v, 1.5*u, 1.2*v);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(3.2*u, 3.8*v, 1*u, 1.2*v);
    ctx.fillRect(5.8*u, 3.8*v, 1*u, 1.2*v);

    // Overalls body
    ctx.fillStyle = '#1e40af'; // Richer blue
    ctx.fillRect(2.2*u, 6.5*v, 5.6*u, 5*v);

    // Yellow Buttons
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(3.2*u, 7.5*v, 0.8*u, 0.8*v);
    ctx.fillRect(6*u, 7.5*v, 0.8*u, 0.8*v);

    // Red shirt sleeves
    ctx.fillStyle = '#e52521';
    ctx.fillRect(0.5*u, 7*v, 2*u, 3*v);
    ctx.fillRect(7.5*u, 7*v, 2*u, 3*v);

    // Overall straps
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(3.2*u, 6*v, 1.2*u, 1.5*v);
    ctx.fillRect(5.6*u, 6*v, 1.2*u, 1.5*v);

    // Hands
    ctx.fillStyle = '#ffcca6';
    ctx.fillRect(0, 9*v, 1.8*u, 1.8*v);
    ctx.fillRect(8.2*u, 9*v, 1.8*u, 1.8*v);

    // Legs
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect((2.2 - stride)*u, 11*v, 2.5*u, 3*v);
    ctx.fillRect((5.3 + stride)*u, 11*v, 2.5*u, 3*v);

    // Boots
    ctx.fillStyle = '#451a03';
    ctx.fillRect((1.8 - stride)*u, 13.8*v, 3.2*u, 2.2*v);
    ctx.fillRect((5 + stride)*u, 13.8*v, 3.2*u, 2.2*v);
  }

  // ── BILL ──────────────────────────────────────────
  private drawBill(ctx: CanvasRenderingContext2D, frames: number) {
    const u = this.width / 10;
    const v = this.height / 16;
    const stride = this.isGrounded ? Math.sin(frames * 0.25) * 1.5 : 1.5;

    // Hair shaded
    ctx.fillStyle = '#451a03';
    ctx.fillRect(2*u, 0, 6*u, 1.5*v);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(2.5*u, 0.2*v, 5*u, 0.5*v);

    // Face
    ctx.fillStyle = '#ffcca6';
    ctx.fillRect(2*u, 1.5*v, 6*u, 4.5*v);

    // Glasses — with bridge
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.strokeRect(2.5*u, 2.8*v, 2.2*u, 1.8*v);
    ctx.strokeRect(5.3*u, 2.8*v, 2.2*u, 1.8*v);
    ctx.beginPath(); ctx.moveTo(4.7*u, 3.5*v); ctx.lineTo(5.3*u, 3.5*v); ctx.stroke();
    ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
    ctx.fillRect(2.5*u, 2.8*v, 2.2*u, 1.8*v);
    ctx.fillRect(5.3*u, 2.8*v, 2.2*u, 1.8*v);

    // Smile
    ctx.strokeStyle = '#c0835a';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(5*u, 5.2*v, 1.2*u, 0.2, Math.PI - 0.2); ctx.stroke();

    // Suit jacket with lapels
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(1*u, 6*v, 8*u, 5.5*v);
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(1*u, 6*v, 2.5*u, 5*v);
    ctx.fillRect(6.5*u, 6*v, 2.5*u, 5*v);

    // White shirt collar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(4*u, 6*v); ctx.lineTo(6*u, 6*v); ctx.lineTo(5*u, 8*v); ctx.fill();
    ctx.fillRect(4.2*u, 7*v, 1.6*u, 2*v);

    // Rich blue tie
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(4.7*u, 6*v, 0.6*u, 4.5*v);
    ctx.beginPath(); ctx.moveTo(4.7*u, 10.5*v); ctx.lineTo(5.3*u, 10.5*v); ctx.lineTo(5*u, 11*v); ctx.fill();

    // Hands
    ctx.fillStyle = '#ffcca6';
    ctx.fillRect(0, 8.5*v, 1.8*u, 1.8*v);
    ctx.fillRect(8.2*u, 8.5*v, 1.8*u, 1.8*v);

    // Legs
    ctx.fillStyle = '#172554';
    ctx.fillRect((2.2 - stride)*u, 11.5*v, 2.5*u, 3*v);
    ctx.fillRect((5.3 + stride)*u, 11.5*v, 2.5*u, 3*v);

    // Polished Shoes
    ctx.fillStyle = '#020617';
    ctx.fillRect((1.8 - stride)*u, 14*v, 3.2*u, 2*v);
    ctx.fillRect((5 + stride)*u, 14*v, 3.2*u, 2*v);
  }

  // ── ROBOT ─────────────────────────────────────────
  private drawRobot(ctx: CanvasRenderingContext2D, frames: number) {
    const u = this.width / 10;
    const v = this.height / 16;
  
    // Head — metallic with panel lines
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(2*u, 0, 6*u, 5*v);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(2.2*u, 0.2*v, 5.6*u, 1*v);
  
    // Eye screen
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(3*u, 1.5*v, 4*u, 2*v);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.fillRect(3.5*u, 2*v, 3*u, 1*v);
    ctx.shadowBlur = 0;
  
    // Antenna with signal pulse
    ctx.fillStyle = '#64748b';
    ctx.fillRect(4.8*u, -2.5*v, 0.4*u, 2.5*v);
    const pulse = Math.sin(frames * 0.2) * 2;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.arc(5*u, -2.5*v, 1.5 + pulse, 0, Math.PI * 2); ctx.fill();
  
    // Body — armored suit
    ctx.fillStyle = '#334155';
    ctx.fillRect(1.5*u, 5.5*v, 7*u, 5*v);
    // Glowing circuit lines
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(2.5*u, 6*v); ctx.lineTo(2.5*u, 9*v); ctx.lineTo(4*u, 9*v); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7.5*u, 6*v); ctx.lineTo(7.5*u, 9*v); ctx.lineTo(6*u, 9*v); ctx.stroke();
  
    // IEEE badge
    ctx.fillStyle = '#eab308';
    ctx.fillRect(4*u, 6.5*v, 2*u, 1.5*v);
    ctx.fillStyle = '#000';
    ctx.font = `bold ${u*1}px monospace`; ctx.fillText('CS', 4.1*u, 7.7*v);
  
    // Arms
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0.2*u, 6*v, 1.5*u, 3*v);
    ctx.fillRect(8.3*u, 6*v, 1.5*u, 3*v);
  
    // Hands — glow
    ctx.fillStyle = (GAME_CONFIG as any).gravityEnabled ? '#64748b' : '#c084fc';
    if (!(GAME_CONFIG as any).gravityEnabled) {
      ctx.shadowBlur = 12; ctx.shadowColor = '#c084fc';
    }
    ctx.beginPath(); ctx.arc(1*u, 9*v, 1.2*u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(9*u, 9*v, 1.2*u, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  
    const stride = this.isGrounded ? Math.sin(frames * 0.25) * 1.5 : 1.5;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect((2.2 - stride)*u, 11*v, 2.5*u, 3.5*v);
    ctx.fillRect((5.3 + stride)*u, 11*v, 2.5*u, 3.5*v);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect((1.8 - stride)*u, 14*v, 3.2*u, 2*v);
    ctx.fillRect((5 + stride)*u, 14*v, 3.2*u, 2*v);
  }

  // ── ADA ───────────────────────────────────────────
  private drawAda(ctx: CanvasRenderingContext2D, frames: number) {
    const u = this.width / 10;
    const v = this.height / 16;
    const stride = this.isGrounded ? Math.sin(frames * 0.25) * 0.8 : 0.8;

    // Hair updo with details
    ctx.fillStyle = '#1a0d0a';
    ctx.fillRect(2*u, 0, 6*u, 2.5*v);
    ctx.beginPath(); ctx.arc(5*u, 1.5*v, 3.5*u, Math.PI, 0); ctx.fill();
    // Tiny ribbon
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(4.5*u, 0, 1*u, 1*v);

    // Face
    ctx.fillStyle = '#f0c8a0';
    ctx.fillRect(2.5*u, 2.5*v, 5*u, 4.5*v);

    // Eyes with lashes
    ctx.fillStyle = '#1a0d0a';
    ctx.fillRect(3.5*u, 4*v, 1*u, 0.8*v);
    ctx.fillRect(6*u, 4*v, 1*u, 0.8*v);

    // Victorian dress — top with lace
    ctx.fillStyle = '#581c87';
    ctx.fillRect(2*u, 7*v, 6*u, 4*v);
    ctx.fillStyle = '#f5f5f5'; // white lace collar
    ctx.fillRect(3.5*u, 7*v, 3*u, 0.5*v);

    // Dress — wide layered skirt
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.moveTo(0*u, 11*v); ctx.lineTo(10*u, 11*v); 
    ctx.lineTo(11*u, 16*v); ctx.lineTo(-1*u, 16*v); ctx.fill();
    ctx.fillStyle = '#6d28d9'; // skirt shade
    ctx.fillRect(1*u, 11*v, 1*u, 5*v); ctx.fillRect(8*u, 11*v, 1*u, 5*v);

    // Scroll with text
    ctx.fillStyle = '#feefc3';
    ctx.fillRect(8.5*u, 7.5*v, 2.2*u, 4*v);
    ctx.strokeStyle = '#92400e'; ctx.strokeRect(8.5*u, 7.5*v, 2.2*u, 4*v);
    ctx.fillStyle = '#333'; ctx.font = `bold ${u*0.8}px serif`; ctx.fillText('ALG', 8.6*u, 10.2*v);
  }

  // ── LINUS ─────────────────────────────────────────
  private drawLinus(ctx: CanvasRenderingContext2D, frames: number) {
    const u = this.width / 10;
    const v = this.height / 16;
    const stride = this.isGrounded ? Math.sin(frames * 0.25) * 1.5 : 1.5;

    // Messy hair with highlights
    ctx.fillStyle = '#111';
    ctx.fillRect(1*u, 0, 8*u, 2.5*v);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(1.5*u, 0.5*v, 2*u, 0.5*v);

    // Face
    ctx.fillStyle = '#ffcca6';
    ctx.fillRect(2*u, 2*v, 6*u, 4.5*v);

    // Glasses and Beard
    ctx.strokeStyle = '#333'; ctx.strokeRect(2.8*u, 3.2*v, 1.8*u, 1.2*v); ctx.strokeRect(5.4*u, 3.2*v, 1.8*u, 1.2*v);
    ctx.fillStyle = '#27272a';
    ctx.fillRect(2*u, 5.5*v, 6*u, 1.5*v);

    // Hoodie with drawstrings
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1*u, 6.5*v, 8*u, 6*v);
    ctx.fillStyle = '#334155'; // hood shadow
    ctx.fillRect(1*u, 6.5*v, 8*u, 1.2*v);
    ctx.fillStyle = '#f1f5f9'; // strings
    ctx.fillRect(4.2*u, 7.5*v, 0.2*u, 2*v);
    ctx.fillRect(5.6*u, 7.5*v, 0.2*u, 2*v);

    // Linux text glowing
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 4; ctx.shadowColor = '#fbbf24';
    ctx.font = `bold ${u*1.2}px font-mono`;
    ctx.fillText('LINUX', 2.3*u, 11*v);
    ctx.shadowBlur = 0;

    // Hands
    ctx.fillStyle = '#ffcca6';
    ctx.fillRect(0, 9*v, 1.8*u, 1.8*v);
    ctx.fillRect(8.2*u, 9*v, 1.8*u, 1.8*v);

    // Jeans
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect((2.2 - stride)*u, 12*v, 2.5*u, 3*v);
    ctx.fillRect((5.3 + stride)*u, 12*v, 2.5*u, 3*v);

    // Premium Sneakers
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect((1.8 - stride)*u, 14.5*v, 3.2*u, 2*v);
    ctx.fillRect((5 + stride)*u, 14.5*v, 3.2*u, 2*v);
    ctx.fillStyle = '#ef4444'; // sneaker accent
    ctx.fillRect((1.8 - stride)*u, 15.5*v, 3.2*u, 0.5*v);
    ctx.fillRect((5 + stride)*u, 15.5*v, 3.2*u, 0.5*v);
  }
}

