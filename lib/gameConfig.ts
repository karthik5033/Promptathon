export const GAME_CONFIG = {
  gravity: 0.6,
  jumpForce: -11,
  baseSpeed: 5,
  playerSpeed: 5,
  groundHeightRatio: 0.22,
  speedIncrement: 0.001,
  maxSpeed: 15,
  minObstacleGap: 400,
  scoreEras: [0, 800, 2000, 4000, 7000],
};

export const ERAS = [
  {
    id: 1,
    name: "Vacuum Tubes",
    years: "1946–1959",
    bgTop: "#1e272e",
    bgBottom: "#d35400",
    groundColor: "#2d3436",
  },
  {
    id: 2,
    name: "Transistors & Mainframes",
    years: "1960–1979",
    bgTop: "#000000",
    bgBottom: "#003300",
    groundColor: "#0f0f0f",
  },
  {
    id: 3,
    name: "Personal Computing",
    years: "1980–1999",
    bgTop: "#3498db",
    bgBottom: "#f1c40f",
    groundColor: "#e67e22",
  },
  {
    id: 4,
    name: "Internet Age",
    years: "2000–2015",
    bgTop: "#ffffff",
    bgBottom: "#74b9ff",
    groundColor: "#b2bec3",
  },
  {
    id: 5,
    name: "AI Era",
    years: "2016–2026",
    bgTop: "#2a0080",
    bgBottom: "#ff007f",
    groundColor: "#1a0033",
  }
];
