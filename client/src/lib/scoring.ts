export function parseLengthBonus(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw.split(',').map((value) => Number(value.trim()) || 0);
}

export function parseScoreTable(raw: string): Record<number, number> | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  if (cleaned.startsWith('{')) {
    try {
      const obj = JSON.parse(cleaned) as Record<string, number>;
      const table: Record<number, number> = {};
      for (const [key, value] of Object.entries(obj)) {
        table[Number(key)] = Number(value);
      }
      return table;
    } catch {
      return null;
    }
  }

  const table: Record<number, number> = {};
  const pairs = cleaned.split(',');
  for (const pair of pairs) {
    const [lenStr, scoreStr] = pair.split(':');
    const len = Number(lenStr);
    const score = Number(scoreStr);
    if (Number.isFinite(len) && Number.isFinite(score)) {
      table[len] = score;
    }
  }

  return Object.keys(table).length ? table : null;
}
