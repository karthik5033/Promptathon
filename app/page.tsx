"use client";

import { useRouter } from "next/navigation";

export default function MenuScreen() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 font-sans overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      {/* Main Content Card */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in-up w-full max-w-2xl px-8 py-16 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        
        <div className="text-center mb-14">
          <div className="inline-block animate-float mb-6">
            <h1 className="text-6xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 tracking-tighter drop-shadow-sm leading-tight animate-glow pb-2">
              BIT ODYSSEY
            </h1>
          </div>
          
          <h2 className="text-xl md:text-3xl text-gray-300 font-medium tracking-wide uppercase letter-spacing-2">
            80 Years of Computing
          </h2>
          
          <div className="mt-8 relative inline-flex group">
            <div className="absolute transition-all duration-1000 opacity-70 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt"></div>
            <div className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm md:text-base font-bold text-white bg-black rounded-full border border-white/10 shadow-2xl">
              <span className="text-yellow-400 mr-2">⚡</span> IEEE Computer Society (1946–2026)
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 w-full max-w-sm mx-auto">
          <button 
            onClick={() => router.push("/game")} 
            className="group relative w-full flex items-center justify-center gap-3 text-xl md:text-2xl font-bold py-5 rounded-2xl bg-white text-black overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            PLAY GAME
            <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button 
            onClick={() => router.push("/leaderboard")} 
            className="w-full text-lg md:text-xl font-semibold py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/15 backdrop-blur-md transition-all hover:border-white/30 text-gray-300 hover:text-white"
          >
            LEADERBOARD
          </button>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 w-full text-center">
          <p className="text-gray-400 text-sm md:text-base font-medium flex items-center justify-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-xs">SPACE</kbd> / <kbd className="px-2 py-1 bg-white/10 rounded font-mono text-xs">▲</kbd> Jump & Double Jump
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 opacity-60">
             <div className="flex items-center gap-2 text-xs text-blue-300 font-mono"><span className="text-base text-white">💎</span> Data bits = +Score & Combo</div>
             <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono"><span className="text-base text-white">🛡️</span> Shield = Absorbs 1 hit</div>
          </div>
        </div>

      </div>
    </div>
  );
}
