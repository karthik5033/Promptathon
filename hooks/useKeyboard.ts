import { useState, useEffect } from "react";

export function useKeyboard() {
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({
    Space: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
        setKeys((prev) => {
            if(prev[e.code]) return prev;
            return { ...prev, [e.code]: true };
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
        setKeys((prev) => ({ ...prev, [e.code]: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
}
