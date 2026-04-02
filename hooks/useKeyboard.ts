import { useEffect, useRef } from "react";

import { GAME_CONFIG } from '@/lib/gameConfig';

export function useKeyboard() {
  const keysRef = useRef<{ [key: string]: boolean }>({
    Space: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyH: false,
    KeyG: false,
    _jumpConsumed: false,
    _hConsumed: false,
    _gConsumed: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyG' && document.activeElement?.tagName === 'INPUT') {
        return;
      }
      // Prevent default scrolling for game keys
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        if (e.target === document.body) {
           e.preventDefault();
        }
      }

      if (e.code === 'KeyG' && !e.repeat) {
        (GAME_CONFIG as any).gravityEnabled = !(GAME_CONFIG as any).gravityEnabled;
      }

      keysRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === "Space" || e.code === "ArrowUp") {
        keysRef.current._jumpConsumed = false;
      }
      if (e.code === "KeyG") {
        keysRef.current._gConsumed = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keysRef.current;
}
