import { GAME_CONFIG } from "./gameConfig";
import { SkillLevel } from "./skillDetection";

export function applyDifficultySettings(skill: SkillLevel) {
  // Reset to intermediate defaults safely just in case
  const baseGravity = 0.35;
  const baseMaxSpeed = 8.5;

  switch (skill) {
    case "BEGINNER":
      GAME_CONFIG.minObstacleGap = 600;
      GAME_CONFIG.gravity = baseGravity * 0.85;
      GAME_CONFIG.maxSpeed = baseMaxSpeed * 0.8;
      // Define properties if they exist or will be accessed
      (GAME_CONFIG as any).floatingObstacleChance = 0;
      (GAME_CONFIG as any).doubleObstacleChance = 0;
      break;
    case "INTERMEDIATE":
      GAME_CONFIG.minObstacleGap = 400;
      GAME_CONFIG.gravity = baseGravity * 1.0;
      GAME_CONFIG.maxSpeed = baseMaxSpeed * 1.0;
      (GAME_CONFIG as any).floatingObstacleChance = 0.3;
      (GAME_CONFIG as any).doubleObstacleChance = 0;
      break;
    case "PRO":
      GAME_CONFIG.minObstacleGap = 280;
      GAME_CONFIG.gravity = baseGravity * 1.15;
      GAME_CONFIG.maxSpeed = baseMaxSpeed * 1.2;
      (GAME_CONFIG as any).floatingObstacleChance = 0.5;
      (GAME_CONFIG as any).doubleObstacleChance = 0.2;
      break;
  }
}
