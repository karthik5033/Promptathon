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

    // ── MARIO ───────────────────────────────────────── (Refined Classic)
    private drawMario(ctx: CanvasRenderingContext2D, frames: number) {
        const u = this.width / 10;
        const v = this.height / 16;
        const stride = this.isGrounded ? Math.sin(frames * 0.25) * 1.5 : 1.5;

        // Hair/Back of Head
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(1*u, 2.5*v, 7*u, 2*v);

        // Hat (More structured)
        ctx.fillStyle = '#e52521';
        ctx.fillRect(2*u, 0, 6*u, 2*v);
        ctx.fillRect(u, 1.8*v, 8.5*u, 1.2*v);
        // Hat Logo (Simplified M)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4*u, 0.5*v, 2*u, 1*v);
        ctx.fillStyle = '#e52521'; ctx.fillRect(4.8*u, 0.7*v, 0.4*u, 0.8*v);

        // Face
        ctx.fillStyle = '#ffcca6';
        ctx.fillRect(2*u, 3*v, 6*u, 3.5*v);
        
        // Eyes (More expressive)
        ctx.fillStyle = '#000';
        ctx.fillRect(3.5*u, 3.8*v, 1*u, 1.2*v);
        ctx.fillRect(6.5*u, 3.8*v, 1*u, 1.2*v);

        // Nose
        ctx.fillStyle = '#f0a07a';
        ctx.fillRect(4.5*u, 5*v, 2*u, 1*v);

        // Mustache (Thicker)
        ctx.fillStyle = '#442b1a';
        ctx.fillRect(2*u, 5.5*v, 6.5*u, 1.5*v);
        ctx.fillRect(1.5*u, 6.2*v, 1.5*u, 0.8*v);

        // Overalls
        ctx.fillStyle = '#0043bb';
        ctx.fillRect(2*u, 7*v, 6*u, 4.5*v);
        // Straps
        ctx.fillRect(2.8*u, 6.5*v, 1.2*u, 1.5*v);
        ctx.fillRect(6*u, 6.5*v, 1.2*u, 1.5*v);
        // Buttons
        ctx.fillStyle = '#f6c90e';
        ctx.fillRect(3*u, 8.5*v, u*0.8, u*0.8);
        ctx.fillRect(6.2*u, 8.5*v, u*0.8, u*0.8);

        // Shirt
        ctx.fillStyle = '#e52521';
        ctx.fillRect(1*u, 7.5*v, 1.5*u, 2.5*v);
        ctx.fillRect(7.5*u, 7.5*v, 1.5*u, 2.5*v);

        // Hands (Gloves)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0.5*u, 9.5*v, 2*u, 1.8*v);
        ctx.fillRect(7.5*u, 9.5*v, 2*u, 1.8*v);

        // Legs/Feet
        ctx.fillStyle = '#0043bb';
        ctx.fillRect((2 - stride)*u, 11.5*v, 2.2*u, 2.5*v);
        ctx.fillRect((5.8 + stride)*u, 11.5*v, 2.2*u, 2.5*v);
        
        ctx.fillStyle = '#442b1a';
        ctx.fillRect((1.5 - stride)*u, 14*v, 3.5*u, 2*v);
        ctx.fillRect((5 + stride)*u, 14*v, 3.5*u, 2*v);
    }

    // ── BILL ────────────────────────────────────────── (90s Executive)
    private drawBill(ctx: CanvasRenderingContext2D, frames: number) {
        const u = this.width / 10;
        const v = this.height / 16;
        const stride = this.isGrounded ? Math.sin(frames * 0.25) * 1.5 : 1.5;

        // Hair (Refined 90s floppy look)
        ctx.fillStyle = '#442b1a';
        ctx.fillRect(1.5*u, 0, 7*u, 2*v);
        ctx.fillRect(1*u, 1*v, u, 2*v);
        ctx.fillRect(8*u, 1*v, u, 2*v);

        // Face
        ctx.fillStyle = '#ffcca6';
        ctx.fillRect(2*u, 1.5*v, 6*u, 4.5*v);

        // Glasses (More refined metallic frames)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(2.5*u, 2.5*v, 2*u, 1.5*v);
        ctx.strokeRect(5.5*u, 2.5*v, 2*u, 1.5*v);
        ctx.fillStyle = 'rgba(100,200,255,0.2)';
        ctx.fillRect(2.5*u, 2.5*v, 2*u, 1.5*v);
        ctx.fillRect(5.5*u, 2.5*v, 2*u, 1.5*v);
        // Golden glasses bridge
        ctx.beginPath(); ctx.strokeStyle = '#DAA520'; ctx.moveTo(4.5*u, 3*v); ctx.lineTo(5.5*u, 3*v); ctx.stroke();

        // Suit Jacket (Navy with shading)
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(1*u, 6*v, 8*u, 5.5*v);
        // Lapels
        ctx.fillStyle = '#2c5282';
        ctx.beginPath(); ctx.moveTo(4*u, 6*v); ctx.lineTo(3*u, 9*v); ctx.lineTo(4*u, 9*v); ctx.fill();
        ctx.beginPath(); ctx.moveTo(6*u, 6*v); ctx.lineTo(7*u, 9*v); ctx.lineTo(6*u, 9*v); ctx.fill();

        // White Shirt/Tie
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4.2*u, 6*v, 1.6*u, 4.5*v);
        ctx.fillStyle = '#2b6cb0'; // Tie
        ctx.fillRect(4.6*u, 6.5*v, 0.8*u, 4*v);

        // Sleeves/Hands
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(0.5*u, 6*v, 1*u, 3*v);
        ctx.fillRect(8.5*u, 6*v, 1*u, 3*v);
        ctx.fillStyle = '#ffcca6';
        ctx.fillRect(0.3*u, 8.5*v, 1.4*u, 1.5*v);
        ctx.fillRect(8.3*u, 8.5*v, 1.4*u, 1.5*v);

        // Legs/Shoes
        ctx.fillStyle = '#2c5282';
        ctx.fillRect((2.2 - stride)*u, 11*v, 2.2*u, 3*v);
        ctx.fillRect((5.6 + stride)*u, 11*v, 2.2*u, 3*v);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect((1.8 - stride)*u, 14*v, 3*u, 2*v);
        ctx.fillRect((5.2 + stride)*u, 14*v, 3*u, 2*v);
    }

    // ── ROBOT R-80 ──────────────────────────────────── (IEEE Scientist)
    private drawRobot(ctx: CanvasRenderingContext2D, frames: number) {
        const u = this.width / 10;
        const v = this.height / 16;
        const stride = this.isGrounded ? Math.sin(frames * 0.25) * 1.5 : 1.5;

        // Head (Metallic gradient)
        ctx.fillStyle = '#cbd5e0';
        ctx.fillRect(2.5*u, 0, 5*u, 4.5*v);
        // Head shading
        ctx.fillStyle = '#718096';
        ctx.fillRect(2.5*u, 0, 0.5*u, 4.5*v);
        ctx.fillRect(7*u, 0, 0.5*u, 4.5*v);

        // Screen Face
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(3.2*u, 1*v, 3.6*u, 2.5*v);
        // Digital Eyes (Scanning effect)
        ctx.fillStyle = '#00ffff';
        const scan = Math.sin(frames * 0.1) * 0.5 + 0.5;
        ctx.fillRect(3.8*u, 1.8*v, 0.8*u, 0.8*v);
        ctx.fillRect(5.4*u, 1.8*v, 0.8*u, 0.8*v);
        ctx.globalAlpha = scan; ctx.fillRect(3.5*u, 1.4*v, 3*u, 0.2*v); ctx.globalAlpha = 1.0;

        // Antennas
        ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(3*u, 0); ctx.lineTo(2*u, -1.5*v); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7*u, 0); ctx.lineTo(8*u, -1.5*v); ctx.stroke();
        ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(2*u, -1.5*v, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00ff00'; ctx.beginPath(); ctx.arc(8*u, -1.5*v, 2, 0, Math.PI*2); ctx.fill();

        // Body (Mechanical)
        ctx.fillStyle = '#a0aec0';
        ctx.fillRect(2*u, 5*v, 6*u, 5.5*v);
        // Chest Plate (IEEE Logo Style)
        ctx.fillStyle = '#2c5282';
        ctx.fillRect(3.5*u, 6.2*v, 3*u, 3*v);
        ctx.fillStyle = '#ffffff'; ctx.font = `bold ${u*0.8}px sans-serif`; ctx.fillText('IEEE', 3.8*u, 8.2*v);

        // Arms (Piston Style)
        ctx.fillStyle = '#718096';
        ctx.fillRect(1*u, 5.5*v, 1*u, 3.5*v);
        ctx.fillRect(8*u, 5.5*v, 1*u, 3.5*v);
        
        // Hands — glowing when flying
        ctx.fillStyle = (GAME_CONFIG as any).gravityEnabled ? '#4a5568' : '#a855f7';
        if (!(GAME_CONFIG as any).gravityEnabled) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#a855f7';
        }
        ctx.beginPath(); ctx.arc(1*u, 8*v, 1.2*u, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(9*u, 8*v, 1.2*u, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Legs/Tracks
        ctx.fillStyle = '#2d3748';
        ctx.fillRect((2.2 - stride)*u, 11*v, 2.5*u, 3.5*v);
        ctx.fillRect((5.3 + stride)*u, 11*v, 2.5*u, 3.5*v);
        // Wheels
        ctx.fillStyle = '#1a202c';
        ctx.beginPath(); ctx.arc((3.4 - stride)*u, 14.5*v, 1.2*u, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc((6.5 + stride)*u, 14.5*v, 1.2*u, 0, Math.PI*2); ctx.fill();

        // Jet pack glow when gravity OFF
        if (!(GAME_CONFIG as any).gravityEnabled) {
          ctx.fillStyle = '#7c3aed';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#7c3aed';
          ctx.fillRect(3*u, 9*v, 1.5*u, 2*v);
          ctx.fillRect(5.5*u, 9*v, 1.5*u, 2*v);
          ctx.shadowBlur = 0;
        }
    }

    // ── ADA ─────────────────────────────────────────── (Victorian Pioneer)
    private drawAda(ctx: CanvasRenderingContext2D, frames: number) {
        const u = this.width / 10;
        const v = this.height / 16;
        const stride = this.isGrounded ? Math.sin(frames * 0.25) * 0.8 : 0.8;

        // Hair (Intricate Victorian Updo)
        ctx.fillStyle = '#2c1810';
        ctx.beginPath(); ctx.ellipse(5*u, 2*v, 3.5*u, 2.5*v, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(2.5*u, 3*v, 1.2*u, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(7.5*u, 3*v, 1.2*u, 0, Math.PI*2); ctx.fill();

        // Face
        ctx.fillStyle = '#f0c8a0';
        ctx.fillRect(3*u, 2*v, 4*u, 4.5*v);

        // Eyes
        ctx.fillStyle = '#1a0b05';
        ctx.fillRect(3.8*u, 3.5*v, 0.8*u, 0.8*v);
        ctx.fillRect(5.4*u, 3.5*v, 0.8*u, 0.8*v);

        // Dress (Regal Purple with Frills)
        ctx.fillStyle = '#44337a';
        ctx.fillRect(2.5*u, 6.5*v, 5*u, 4*v);
        // Frill detail
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3*u, 6.5*v, 4*u, 0.6*v);

        // Bell Skirt
        ctx.fillStyle = '#553c9a';
        ctx.beginPath(); ctx.moveTo(2.5*u, 10.5*v); ctx.lineTo(7.5*u, 10.5*v); ctx.lineTo(9.5*u, 16*v); ctx.lineTo(0.5*u, 16*v); ctx.fill();
        // Skirt Pattern
        ctx.strokeStyle = '#44337a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(3*u, 11*v); ctx.lineTo(2*u, 15*v); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(7*u, 11*v); ctx.lineTo(8*u, 15*v); ctx.stroke();

        // Arms/Hands (Holding Parchment)
        ctx.fillStyle = '#f0c8a0';
        ctx.fillRect(1.5*u, 7*v, 1.2*u, 2.5*v);
        ctx.fillRect(7.3*u, 7*v, 1.2*u, 2.5*v);

        // The Analytical Engine Note (Parchment)
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(7.5*u, 8*v, 2.5*u, 3.5*v);
        ctx.strokeStyle = '#d97706'; ctx.strokeRect(7.5*u, 8*v, 2.5*u, 3.5*v);
        ctx.fillStyle = '#333'; ctx.font = `${u*0.8}px serif`; ctx.fillText('Σ', 8*u, 10*v);
    }

    // ── LINUS ───────────────────────────────────────── (Hacker Icon)
    private drawLinus(ctx: CanvasRenderingContext2D, frames: number) {
        const u = this.width / 10;
        const v = this.height / 16;
        const stride = this.isGrounded ? Math.sin(frames * 0.25) * 1.5 : 1.5;

        // Messy Hacker Hair
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(1.5*u, 0, 7.5*u, 2.5*v);
        ctx.fillRect(1*u, 1*v, 1.2*u, 3*v); // Strands
        ctx.fillRect(8*u, 1*v, 1.2*u, 3*v);

        // Face
        ctx.fillStyle = '#ffcca6';
        ctx.fillRect(2*u, 2.5*v, 6*u, 3.8*v);
        
        // Determination Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(3.2*u, 3.8*v, 1.2*u, 1*v);
        ctx.fillRect(6.2*u, 3.8*v, 1.2*u, 1*v);

        // Dark Hoodie
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(1*u, 6.5*v, 8*u, 5*v);
        // Hoodie Strings
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4.8*u, 6.5*v, 0.2*u, 2.5*v);
        ctx.fillRect(5.4*u, 6.5*v, 0.2*u, 2.5*v);

        // Tux Penguin Patch (Abstract)
        ctx.fillStyle = '#ffffff'; ctx.fillRect(4*u, 8*v, 2.5*u, 2.3*v);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(4.5*u, 8.2*v, 1.5*u, 1*v);
        ctx.fillStyle = '#f6c90e'; ctx.fillRect(5*u, 9.5*v, 0.6*u, 0.5*v);

        // Arms/Hands
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(0.2*u, 7*v, 1.2*u, 3*v);
        ctx.fillRect(8.6*u, 7*v, 1.2*u, 3*v);
        ctx.fillStyle = '#ffcca6';
        ctx.fillRect(0*u, 9.5*v, 1.4*u, 1.4*v);
        ctx.fillRect(8.6*u, 9.5*v, 1.4*u, 1.4*v);

        // Denim Jeans (Refined shading)
        ctx.fillStyle = '#2b4490';
        ctx.fillRect((2.2 - stride)*u, 11.5*v, 2.3*u, 3*v);
        ctx.fillRect((5.5 + stride)*u, 11.5*v, 2.3*u, 3*v);
        
        // Sneakers (Modern red/white)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((1.8 - stride)*u, 14.5*v, 3.2*u, 1.5*v);
        ctx.fillRect((5 + stride)*u, 14.5*v, 3.2*u, 1.5*v);
        ctx.fillStyle = '#e52521';
        ctx.fillRect((1.8 - stride)*u, 15.2*v, 3.2*u, 0.8*v);
        ctx.fillRect((5 + stride)*u, 15.2*v, 3.2*u, 0.8*v);
    }
}

