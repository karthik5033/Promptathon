import { GAME_CONFIG, ERAS } from "@/lib/gameConfig";

export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  eraId: number;
  canvas: HTMLCanvasElement;
  markedForDeletion: boolean = false;
  isFloating: boolean;

  constructor(canvas: HTMLCanvasElement, eraId: number, currentSpeed: number) {
    this.canvas = canvas;
    this.eraId = eraId;
    this.x = canvas.width;
    
    // 30% chance for floating obstacle
    this.isFloating = Math.random() < 0.3;
    
    const groundY = canvas.height - (canvas.height * GAME_CONFIG.groundHeightRatio);
    this.width = Math.random() * 20 + 30; // 30-50 width
    this.height = Math.random() * 30 + 40; // 40-70 height
    
    if (this.isFloating) {
      // High enough to run under:
      // Player height is 40. We need clearance of at least 45.
      this.y = groundY - 45 - this.height;
    } else {
      this.y = groundY - this.height;
    }
    
    // Choose specific obstacle type based on era
    const rand = Math.random();
    if (eraId === 1) {
      this.type = rand > 0.5 ? 'tube' : 'punchcard';
    } else if (eraId === 2) {
      this.type = rand > 0.5 ? 'reeltoreel' : 'mainframe';
    } else if (eraId === 3) {
      if (rand < 0.33) this.type = 'floppy';
      else if (rand < 0.66) this.type = 'crt';
      else this.type = 'keyboard';
    } else if (eraId === 4) {
      if (rand < 0.33) this.type = 'browser';
      else if (rand < 0.66) this.type = 'wifi';
      else this.type = 'server';
    } else {
      if (rand < 0.33) this.type = 'neural';
      else if (rand < 0.66) this.type = 'tensor';
      else this.type = 'glitch';
    }
  }

  update(currentSpeed: number) {
    this.x -= currentSpeed;
    if (this.x + this.width < 0) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    if (this.eraId === 1) { // Vacuum Tubes (1946–1959)
      if (this.type === 'tube') {
        ctx.fillStyle = '#ffb8b8';
        ctx.beginPath();
        ctx.roundRect(0, 0, this.width, this.height, 10);
        ctx.fill();
        ctx.fillStyle = '#ff4d4d'; // Glowing filament
        ctx.fillRect(this.width/2 - 2, 10, 4, this.height - 20);
      } else { // punchcard
        ctx.fillStyle = '#f5f5dc'; // Beige
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#000'; // Holes
        for(let i = 5; i < this.height - 5; i += 8) {
          for(let j = 5; j < this.width - 5; j += 8) {
            if (Math.random() > 0.7) ctx.fillRect(j, i, 4, 6);
          }
        }
      }
    } else if (this.eraId === 2) { // Transistors & Mainframes
      if (this.type === 'reeltoreel') {
        ctx.fillStyle = '#dcdde1';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#2f3640';
        ctx.beginPath();
        ctx.arc(this.width/2, this.height/4, this.width/3, 0, Math.PI*2);
        ctx.arc(this.width/2, this.height*3/4, this.width/3, 0, Math.PI*2);
        ctx.fill();
      } else { // mainframe
        ctx.fillStyle = '#353b48';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#4cd137'; // blinking lights
        for(let i = 5; i < this.height - 5; i += 10) {
          ctx.fillRect(5, i, 8, 4);
          ctx.fillRect(this.width - 15, i, 8, 4);
        }
      }
    } else if (this.eraId === 3) { // Personal Computing
      if (this.type === 'floppy') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.width * 0.2, this.height * 0.2, this.width * 0.6, this.height * 0.4);
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(this.width * 0.3, this.height * 0.8, this.width * 0.4, this.height * 0.2);
      } else if (this.type === 'crt') {
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(5, 5, this.width - 10, this.height - 20);
        ctx.fillStyle = '#27ae60';
        ctx.fillText("C:\\>", 8, 20);
      } else { // keyboard
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(0, 0, this.width, this.height/2);
        ctx.fillStyle = '#bdc3c7';
        for(let i = 2; i < this.width-2; i+=6) {
          ctx.fillRect(i, 2, 4, this.height/2 - 4);
        }
      }
    } else if (this.eraId === 4) { // Internet Age
      if (this.type === 'browser') {
        ctx.fillStyle = '#ffffff'; // Window body
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#3498db'; // Title bar
        ctx.fillRect(0, 0, this.width, 10);
        ctx.fillStyle = '#e74c3c'; // Close button
        ctx.fillRect(this.width - 8, 2, 6, 6);
      } else if (this.type === 'wifi') {
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(this.width/2, this.height, this.width/2, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.width/2, this.height, this.width/4, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(this.width/2, this.height - 2, 4, 0, Math.PI*2);
        ctx.fill();
      } else { // server rack
        ctx.fillStyle = '#2f3640';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#00a8ff';
        for(let i=5; i<this.height-5; i+=12) {
          ctx.fillRect(5, i, this.width - 10, 6);
        }
      }
    } else { // AI Era
      if (this.type === 'neural') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.width/2, this.height/2, this.width/3, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#e056fd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(this.width/2, this.height/2);
        ctx.moveTo(this.width, 0); ctx.lineTo(this.width/2, this.height/2);
        ctx.moveTo(0, this.height); ctx.lineTo(this.width/2, this.height/2);
        ctx.moveTo(this.width, this.height); ctx.lineTo(this.width/2, this.height/2);
        ctx.stroke();
      } else if (this.type === 'tensor') {
        ctx.fillStyle = '#00d2d3';
        ctx.fillRect(this.width*0.2, this.height*0.2, this.width*0.6, this.height*0.6);
        ctx.fillStyle = '#ff9f43';
        ctx.fillRect(this.width*0.4, 0, this.width*0.2, this.height);
        ctx.fillRect(0, this.height*0.4, this.width, this.height*0.2);
      } else { // glitch
        ctx.fillStyle = Math.random() > 0.5 ? '#ff4757' : '#2ed573';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(Math.random()*this.width, Math.random()*this.height, 10, 5);
      }
    }
    ctx.restore();
  }

  // Hitbox is slightly smaller (0.8x) for fairness
  getHitbox() {
    const marginX = this.width * 0.1;
    const marginY = this.height * 0.1;
    return {
      x: this.x + marginX,
      y: this.y + marginY,
      width: this.width * 0.8,
      height: this.height * 0.8
    };
  }
}
