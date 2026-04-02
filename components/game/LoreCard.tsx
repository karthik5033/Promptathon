"use client";
import React, { useEffect, useState } from 'react';

const FALLBACK_FACTS: Record<number, string> = {
  1: "ENIAC (1945) could perform 5,000 additions per second — revolutionary for its time.",
  2: "The IBM System/360 (1964) was the first computer family with compatible software.",
  3: "The Apple Macintosh (1984) popularized the GUI for everyday consumers.",
  4: "Google processed over 1 billion search queries per day by 2000.",
  5: "GPT-3 (2020) had 175 billion parameters, trained on 45TB of text data."
};

function getFallback(eraReached: number): string {
  return FALLBACK_FACTS[eraReached] ?? FALLBACK_FACTS[1];
}

interface LoreCardProps {
  eraReached: number;
  eraName: string;
  score: number;
  skillLevel: string;
}

export const LoreCard: React.FC<LoreCardProps> = ({ eraReached, eraName, score, skillLevel }) => {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [loreText, setLoreText] = useState<string>("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function generateLore() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing API Key");

        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a computing history expert. The player just reached 
Era ${eraReached} (${eraName}) in a computing history game, scored ${score} points, 
and is classified as a ${skillLevel} player.

Give ONE interesting fact about computing history from this era. 
Maximum 2 sentences. Mention real people or inventions. 
End with a short encouragement for the player.`
                    }
                  ]
                }
              ],
              generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.7
              }
            })
          }
        );

        clearTimeout(timeout);

        if (!response.ok) throw new Error("Gemini API failed");
        
        const data = await response.json();
        const generated = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!generated) throw new Error("No content generated");

        if (active) {
          setLoreText(generated);
          setState("success");
        }
      } catch (err) {
        if (active) {
          setLoreText(getFallback(eraReached));
          setState("error");
        }
      }
    }

    generateLore();

    return () => {
      active = false;
      controller.abort();
    };
  }, [eraReached, eraName, score, skillLevel]);

  return (
    <div className="bg-gray-900 border border-amber-500 rounded-lg p-4 mt-4 max-w-md mx-auto w-full">
      <h3 className="text-amber-400 font-mono font-bold mb-2 flex items-center gap-2">
        <span className={state === "loading" ? "animate-pulse" : ""}>📡</span> Computing Lore
      </h3>
      
      {state === "loading" && (
        <p className="text-amber-300 font-mono text-sm animate-pulse">
          Transmitting...
        </p>
      )}
      
      {(state === "success" || state === "error") && (
        <p className="text-amber-100 font-mono text-sm leading-relaxed">
          {loreText}
        </p>
      )}
      
      {state === "error" && (
        <p className="text-gray-500 font-mono text-xs mt-2">
          [Archive record]
        </p>
      )}
    </div>
  );
};
