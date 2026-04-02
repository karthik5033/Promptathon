"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function MenuScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <div className="text-center mb-12 animate-fade-in-down">
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4 tracking-tighter">
          BIT ODYSSEY
        </h1>
        <h2 className="text-xl md:text-2xl text-gray-400 font-mono">80 Years of Computing</h2>
        <p className="mt-4 text-sm md:text-base text-yellow-400 max-w-lg mx-auto border border-yellow-500/30 bg-yellow-500/10 py-2 px-4 rounded-full">
          IEEE Computer Society — 80 Years of Computing (1946–2026)
        </p>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 w-full max-w-sm">
        <Button onClick={() => router.push("/game")} className="w-full text-xl md:text-2xl py-4 md:py-6 bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          PLAY GAME
        </Button>
        <Button onClick={() => router.push("/leaderboard")} className="w-full text-lg md:text-xl py-3 md:py-4 bg-gray-700 hover:bg-gray-600">
          LEADERBOARD
        </Button>
      </div>

      <div className="mt-16 text-gray-500 text-xs md:text-sm max-w-md text-center">
        <p className="mb-2">Desktop: Space/ArrowUp to Jump. ArrowLeft/ArrowRight to Move.</p>
        <p>Mobile: Touch on-screen buttons.</p>
      </div>
    </div>
  );
}
