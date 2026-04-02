import { useEffect, useRef } from "react";

export function useKeyboard() {
  const keysRef = useRef<{ [key: string]: boolean }>({
    Space: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false,
    _jumpConsumed: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game keys
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        if (e.target === document.body) {
           e.preventDefault();
        }
      }
      keysRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      if (e.code === "Space" || e.code === "ArrowUp") {
        keysRef.current._jumpConsumed = false;
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
