export interface LeaderboardEntry {
  name: string;
  score: number;
  era_reached: string;
}

const LEADERBOARD_KEY = "bit_odyssey_leaderboard";

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(LEADERBOARD_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveToLeaderboard(entry: LeaderboardEntry) {
  if (typeof window === "undefined") return;
  const current = getLeaderboard();
  current.push(entry);
  current.sort((a, b) => b.score - a.score);
  const top10 = current.slice(0, 10);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10));
}
