"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LeaderboardEntry, getLeaderboard } from "@/lib/leaderboard";
import { Button } from "@/components/ui/Button";

export default function LeaderboardPage() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    setScores(getLeaderboard());
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center overflow-auto font-sans">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 md:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 text-center tracking-tighter">
        TOP HACKERS
      </h1>

      <div className="w-full max-w-3xl bg-gray-800 rounded-xl overflow-hidden shadow-2xl mb-8 border border-gray-700">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-950 text-gray-400 uppercase text-xs md:text-sm tracking-wider">
                  <th className="px-4 md:px-6 py-4">Rank</th>
                  <th className="px-4 md:px-6 py-4">Name</th>
                  <th className="px-4 md:px-6 py-4">Score</th>
                  <th className="px-4 md:px-6 py-4">Era Reached</th>
                </tr>
              </thead>
              <tbody>
                {scores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 md:px-6 py-8 text-center text-gray-500 italic">
                      No scores yet. Be the first to play!
                    </td>
                  </tr>
                ) : (
                  scores.map((entry, index) => (
                    <tr 
                      key={index} 
                      className={`border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors ${index === 0 ? 'bg-yellow-900/20' : ''}`}
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4 font-mono">
                        <span className={`inline-flex items-center justify-center w-6 h-6 md:w-8 md:h-8 text-sm md:text-base rounded-full ${index === 0 ? 'bg-yellow-500 text-black font-bold shadow-[0_0_10px_#f1c40f]' : index === 1 ? 'bg-gray-300 text-black font-bold' : index === 2 ? 'bg-orange-400 text-black font-bold' : 'bg-gray-700'}`}>
                            {index + 1}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-sm md:text-base">{entry.name}</td>
                      <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-lg md:text-xl text-blue-400">{entry.score.toLocaleString()}</td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-gray-300 text-sm md:text-base">{entry.era_reached}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>

      <div className="flex gap-4">
          <Button onClick={() => router.push("/game")} className="bg-blue-600 hover:bg-blue-500 px-6 md:px-8 py-3">
            Play Game
          </Button>
          <Button onClick={() => router.push("/")} className="bg-gray-700 hover:bg-gray-600 px-6 md:px-8 py-3">
            Menu
          </Button>
      </div>
    </div>
  );
}
