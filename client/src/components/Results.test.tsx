import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Results from './Results';

const results = [
  { word: 'CAT', path: [0, 1, 2], score: 100, length: 3 },
  { word: 'DOGS', path: [4, 5, 6, 7], score: 400, length: 4 },
];

describe('Results', () => {
  it('renders results and totals', () => {
    render(
      <Results
        results={results}
        totalScore={500}
        sortBy="score"
        onSortChange={() => {}}
        onHover={() => {}}
        onPlay={() => {}}
        onStop={() => {}}
        isAnimating={false}
      />
    );

    expect(screen.getByText('CAT')).toBeInTheDocument();
    expect(screen.getByText('DOGS')).toBeInTheDocument();
    expect(screen.getByText('Score: 500')).toBeInTheDocument();
  });
});
