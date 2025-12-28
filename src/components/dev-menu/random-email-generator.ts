const adjectives = [
  "happy", "swift", "clever", "bright", "cool",
  "wild", "calm", "bold", "keen", "wise",
  "quick", "brave", "sharp", "fresh", "warm",
  "quiet", "loud", "soft", "dark", "light",
];

const nouns = [
  "tiger", "cloud", "pixel", "river", "flame",
  "storm", "frost", "wave", "spark", "stone",
  "leaf", "wind", "star", "moon", "sun",
  "tree", "bird", "fish", "wolf", "bear",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomEmail(): string {
  const adj = randomItem(adjectives);
  const noun = randomItem(nouns);
  const num = randomNumber(10, 99);
  return `${adj}-${noun}-${num}@localhost.test`;
}

export function generateRandomName(): string {
  const adj = randomItem(adjectives);
  const noun = randomItem(nouns);
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${capitalize(adj)} ${capitalize(noun)}`;
}
