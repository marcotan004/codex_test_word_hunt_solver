import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./components/OcrPanel', () => ({
  default: ({ onLetters }: { onLetters: (letters: string[]) => void }) => (
    <button onClick={() => onLetters(Array(16).fill('A'))}>Mock OCR</button>
  ),
}));

vi.mock('./lib/api', () => ({
  solveBoard: vi.fn(async () => ({
    results: [{ word: 'CAT', path: [0, 1, 2], score: 100, length: 3 }],
  })),
}));

const fillGrid = () => {
  const inputs = screen.getAllByRole('textbox');
  inputs.forEach((input) => {
    fireEvent.change(input, { target: { value: 'A' } });
  });
};

describe('App', () => {
  it('solves when grid is filled', async () => {
    render(<App />);

    fillGrid();
    fireEvent.click(screen.getByText('Solve'));

    await waitFor(() => {
      expect(screen.getByText('CAT')).toBeInTheDocument();
    });
  });
});
