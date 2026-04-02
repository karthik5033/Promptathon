export const GAME_CONFIG = {
  // Physics — tuned for higher jumping and better obstacle clearance
  gravity: 0.45,
  jumpForce: -12.5,
  doubleJumpForce: -10.5,
  baseSpeed: 2.8,
  playerSpeed: 4.5,
  groundHeightRatio: 0.18,

  // Difficulty curve — very gentle ramp
  speedIncrement: 0.0003,
  maxSpeed: 7.5,
  eraSpeedBoost: 0.3,   // small bump on era change

  // Obstacle spacing — generous gaps
  minObstacleGap: 500,
  maxObstacleGap: 800,
  obstacleSpawnChance: 0.012,

  // Collectibles
  dataBitSpawnChance: 0.006,
  dataBitValue: 25,
  powerUpSpawnChance: 0.002,

  // Combo system
  comboDecayTime: 180,   // frames before combo resets (~3 sec)
  maxComboMultiplier: 5,

  // Score thresholds for era transitions (much more generous)
  scoreEras: [0, 500, 1500, 3000, 5500],

  // IEEE easter egg
  ieeeScore: 1946,
  ieeeBonusPoints: 500,
};

export interface EraConfig {
  id: number;
  name: string;
  years: string;
  bgTop: string;
  bgBottom: string;
  groundColor: string;
  groundAccent: string;
  particleColor: string;
  textColor: string;
  obstacleTypes: string[];
  collectibleColor: string;
  starColor: string;
}

export const ERAS: EraConfig[] = [
  {
    id: 1,
    name: "Vacuum Tubes",
    years: "1946–1959",
    bgTop: "#0d1117",
    bgBottom: "#3d1a00",
    groundColor: "#1a1a2e",
    groundAccent: "#e94d1b",
    particleColor: "rgba(255, 140, 50, 0.7)",
    textColor: "#ff6b35",
    obstacleTypes: ["tube", "punchcard"],
    collectibleColor: "#ff9f43",
    starColor: "#ffeaa7",
  },
  {
    id: 2,
    name: "Transistors & Mainframes",
    years: "1960–1979",
    bgTop: "#020c1b",
    bgBottom: "#001a00",
    groundColor: "#0a0a0a",
    groundAccent: "#00ff41",
    particleColor: "rgba(0, 255, 65, 0.6)",
    textColor: "#00ff41",
    obstacleTypes: ["reeltoreel", "mainframe"],
    collectibleColor: "#00ff41",
    starColor: "#55efc4",
  },
  {
    id: 3,
    name: "Personal Computing",
    years: "1980–1999",
    bgTop: "#1a73e8",
    bgBottom: "#81ecec",
    groundColor: "#b8e994",
    groundAccent: "#f9ca24",
    particleColor: "rgba(255, 234, 167, 0.7)",
    textColor: "#fdcb6e",
    obstacleTypes: ["floppy", "crt", "keyboard"],
    collectibleColor: "#e17055",
    starColor: "#ffeaa7",
  },
  {
    id: 4,
    name: "Internet Age",
    years: "2000–2015",
    bgTop: "#dfe6e9",
    bgBottom: "#74b9ff",
    groundColor: "#636e72",
    groundAccent: "#0984e3",
    particleColor: "rgba(116, 185, 255, 0.6)",
    textColor: "#0984e3",
    obstacleTypes: ["browser", "wifi", "server"],
    collectibleColor: "#74b9ff",
    starColor: "#dfe6e9",
  },
  {
    id: 5,
    name: "AI Era",
    years: "2016–2026",
    bgTop: "#0c0032",
    bgBottom: "#190061",
    groundColor: "#240046",
    groundAccent: "#ff00ff",
    particleColor: "rgba(224, 86, 253, 0.7)",
    textColor: "#e056fd",
    obstacleTypes: ["neural", "tensor", "glitch"],
    collectibleColor: "#a29bfe",
    starColor: "#fd79a8",
  },
];
