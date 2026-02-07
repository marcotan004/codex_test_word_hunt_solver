import { scoreWord } from './scoring.js';
import type { TrieNode } from './trie.js';

const GRID_SIZE = 4;

function getNeighbors(index: number) {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const neighbors: number[] = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        neighbors.push(nr * GRID_SIZE + nc);
      }
    }
  }
  return neighbors;
}

const neighborCache = Array(GRID_SIZE * GRID_SIZE)
  .fill(null)
  .map((_, idx) => getNeighbors(idx));

export type SolveResult = {
  word: string;
  path: number[];
  score: number;
  length: number;
};

export function solveBoard(board: string[], trie: TrieNode): SolveResult[] {
  const results = new Map<string, number[]>();
  const minLength = 3;

  function dfs(index: number, node: TrieNode, visited: number, path: number[]) {
    const letter = board[index];
    const nextNode = node.children.get(letter);
    if (!nextNode) return;

    const nextVisited = visited | (1 << index);
    const nextPath = [...path, index];

    if (nextNode.word && nextNode.word.length >= minLength) {
      if (!results.has(nextNode.word)) {
        results.set(nextNode.word, nextPath);
      }
    }

    for (const n of neighborCache[index]) {
      if (nextVisited & (1 << n)) continue;
      dfs(n, nextNode, nextVisited, nextPath);
    }
  }

  for (let i = 0; i < board.length; i += 1) {
    dfs(i, trie, 0, []);
  }

  return Array.from(results.entries()).map(([word, path]) => {
    const score = scoreWord(word);
    return { word, path, score, length: word.length };
  });
}
