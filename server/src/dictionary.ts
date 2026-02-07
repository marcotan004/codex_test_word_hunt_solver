import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadDictionary() {
  const filePath = path.resolve('data', 'words.txt');
  const text = await fs.readFile(filePath, 'utf-8');
  return text
    .split(/\r?\n/)
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length >= 2);
}
