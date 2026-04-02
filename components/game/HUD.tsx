interface HUDProps {
  score: number;
  eraName: string;
  speed: number;
}

export function HUD({ score, eraName, speed }: HUDProps) {
  return (
    <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start pointer-events-none text-white drop-shadow-md z-10 font-mono">
      <div className="flex flex-col">
        <span className="text-xs md:text-sm uppercase text-gray-300 tracking-wider">Score</span>
        <span className="text-2xl md:text-4xl font-bold">{Math.floor(score).toString().padStart(6, '0')}</span>
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-xs md:text-sm uppercase text-gray-300 tracking-wider">Era</span>
        <span className="text-lg md:text-2xl font-bold text-center px-3 py-1 md:px-4 bg-black/40 rounded-full border border-white/20 backdrop-blur-sm">{eraName}</span>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="text-xs md:text-sm uppercase text-gray-300 tracking-wider">Speed</span>
        <span className="text-xl md:text-2xl font-bold">{speed.toFixed(1)}x</span>
      </div>
    </div>
  );
}
