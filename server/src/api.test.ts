import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './index.js';
import { buildTrie } from './trie.js';

const board = [
  'C', 'A', 'T', 'S',
  'D', 'O', 'G', 'S',
  'H', 'A', 'T', 'E',
  'R', 'A', 'T', 'E',
];

const trie = buildTrie(['CAT', 'CATS', 'DOG', 'DOGS', 'HATE', 'RATE', 'RAT']);
const app = createApp({ trie, wordsCount: 7 });

describe('API', () => {
  it('GET /health returns ok and wordsCount', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.wordsCount).toBe(7);
  });

  it('POST /solve returns results for valid board', async () => {
    const res = await request(app)
      .post('/solve')
      .send({ board });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    const words = res.body.results.map((item: { word: string }) => item.word);
    expect(words).toContain('CAT');
  });

  it('POST /solve rejects invalid board length', async () => {
    const res = await request(app)
      .post('/solve')
      .send({ board: ['A', 'B'] });
    expect(res.status).toBe(400);
  });

  it('POST /solve rejects empty cells', async () => {
    const badBoard = [...board];
    badBoard[5] = '';
    const res = await request(app)
      .post('/solve')
      .send({ board: badBoard });
    expect(res.status).toBe(400);
  });
});
