export type TrieNode = {
  children: Map<string, TrieNode>;
  word: string | null;
};

export function buildTrie(words: string[]): TrieNode {
  const root: TrieNode = { children: new Map(), word: null };
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, { children: new Map(), word: null });
      }
      node = node.children.get(ch)!;
    }
    node.word = word;
  }
  return root;
}
