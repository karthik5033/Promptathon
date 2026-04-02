export interface PlayerStats {
  deaths: number;
  jumpsAttempted: number;
  jumpsSuccessful: number;
  totalFramesAlive: number;
  eraReached: number;
  obstaclesAvoided: number;
}

export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "PRO";

export function classifySkill(stats: PlayerStats): SkillLevel {
  const jumpAccuracy = stats.jumpsAttempted > 0 ? stats.jumpsSuccessful / stats.jumpsAttempted : 0;
  const survivalTime = stats.totalFramesAlive / 60;

  const score = (
    (jumpAccuracy * 40) +
    (Math.min(survivalTime, 120) / 120 * 30) +
    ((stats.eraReached / 5) * 30)
  );

  if (score < 35) return "BEGINNER";
  if (score < 65) return "INTERMEDIATE";
  return "PRO";
}

export function getStoredSkill(): SkillLevel {
  if (typeof window === 'undefined') return "INTERMEDIATE";
  const stored = localStorage.getItem("playerSkill");
  if (stored === "BEGINNER" || stored === "INTERMEDIATE" || stored === "PRO") {
    return stored as SkillLevel;
  }
  return "INTERMEDIATE";
}

export function storeSkill(skill: SkillLevel) {
  if (typeof window !== 'undefined') {
    localStorage.setItem("playerSkill", skill);
  }
}
