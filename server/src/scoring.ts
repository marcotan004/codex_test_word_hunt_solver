export type ScoringConfig = {
  minLength: number;
  baseScore: number;
  perLetter: number;
  lengthBonus: number[];
  useTable: boolean;
  scoreTable: Record<number, number> | null;
};

export function scoreWord(word: string, config: ScoringConfig): number {
  const length = word.length;
  const minLength = Number(config.minLength ?? 3);
  if (length < minLength) return 0;

  if (config.useTable && config.scoreTable) {
    const tableScore = config.scoreTable[length];
    if (Number.isFinite(tableScore)) return tableScore;
  }

  const base = Number(config.baseScore ?? 0) || 0;
  const perLetter = Number(config.perLetter ?? 0) || 0;
  const bonus = Array.isArray(config.lengthBonus) ? Number(config.lengthBonus[length - 1] ?? 0) : 0;

  return base + perLetter * length + bonus;
}
