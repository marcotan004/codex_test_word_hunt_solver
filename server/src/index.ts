import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { buildTrie, type TrieNode } from './trie.js';
import { loadDictionary } from './dictionary.js';
import { solveBoard } from './solver.js';
import { swaggerSpec } from './swagger.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

let trie: TrieNode | null = null;
let wordsCount = 0;

async function init() {
  const words = await loadDictionary();
  trie = buildTrie(words);
  wordsCount = words.length;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, wordsCount });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post('/solve', (req, res) => {
  if (!trie) {
    res.status(503).json({ error: 'Dictionary not loaded yet.' });
    return;
  }

  const { board } = req.body || {};
  if (!Array.isArray(board) || board.length !== 16) {
    res.status(400).json({ error: 'Board must be an array of 16 letters.' });
    return;
  }

  const cleaned = board.map((ch: string) => String(ch || '').toUpperCase().replace(/[^A-Z]/g, ''));
  if (cleaned.some((ch: string) => !ch)) {
    res.status(400).json({ error: 'Board contains invalid or empty cells.' });
    return;
  }

  const results = solveBoard(cleaned, trie);

  res.json({ results });
});

const PORT = Number(process.env.PORT || 5174);

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Word Hunt server listening on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to load dictionary:', error);
    process.exit(1);
  });
