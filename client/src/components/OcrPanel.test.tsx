import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import OcrPanel from './OcrPanel';

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
}));

const originalImage = global.Image;
const originalFileReader = global.FileReader;
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalGetBoundingClientRect = HTMLCanvasElement.prototype.getBoundingClientRect;

beforeAll(() => {
  class MockFileReader {
    result: string | ArrayBuffer | null = 'data:image/png;base64,deadbeef';
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    readAsDataURL() {
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }
  }

  class MockImage {
    width = 100;
    height = 100;
    onload: (() => void) | null = null;
    set src(_value: string) {
      if (this.onload) {
        this.onload();
      }
    }
  }

  global.FileReader = MockFileReader as unknown as typeof FileReader;
  global.Image = MockImage as unknown as typeof Image;

  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  });

  HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => {},
  }));
});

afterAll(() => {
  global.Image = originalImage;
  global.FileReader = originalFileReader;
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
});

describe('OcrPanel', () => {
  it('updates selection status after two clicks', () => {
    const { container } = render(<OcrPanel onLetters={() => {}} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    fireEvent.change(input, {
      target: {
        files: [new File(['image'], 'board.png', { type: 'image/png' })],
      },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();

    fireEvent.click(canvas, { clientX: 10, clientY: 20 });
    expect(screen.getByText('Selection started. Click again to finish.')).toBeInTheDocument();

    fireEvent.click(canvas, { clientX: 60, clientY: 70 });
    expect(screen.getByText('Selection complete. Run OCR to extract letters.')).toBeInTheDocument();
  });
});
