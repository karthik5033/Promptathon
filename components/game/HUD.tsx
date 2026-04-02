export interface HUDProps {
  gravityOn?: boolean;
  toggleGravity?: () => void;
}

export function HUD({ gravityOn = true, toggleGravity }: HUDProps) {
  return (
    <div className="absolute top-0 left-0 w-full pointer-events-none z-20 font-mono" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
      <div className="flex justify-between items-start p-4 md:p-6">
        {/* Score */}
        <div className="flex flex-col">
          <span className="text-[10px] md:text-xs uppercase text-gray-400 tracking-[0.2em]">Score</span>
          <span id="hud-score" className="text-3xl md:text-5xl font-black text-white tabular-nums drop-shadow-md">
            000000
          </span>
          <div id="hud-combo-container" className="hidden transition-opacity">
            <span id="hud-combo" className="text-xs md:text-sm font-bold animate-pulse text-orange-400">
              1x COMBO 🔥
            </span>
          </div>
        </div>

        {/* Era */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] md:text-xs uppercase text-gray-400 tracking-[0.2em]">Era</span>
          <div className="relative">
            <span id="hud-era-name" className="text-lg md:text-2xl font-bold text-center px-5 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-md text-white block shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Loading...
            </span>
            <span id="hud-era-years" className="text-[9px] md:text-xs text-gray-400 text-center block mt-1 font-mono">
              ----
            </span>
          </div>
        </div>

        {/* Speed + Power-up indicators */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] md:text-xs uppercase text-gray-400 tracking-[0.2em]">Speed</span>
          <span id="hud-speed" className="text-xl md:text-3xl font-bold text-white tabular-nums drop-shadow-md">
            0.0x
          </span>
          {!gravityOn && <span className="text-purple-400 animate-pulse text-[10px] font-bold mt-1">⚡ ZERO-G</span>}
          <div className="flex gap-2 mt-2">
            <span id="hud-shield" className="hidden text-xs md:text-sm px-2 py-0.5 bg-blue-500/30 border border-blue-400/50 rounded-full text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              🛡️ SHIELD
            </span>
            <span id="hud-doublejump" className="hidden text-xs md:text-sm px-2 py-0.5 bg-yellow-500/30 border border-yellow-400/50 rounded-full text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              ⬆️⬆️ JUMP
            </span>
          </div>
        </div>
      </div>
      {toggleGravity && (
        <button
          onClick={toggleGravity}
          style={{ pointerEvents: 'auto' }}
          className={`
            fixed bottom-6 left-1/2 -translate-x-1/2
            px-6 py-2 rounded-full font-mono font-bold text-sm
            border-2 transition-all duration-300 z-50
            ${gravityOn 
              ? 'bg-blue-900 border-blue-400 text-blue-200 shadow-blue-500/50 shadow-lg' 
              : 'bg-orange-900 border-orange-400 text-orange-200 shadow-orange-500/50 shadow-lg animate-pulse'
            }
          `}
        >
          {gravityOn ? '🌍 GRAVITY: ON' : '🚀 GRAVITY: OFF'}
        </button>
      )}
    </div>
  );
}
