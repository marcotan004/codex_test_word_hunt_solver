import { describe, it, expect } from 'vitest';
import { scoreWord } from './scoring.js';

describe('scoreWord', () => {
  it('returns 0 for lengths below 3', () => {
    expect(scoreWord('A')).toBe(0);
    expect(scoreWord('TO')).toBe(0);
  });

  it('scores 3-8 letter words with fixed values', () => {
    expect(scoreWord('CAT')).toBe(100);
    expect(scoreWord('CATS')).toBe(400);
    expect(scoreWord('PLANT')).toBe(800);
    expect(scoreWord('PLANET')).toBe(1400);
    expect(scoreWord('PLANETS')).toBe(1800);
    expect(scoreWord('PLANETES')).toBe(2200);
  });

  it('scores 9+ letters with incremental bonus', () => {
    expect(scoreWord('ABCDEFGHI')).toBe(2600);
    expect(scoreWord('ABCDEFGHIJ')).toBe(3000);
  });
});
