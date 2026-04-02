import { GAME_CONFIG } from "@/lib/gameConfig";
import { Particle } from "./ParticleSystem";

export class Player {
  width: number = 36;
  height: number = 40;
  x: number;
  y: number;
  vy: number = 0;
  isGrounded: boolean = true;
  canvas: HTMLCanvasElement;

  // Double jump
  canDoubleJump: boolean = false;
  hasDoubleJumped: boolean = false;

  // Shield power-up
  hasShield: boolean = false;
  shieldTimer: number = 0;
  shieldMaxTime: number = 300; // 5 seconds at 60fps

  // Invincibility flash after hit
  isInvincible: boolean = false;
  invincibleTimer: number = 0;

  // Visual flair
  trailTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.x = Math.min(120, canvas.width * 0.12);
    this.y = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio) - this.height;
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
      return false; // Absorbed by shield
    }
    return true; // Real hit
  }

  update(keys: { [key: string]: boolean }, frames: number, particles: Particle[]) {
    // Ducking logic
    const isDucking = keys.ArrowDown && this.isGrounded;
    const targetHeight = isDucking ? 20 : 40;
    const heightDiff = this.height - targetHeight;
    if (heightDiff !== 0) {
      this.height = targetHeight;
      this.y += heightDiff; // Move y down when ducking, up when standing
    }

    // Gravity
    this.vy += GAME_CONFIG.gravity;
    this.y += this.vy;

    const groundY = this.canvas.height - (this.canvas.height * GAME_CONFIG.groundHeightRatio);

    // Ground collision
    if (this.y + this.height >= groundY) {
      if (!this.isGrounded) {
        // Landing particles
        for (let i = 0; i < 10; i++) {
          particles.push(new Particle(
            this.x + this.width / 2 + (Math.random() * 24 - 12),
            groundY,
            (Math.random() - 0.5) * 4,
            -Math.random() * 3 - 1,
            Math.random() * 4 + 2,
            'rgba(236, 240, 241, 0.7)'
          ));
        }
      }
      this.y = groundY - this.height;
      this.vy = 0;
      this.isGrounded = true;
      this.hasDoubleJumped = false;
      this.canDoubleJump = true;
    } else {
      this.isGrounded = false;
    }

    // Jump
    if ((keys.Space || keys.ArrowUp) && !isDucking) {
      if (this.isGrounded) {
        this.vy = GAME_CONFIG.jumpForce;
        this.isGrounded = false;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;

        // Jump particles
        for (let i = 0; i < 8; i++) {
          particles.push(new Particle(
            this.x + this.width / 2 + (Math.random() * 16 - 8),
            groundY,
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

        // Double jump sparkle particles
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
    // Reset jump consumed flag when key is released
    if (!keys.Space && !keys.ArrowUp) {
      keys._jumpConsumed = false;
    }

    // Running dust particles
    if (this.isGrounded && frames % 6 === 0) {
      particles.push(new Particle(
        this.x + 8,
        groundY,
        -1.5 - Math.random() * 2,
        -Math.random() - 0.3,
        Math.random() * 2.5 + 1.5,
        'rgba(236, 240, 241, 0.4)'
      ));
    }

    // Left/Right movement
    if (keys.ArrowLeft) {
      this.x -= GAME_CONFIG.playerSpeed;
    }
    if (keys.ArrowRight) {
      this.x += GAME_CONFIG.playerSpeed;
    }

    // Bounds
    if (this.x < 0) this.x = 0;
    const playerLimitX = this.canvas.width / 2;
    if (this.x + this.width > playerLimitX) {
      this.x = playerLimitX - this.width;
    }

    // Shield decay
    if (this.hasShield) {
      this.shieldTimer--;
      if (this.shieldTimer <= 0) this.hasShield = false;
    }

    // Invincibility decay
    if (this.isInvincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }

    // Trail particles when airborne
    if (!this.isGrounded && frames % 3 === 0) {
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

  draw(ctx: CanvasRenderingContext2D, frames: number) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Invincibility flash
    if (this.isInvincible && frames % 4 < 2) {
      ctx.globalAlpha = 0.4;
    }

    const bounceY = this.isGrounded ? Math.abs(Math.sin(frames * 0.15)) * 3 : 0;
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
    ctx.fillRect(3 * u, 0 * v, 5 * u, 2 * v);
    ctx.fillRect(2 * u, 2 * v, 9 * u, 1 * v);

    // Head
    ctx.fillStyle = BR;
    ctx.fillRect(2 * u, 3 * v, 3 * u, 3 * v);
    ctx.fillRect(1 * u, 4 * v, 1 * u, 3 * v);

    ctx.fillStyle = P;
    ctx.fillRect(5 * u, 3 * v, 4 * u, 4 * v);
    ctx.fillRect(9 * u, 4 * v, 2 * u, 2 * v);
    ctx.fillRect(3 * u, 6 * v, 6 * u, 1 * v);

    ctx.fillStyle = BR;
    ctx.fillRect(7 * u, 3 * v, 1 * u, 2 * v);
    ctx.fillRect(7 * u, 5 * v, 4 * u, 1 * v);

    // Body
    ctx.fillStyle = R;
    ctx.fillRect(2 * u, 7 * v, 3 * u, 4 * v);
    ctx.fillRect(7 * u, 7 * v, 3 * u, 4 * v);
    ctx.fillRect(4 * u, 7 * v, 4 * u, 2 * v);

    ctx.fillStyle = BL;
    ctx.fillRect(4 * u, 9 * v, 4 * u, 4 * v);
    ctx.fillRect(3 * u, 8 * v, 1 * u, 3 * v);
    ctx.fillRect(8 * u, 8 * v, 1 * u, 3 * v);

    ctx.fillStyle = Y;
    ctx.fillRect(3 * u, 10 * v, 1 * u, 1 * v);
    ctx.fillRect(8 * u, 10 * v, 1 * u, 1 * v);

    // Hands
    ctx.fillStyle = P;
    ctx.fillRect(1 * u, 9 * v, 2 * u, 2 * v);
    ctx.fillRect(9 * u, 9 * v, 2 * u, 2 * v);

    // Legs/Shoes — animate walk cycle
    ctx.fillStyle = BR;
    const stride = this.isGrounded ? Math.sin(frames * 0.15) * 2 : 2;
    ctx.fillRect((3 - stride) * u, 13 * v, 3 * u, 2 * v);
    ctx.fillRect((6 + stride) * u, 13 * v, 3 * u, 2 * v);

    // Shield visual
    if (this.hasShield) {
      ctx.save();
      const shimmer = 0.3 + Math.sin(frames * 0.1) * 0.15;
      // Pulsing shield opacity
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

    // Double jump indicator — small wing-like sparkles
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
