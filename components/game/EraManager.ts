import { GAME_CONFIG, ERAS } from "@/lib/gameConfig";

export class EraManager {
  currentEraIndex: number = 0;
  score: number = 0;
  eraChanged: boolean = false;
  bannerTimer: number = 0;

  get currentEra() {
    return ERAS[this.currentEraIndex];
  }

  update(score: number) {
    this.score = score;
    this.eraChanged = false;

    if (this.currentEraIndex < GAME_CONFIG.scoreEras.length - 1) {
      if (score >= GAME_CONFIG.scoreEras[this.currentEraIndex + 1]) {
        this.currentEraIndex++;
        this.eraChanged = true;
        this.bannerTimer = 120; // 2 seconds at 60fps
      }
    }
    
    if (this.bannerTimer > 0) {
      this.bannerTimer--;
    }
  }

  drawBanner(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    if (this.bannerTimer > 0) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, canvasHeight / 2 - 50, canvasWidth, 100);
      
      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px 'Courier New', Courier, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const era = this.currentEra;
      ctx.fillText(`Era ${era.id} — ${era.name} (${era.years})`, canvasWidth / 2, canvasHeight / 2);
      ctx.restore();
    }
  }
}
