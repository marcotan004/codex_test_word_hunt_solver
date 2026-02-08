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

  it('starts and stops animation', async () => {
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 1);
    const cafSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

    render(<App />);

    fillGrid();
    fireEvent.click(screen.getByText('Solve'));

    await waitFor(() => {
      expect(screen.getByText('CAT')).toBeInTheDocument();
    });

    const playButton = screen.getByRole('button', { name: 'Play Top 20' });
    const stopButton = screen.getByRole('button', { name: 'Stop' });

    expect(stopButton).toBeDisabled();
    fireEvent.click(playButton);
    expect(stopButton).toBeEnabled();

    fireEvent.click(stopButton);
    await waitFor(() => {
      expect(stopButton).toBeDisabled();
    });

    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });
});
