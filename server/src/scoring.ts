const SCORE_TABLE: Record<number, number> = {
  3: 100,
  4: 400,
  5: 800,
  6: 1400,
  7: 1800,
  8: 2200,
};

export function scoreWord(word: string): number {
  const length = word.length;
  if (length < 3) return 0;
  if (length <= 8) return SCORE_TABLE[length] ?? 0;
  return 2200 + (length - 8) * 400;
}
