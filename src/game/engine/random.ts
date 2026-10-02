export type RandomSource = () => number;

export function randomInt(max: number, random: RandomSource): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Random source must return a value in [0, 1).');
  return Math.floor(value * max);
}

export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, random);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function seededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
