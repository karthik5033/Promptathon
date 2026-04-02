"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeaderboardEntry, getLeaderboard } from "@/lib/leaderboard";

export default function LeaderboardPage() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    setScores(getLeaderboard());
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050505] text-white p-4 md:p-8 flex flex-col items-center overflow-x-hidden font-sans">
      
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center mt-10 md:mt-20 animate-fade-in-up">
        
        <h1 className="text-5xl md:text-7xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-center tracking-tighter drop-shadow-sm pb-2">
          GLOBAL RANKINGS
        </h1>

        <div className="w-full bg-white/[0.03] backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 mb-10">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10 text-gray-400 uppercase text-xs tracking-[0.2em]">
                    <th className="px-6 md:px-8 py-5">Rank</th>
                    <th className="px-6 md:px-8 py-5">Hacker Alias</th>
                    <th className="px-6 md:px-8 py-5">Score</th>
                    <th className="px-6 md:px-8 py-5">Era Survived</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {scores.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-gray-500 text-lg">
                        The mainframe is empty. Be the first to leave your mark.
                      </td>
                    </tr>
                  ) : (
                    scores.map((entry, index) => (
                      <tr 
                        key={index} 
                        className={`group transition-colors hover:bg-white/[0.04] ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-300/5 to-transparent' : 
                          index === 2 ? 'bg-gradient-to-r from-orange-400/5 to-transparent' : ''
                        }`}
                      >
                        <td className="px-6 md:px-8 py-5 font-mono">
                          <span className={`inline-flex items-center justify-center w-10 h-10 text-lg rounded-full shadow-lg border ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black font-black border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 
                            index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-black font-bold border-gray-100 shadow-[0_0_10px_rgba(209,213,219,0.3)]' : 
                            index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-600 text-black font-bold border-orange-200 shadow-[0_0_10px_rgba(251,146,60,0.3)]' : 
                            'bg-white/5 text-gray-400 font-semibold border-white/10'
                          }`}>
                              {index === 0 ? '👑' : index + 1}
                          </span>
                        </td>
                        <td className="px-6 md:px-8 py-5 text-xl font-bold tracking-wide group-hover:text-blue-400 transition-colors">
                          {entry.name}
                        </td>
                        <td className="px-6 md:px-8 py-5 font-mono text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                          {entry.score.toLocaleString()}
                        </td>
                        <td className="px-6 md:px-8 py-5">
                          <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-gray-300">
                            {entry.era_reached}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={() => router.push("/game")} 
              className="bg-white text-black font-bold text-lg hover:scale-105 active:scale-95 px-10 py-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all"
            >
              Start Mission
            </button>
            <button 
              onClick={() => router.push("/")} 
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-lg px-10 py-4 rounded-2xl backdrop-blur-md transition-all"
            >
              Disconnect
            </button>
        </div>
        
      </div>
    </div>
  );
}
