export type SolveResult = {
  word: string;
  path: number[];
  score: number;
  length: number;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

export async function solveBoard(board: string[]) {
  const response = await fetch(`${API_URL}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'API request failed');
  }

  return response.json() as Promise<{ results: SolveResult[] }>;
}
