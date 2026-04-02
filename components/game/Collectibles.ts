import { GAME_CONFIG, ERAS } from "@/lib/gameConfig";

/** Collectible "data bit" item that gives score + builds combo */
export class DataBit {
  x: number;
  y: number;
  width: number = 18;
  height: number = 18;
  markedForDeletion: boolean = false;
  collected: boolean = false;
  eraId: number;
  floatOffset: number = 0;
  spawnFrame: number;

  constructor(canvasWidth: number, canvasHeight: number, eraId: number, frame: number) {
    this.x = canvasWidth + Math.random() * 150;
    const groundY = canvasHeight - (canvasHeight * GAME_CONFIG.groundHeightRatio);
    // Spawn at varying heights — some on ground, some in air
    const heightRange = groundY - 60;
    this.y = 60 + Math.random() * (heightRange - 60);
    this.eraId = eraId;
    this.spawnFrame = frame;
  }

  update(currentSpeed: number, frames: number) {
    this.x -= currentSpeed;
    this.floatOffset = Math.sin(frames * 0.08 + this.spawnFrame) * 6;
    if (this.x + this.width < -20) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D, frames: number) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x, this.y + this.floatOffset);

    const era = ERAS[this.eraId - 1];
    const pulse = 0.7 + Math.sin(frames * 0.1 + this.spawnFrame) * 0.3;

    // Glow
    ctx.shadowColor = era.collectibleColor;
    ctx.shadowBlur = 8 * pulse;

    // Diamond shape
    ctx.fillStyle = era.collectibleColor;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width, this.height / 2);
    ctx.lineTo(this.width / 2, this.height);
    ctx.lineTo(0, this.height / 2);
    ctx.closePath();
    ctx.fill();

    // Inner shine
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 3);
    ctx.lineTo(this.width - 4, this.height / 2);
    ctx.lineTo(this.width / 2, this.height - 3);
    ctx.lineTo(4, this.height / 2);
    ctx.closePath();
    ctx.fill();

    // "01" binary text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('01', this.width / 2, this.height / 2);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x - 2,
      y: this.y + this.floatOffset - 2,
      width: this.width + 4,
      height: this.height + 4,
    };
  }
}

/** Shield power-up — protects from one hit */
export class ShieldPowerUp {
  x: number;
  y: number;
  width: number = 28;
  height: number = 28;
  markedForDeletion: boolean = false;
  collected: boolean = false;
  spawnFrame: number;
  floatOffset: number = 0;

  constructor(canvasWidth: number, canvasHeight: number, frame: number) {
    this.x = canvasWidth + 100;
    const groundY = canvasHeight - (canvasHeight * GAME_CONFIG.groundHeightRatio);
    this.y = groundY - 80 - Math.random() * 60;
    this.spawnFrame = frame;
  }

