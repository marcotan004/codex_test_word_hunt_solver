import fs from 'node:fs/promises';
import path from 'node:path';

type WordsDictionary = Record<string, number>;

export async function loadDictionary() {
  const filePath = path.resolve('data', 'words_dictionary.json');
  const text = await fs.readFile(filePath, 'utf-8');
  const raw = JSON.parse(text) as WordsDictionary;
  return Object.keys(raw)
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length >= 2);
}
