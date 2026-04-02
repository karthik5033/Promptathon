import { ERAS } from "@/lib/gameConfig";

interface Mountain { x: number; width: number; height: number; points: [number, number][] }
interface Building { x: number; width: number; height: number; lights: {lx: number, ly: number, on: boolean}[] }

export class BackgroundSystem {
    private mountains: Mountain[] = [];
    private buildings: Building[] = [];
    private stars: {x: number, y: number, r: number, alpha: number, speed: number}[] = [];
    
    constructor(private canvasWidth: number, private canvasHeight: number) {
        this.generateEnvironment();
    }

    private generateEnvironment() {
        const groundY = this.canvasHeight - (this.canvasHeight * 0.15); // groundHeightRatio is 0.15 typically
        
        // Generate Stars
        for(let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * (groundY - 100),
                r: Math.random() * 1.5 + 0.5,
                alpha: Math.random(),
                speed: Math.random() * 0.05 + 0.01
            });
        }

        // Generate Mountains (Distant, organic structures)
        let cx = 0;
        while (cx < this.canvasWidth * 3) {
            const width = Math.random() * 400 + 300;
            const peakY = groundY - (Math.random() * 200 + 100);
            
            // Create jagged polygon
            const points: [number, number][] = [];
            points.push([0, groundY]);
            points.push([width * 0.3, peakY + 50]);
            points.push([width * 0.5, peakY]);
            points.push([width * 0.8, peakY + 80]);
            points.push([width, groundY]);
            
            this.mountains.push({ x: cx, width, height: groundY - peakY, points });
            cx += width * 0.6; // overlapping
        }

        // Generate Cyber-Buildings (Mid-ground)
        let bx = 0;
        while (bx < this.canvasWidth * 3) {
            const w = Math.random() * 80 + 40;
            const h = Math.random() * 150 + 50;
            const hasLights = Math.random() > 0.3;
            
            const lights = [];
            if (hasLights) {
                for (let ly = 10; ly < h - 10; ly += 15) {
                    for (let lx = 10; lx < w - 10; lx += 15) {
                        if (Math.random() > 0.5) lights.push({ lx, ly, on: Math.random() > 0.5 });
                    }
                }
            }
            this.buildings.push({ x: bx, width: w, height: h, lights });
            bx += w + Math.random() * 100;
        }
    }

    update(speed: number, frames: number, canvasWidth: number) {
        // Parallax stars (very slow)
        this.stars.forEach(s => {
            s.x -= speed * s.speed;
            if (s.x < 0) s.x = canvasWidth;
            s.alpha = Math.max(0.1, Math.sin(frames * s.speed * 2) * 0.8 + 0.2);
        });

        // Parallax Mountains
        this.mountains.forEach(m => {
            m.x -= speed * 0.15;
        });
        if (this.mountains.length > 0 && this.mountains[0].x + this.mountains[0].width < -200) {
            const m = this.mountains.shift()!;
            m.x = this.mountains[this.mountains.length - 1].x + this.mountains[this.mountains.length - 1].width * 0.6;
            this.mountains.push(m);
        }

        // Parallax Buildings
        this.buildings.forEach(b => {
             b.x -= speed * 0.4;
             if (frames % 30 === 0) {
                 b.lights.forEach(l => { if (Math.random() > 0.9) l.on = !l.on; });
             }
        });
        if (this.buildings.length > 0 && this.buildings[0].x + this.buildings[0].width < -200) {
             const b = this.buildings.shift()!;
             b.x = this.buildings[this.buildings.length - 1].x + b.width + Math.random() * 100;
             this.buildings.push(b);
        }
    }

    draw(ctx: CanvasRenderingContext2D, eraId: number, canvasHeight: number) {
        const era = ERAS[eraId - 1] || ERAS[0];
        const groundY = canvasHeight - (canvasHeight * 0.15); // Assuming 0.15 is global config

        // Draw sky gradient (more intense)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
        skyGrad.addColorStop(0, '#020010');
        skyGrad.addColorStop(0.5, era.bgTop);
        skyGrad.addColorStop(1, era.bgBottom);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw Stars
        ctx.save();
        this.stars.forEach(s => {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Mountains
        this.mountains.forEach(m => {
            ctx.save();
            ctx.translate(m.x, 0);
            ctx.beginPath();
            ctx.moveTo(m.points[0][0], m.points[0][1]);
            for(let i = 1; i < m.points.length; i++) {
                ctx.lineTo(m.points[i][0], m.points[i][1]);
            }
            ctx.closePath();
            
            // Atmospheric perspective (haze)
            const mGrad = ctx.createLinearGradient(0, groundY - m.height, 0, groundY);
            mGrad.addColorStop(0, era.bgBottom); // Blend into sky horizon
            mGrad.addColorStop(1, '#050505');
            ctx.fillStyle = mGrad;
            ctx.fill();
            
            // Highlight stroke
            ctx.strokeStyle = `rgba(255,255,255,0.03)`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });

        // Draw Buildings
        this.buildings.forEach(b => {
             ctx.save();
             ctx.translate(b.x, groundY - b.height);
             
             // Silhouette
             ctx.fillStyle = '#0a0a0a';
             ctx.fillRect(0, 0, b.width, b.height);
             
             // Building Edges (Neon rim logic)
             ctx.strokeStyle = era.groundAccent;
             ctx.lineWidth = 1;
             ctx.globalAlpha = 0.3;
             ctx.strokeRect(0, 0, b.width, b.height);
             ctx.globalAlpha = 1.0;

             // Window Lights
             ctx.fillStyle = era.starColor;
             ctx.shadowBlur = 8;
             ctx.shadowColor = era.starColor;
             b.lights.forEach(l => {
                 if (l.on) {
                    ctx.fillRect(l.lx, l.ly, 4, 4);
                 }
             });
             
             ctx.restore();
        });
        
        ctx.restore();
    }
}
