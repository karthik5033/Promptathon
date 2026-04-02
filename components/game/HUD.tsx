interface HUDProps {
  score: number;
  eraName: string;
  eraYears: string;
  speed: number;
  combo: number;
  comboMultiplier: number;
  hasShield: boolean;
  canDoubleJump: boolean;
}

export function HUD({ score, eraName, eraYears, speed, combo, comboMultiplier, hasShield, canDoubleJump }: HUDProps) {
  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none z-10 font-mono" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
      {/* Top bar */}
      <div className="flex justify-between items-start p-3 md:p-5">
        {/* Score */}
        <div className="flex flex-col">
          <span className="text-[10px] md:text-xs uppercase text-gray-400 tracking-[0.2em]">Score</span>
          <span className="text-2xl md:text-4xl font-black text-white tabular-nums">
            {Math.floor(score).toString().padStart(6, '0')}
          </span>
          {combo > 1 && (
            <span className="text-xs md:text-sm font-bold animate-pulse" style={{ color: `hsl(${Math.min(combo * 30, 200)}, 100%, 65%)` }}>
              {comboMultiplier}x COMBO 🔥
            </span>
          )}
        </div>

        {/* Era */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] md:text-xs uppercase text-gray-400 tracking-[0.2em]">Era</span>
          <div className="relative">
            <span className="text-base md:text-xl font-bold text-center px-4 py-1.5 bg-black/50 rounded-full border border-white/20 backdrop-blur-sm text-white block">
              {eraName}
            </span>
            <span className="text-[9px] md:text-[11px] text-gray-400 text-center block mt-0.5">
              {eraYears}
            </span>
          </div>
        </div>

        {/* Speed + Power-up indicators */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] md:text-xs uppercase text-gray-400 tracking-[0.2em]">Speed</span>
          <span className="text-lg md:text-2xl font-bold text-white tabular-nums">
            {speed.toFixed(1)}x
          </span>
          <div className="flex gap-1.5 mt-1">
            {hasShield && (
              <span className="text-xs md:text-sm px-2 py-0.5 bg-blue-500/30 border border-blue-400/50 rounded-full text-blue-300">
                🛡️
              </span>
            )}
            {canDoubleJump && (
              <span className="text-xs md:text-sm px-2 py-0.5 bg-yellow-500/30 border border-yellow-400/50 rounded-full text-yellow-300">
                ⬆️⬆️
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
