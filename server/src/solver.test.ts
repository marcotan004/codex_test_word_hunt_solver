import { describe, it, expect } from 'vitest';
import { buildTrie } from './trie.js';
import { solveBoard } from './solver.js';

const board = [
  'C', 'A', 'T', 'S',
  'D', 'O', 'G', 'S',
  'H', 'A', 'T', 'E',
  'R', 'A', 'T', 'E',
];

const dictionary = ['CAT', 'CATS', 'DOG', 'DOGS', 'HATE', 'RATE', 'RAT', 'CAR'];

function makeResultMap() {
  const trie = buildTrie(dictionary);
  const results = solveBoard(board, trie);
  return new Map(results.map((item) => [item.word, item]));
}

describe('solveBoard', () => {
  it('finds expected words and excludes invalid ones', () => {
    const map = makeResultMap();
    expect(map.has('CAT')).toBe(true);
    expect(map.has('CATS')).toBe(true);
    expect(map.has('DOG')).toBe(true);
    expect(map.has('DOGS')).toBe(true);
    expect(map.has('HATE')).toBe(true);
    expect(map.has('RATE')).toBe(true);
    expect(map.has('RAT')).toBe(true);
    expect(map.has('CAR')).toBe(false);
  });

  it('assigns scores using fixed scoring rules', () => {
    const map = makeResultMap();
    expect(map.get('CAT')?.score).toBe(100);
    expect(map.get('CATS')?.score).toBe(400);
    expect(map.get('DOG')?.score).toBe(100);
    expect(map.get('HATE')?.score).toBe(400);
  });

  it('returns valid paths with unique indices', () => {
    const map = makeResultMap();
    for (const item of map.values()) {
      const unique = new Set(item.path);
      expect(unique.size).toBe(item.path.length);
      expect(item.path.every((idx) => idx >= 0 && idx < 16)).toBe(true);
    }
  });
});