  update(currentSpeed: number, frames: number) {
    this.x -= currentSpeed;
    this.floatOffset = Math.sin(frames * 0.06 + this.spawnFrame) * 8;
    if (this.x + this.width < -20) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D, frames: number) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x, this.y + this.floatOffset);

    const pulse = 0.7 + Math.sin(frames * 0.08) * 0.3;

    // Glow
    ctx.shadowColor = '#3498db';
    ctx.shadowBlur = 14 * pulse;

    // Shield shape
    ctx.fillStyle = `rgba(52, 152, 219, ${0.6 + pulse * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width, this.height * 0.3);
    ctx.lineTo(this.width * 0.85, this.height * 0.8);
    ctx.lineTo(this.width / 2, this.height);
    ctx.lineTo(this.width * 0.15, this.height * 0.8);
    ctx.lineTo(0, this.height * 0.3);
    ctx.closePath();
    ctx.fill();

    // Inner shield
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 4);
    ctx.lineTo(this.width - 5, this.height * 0.33);
    ctx.lineTo(this.width * 0.8, this.height * 0.75);
    ctx.lineTo(this.width / 2, this.height - 5);
    ctx.lineTo(this.width * 0.2, this.height * 0.75);
    ctx.lineTo(5, this.height * 0.33);
    ctx.closePath();
    ctx.fill();

    // S icon
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', this.width / 2, this.height / 2);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x - 3,
      y: this.y + this.floatOffset - 3,
      width: this.width + 6,
      height: this.height + 6,
    };
  }
}

/** 2X Score Multiplier — golden spinning star that spawns at random sky heights */
export class ScoreMultiplierPerk {
  x: number;
  y: number;
  width: number = 32;
  height: number = 32;
  markedForDeletion: boolean = false;
  collected: boolean = false;
  spawnFrame: number;
  floatOffset: number = 0;
  rotation: number = 0;

  constructor(canvasWidth: number, canvasHeight: number, frame: number) {
    this.x = canvasWidth + 80;
    this.y = 40 + Math.random() * (canvasHeight * 0.55);
    this.spawnFrame = frame;
  }

  update(currentSpeed: number, frames: number) {
    this.x -= currentSpeed;
    this.floatOffset = Math.sin(frames * 0.05 + this.spawnFrame) * 10;
    this.rotation += 0.04;
    if (this.x + this.width < -20) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D, frames: number) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.floatOffset + this.height / 2);
    ctx.rotate(this.rotation);

    const pulse = 0.8 + Math.sin(frames * 0.12) * 0.2;

    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18 * pulse;

    // 5-point star
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const outerR = 14;
      const innerR = 6;
      if (i === 0) ctx.moveTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
      else ctx.lineTo(Math.cos(outerAngle) * outerR, Math.sin(outerAngle) * outerR);
      ctx.lineTo(Math.cos(innerAngle) * innerR, Math.sin(innerAngle) * innerR);
    }
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // "2X" text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2X', 0, 0);

    // Orbiting ring
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x - 4,
      y: this.y + this.floatOffset - 4,
      width: this.width + 8,
      height: this.height + 8,
    };
  }
}

/** Flying Shield — hexagonal sky shield with orbiting particles */
export class FlyingShield {
  x: number;
  y: number;
  width: number = 30;
  height: number = 30;
  markedForDeletion: boolean = false;
  collected: boolean = false;
  spawnFrame: number;
  floatOffset: number = 0;

  constructor(canvasWidth: number, canvasHeight: number, frame: number) {
    this.x = canvasWidth + 120;
    this.y = 50 + Math.random() * (canvasHeight * 0.50);
    this.spawnFrame = frame;
  }

  update(currentSpeed: number, frames: number) {
    this.x -= currentSpeed;
    this.floatOffset = Math.cos(frames * 0.04 + this.spawnFrame) * 12;
    if (this.x + this.width < -20) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D, frames: number) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.floatOffset + this.height / 2);

    const pulse = 0.7 + Math.sin(frames * 0.1) * 0.3;

    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 16 * pulse;

    // Hexagon shape
    ctx.fillStyle = `rgba(0, 229, 255, ${0.5 + pulse * 0.3})`;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i - Math.PI / 6;
      const r = 14;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();

    // Inner hexagon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i - Math.PI / 6;
      const r = 8;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();

    // Shield icon
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, 0);

    // Orbiting dots
    for (let i = 0; i < 3; i++) {
      const orbitAngle = frames * 0.06 + (Math.PI * 2 / 3) * i;
      const ox = Math.cos(orbitAngle) * 19;
      const oy = Math.sin(orbitAngle) * 19;
      ctx.fillStyle = `rgba(0, 229, 255, ${0.6 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(ox, oy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x - 4,
      y: this.y + this.floatOffset - 4,
      width: this.width + 8,
      height: this.height + 8,
    };
  }
}

/** Mushroom — gives 'Super' state (size increase + invincibility) */
export class Mushroom {
  x: number;
  y: number;
  width: number = 32;
  height: number = 32;
  markedForDeletion: boolean = false;
  collected: boolean = false;
  vx: number = -1; // moves slightly relative to screen
  spawnFrame: number;

  constructor(x: number, y: number, frame: number) {
    this.x = x;
    this.y = y;
    this.spawnFrame = frame;
  }

  update(currentSpeed: number, frames: number) {
    this.x -= (currentSpeed + this.vx);
    if (this.x + this.width < -50) this.markedForDeletion = true;
  }

  draw(ctx: CanvasRenderingContext2D, frames: number) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Cap (Red with white dots)
    ctx.fillStyle = '#e52521';
    ctx.beginPath();
    ctx.arc(16, 12, 16, Math.PI, 0);
    ctx.fill();

    // White dots
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(10, 6, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(22, 6, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(16, 2, 2, 0, Math.PI*2); ctx.fill();

    // Stem
    ctx.fillStyle = '#fffabc';
    ctx.fillRect(8, 12, 16, 12);
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(11, 14, 2, 4);
    ctx.fillRect(19, 14, 2, 4);

    ctx.restore();
  }

  getHitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

/** Mystery Box — gives score + 50% chance to spawn a Mushroom */
export class MysteryBox {
  x: number;
  y: number;
  width: number = 36;
  height: number = 36;
  markedForDeletion: boolean = false;
  collected: boolean = false;
  spawnFrame: number;

  constructor(canvasWidth: number, canvasHeight: number, frame: number) {
    this.x = canvasWidth + 50;
    const groundY = canvasHeight - (canvasHeight * GAME_CONFIG.groundHeightRatio);
    this.y = groundY - 120 - Math.random() * 40;
    this.spawnFrame = frame;
  }

  update(currentSpeed: number, frames: number) {
    this.x -= currentSpeed;
    if (this.x + this.width < -50) this.markedForDeletion = true;
  }

  draw(ctx: CanvasRenderingContext2D, frames: number) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Box body (Golden Yellow)
    const color = (frames % 40 < 20) ? '#f9ca24' : '#f0932b';
    ctx.fillStyle = color;
    ctx.fillRect(2, 2, 32, 32);
    
    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 32, 32);

    // Question mark
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 18, 18);

    // Corner rivets
    ctx.fillStyle = '#333';
    ctx.fillRect(4, 4, 3, 3);
    ctx.fillRect(29, 4, 3, 3);
    ctx.fillRect(4, 29, 3, 3);
    ctx.fillRect(29, 29, 3, 3);

    ctx.restore();
  }

  getHitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}
