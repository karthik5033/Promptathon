import { GAME_CONFIG, ERAS, EraConfig } from "@/lib/gameConfig";

export class EraManager {
  currentEraIndex: number = 0;
  score: number = 0;
  eraChanged: boolean = false;
  bannerTimer: number = 0;
  bannerMaxTime: number = 150;
  transitionAlpha: number = 0; // Full-screen flash on era change
  historicalFact: string = '';

  private facts: string[][] = [
    ["ENIAC: the first general-purpose computer", "Vacuum tubes: 18,000 in ENIAC alone", "Grace Hopper coined the term 'debugging'"],
    ["The transistor replaced the vacuum tube", "IBM System/360: computing for everyone", "ARPANET: the birth of networking"],
    ["Apple II brought computers to homes", "The floppy disk era of data sharing", "Windows and GUI changed everything"],
    ["The dot-com boom connected the world", "Google: organizing the world's info", "WiFi freed us from cables"],
    ["AlphaGo defeats world champion in 2016", "GPT and the age of language models", "AI: reshaping every industry"],
  ];

  get currentEra(): EraConfig {
    return ERAS[this.currentEraIndex];
  }

  update(score: number) {
    this.score = score;
    this.eraChanged = false;

    if (this.currentEraIndex < GAME_CONFIG.scoreEras.length - 1) {
      if (score >= GAME_CONFIG.scoreEras[this.currentEraIndex + 1]) {
        this.currentEraIndex++;
        this.eraChanged = true;
        this.bannerTimer = this.bannerMaxTime;
        this.transitionAlpha = 1;
        // Pick a random historical fact
        const eraFacts = this.facts[this.currentEraIndex];
        this.historicalFact = eraFacts[Math.floor(Math.random() * eraFacts.length)];
      }
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer--;
    }
    if (this.transitionAlpha > 0) {
      this.transitionAlpha -= 0.02;
    }
  }

  drawBanner(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
    // Full-screen white flash on era transition
    if (this.transitionAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.transitionAlpha * 0.3})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    }

    if (this.bannerTimer > 0) {
      ctx.save();
      const era = this.currentEra;
      const progress = this.bannerTimer / this.bannerMaxTime;

      // Slide in/out
      let yOffset = 0;
      if (progress > 0.85) {
        yOffset = (1 - (progress - 0.85) / 0.15) * 1;
      } else if (progress < 0.15) {
        yOffset = (1 - progress / 0.15) * 1;
      } else {
        yOffset = 1;
      }

      const bannerH = 110;
      const centerY = canvasHeight / 2 - bannerH / 2;

      // Banner background with era-themed gradient
      ctx.globalAlpha = yOffset;
      const grad = ctx.createLinearGradient(0, centerY, canvasWidth, centerY + bannerH);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.92)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, centerY, canvasWidth, bannerH);

      // Era accent line at top
      ctx.fillStyle = era.groundAccent;
      ctx.fillRect(canvasWidth * 0.2, centerY, canvasWidth * 0.6, 3);

      // Era number + name
      ctx.fillStyle = era.textColor;
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`ERA ${era.id} — ${era.name}`, canvasWidth / 2, centerY + 32);

      // Years
      ctx.fillStyle = '#aaa';
      ctx.font = "16px 'Courier New', monospace";
      ctx.fillText(era.years, canvasWidth / 2, centerY + 58);

      // Historical fact
      if (this.historicalFact) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = "italic 13px sans-serif";
        ctx.fillText(`"${this.historicalFact}"`, canvasWidth / 2, centerY + 85);
      }

      // Era accent line at bottom
      ctx.fillStyle = era.groundAccent;
      ctx.fillRect(canvasWidth * 0.2, centerY + bannerH - 3, canvasWidth * 0.6, 3);

      ctx.restore();
    }
  }
}
