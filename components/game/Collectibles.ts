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
