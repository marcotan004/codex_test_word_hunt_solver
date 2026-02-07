import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { createWorker, type Worker } from 'tesseract.js';

const GRID_SIZE = 4;
const MAX_WIDTH = 900;

type OcrPanelProps = {
  onLetters: (letters: string[]) => void;
};

type Point = { x: number; y: number };

type Selection = { x: number; y: number; w: number; h: number };

export default function OcrPanel({ onLetters }: OcrPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = image.width > MAX_WIDTH ? MAX_WIDTH / image.width : 1;
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (selectionStart && selectionEnd) {
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const w = Math.abs(selectionStart.x - selectionEnd.x);
      const h = Math.abs(selectionStart.y - selectionEnd.y);
      ctx.save();
      ctx.strokeStyle = '#f6c26b';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }, [image, selectionStart, selectionEnd]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setSelection(null);
        setSelectionStart(null);
        setSelectionEnd(null);
        setStatus('');
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(point);
      setSelectionEnd(null);
      setSelection(null);
      setStatus('Selection started. Click again to finish.');
      return;
    }

    const x = Math.min(selectionStart.x, point.x);
    const y = Math.min(selectionStart.y, point.y);
    const w = Math.abs(selectionStart.x - point.x);
    const h = Math.abs(selectionStart.y - point.y);
    setSelection({ x, y, w, h });
    setSelectionEnd(point);
    setStatus('Selection complete. Run OCR to extract letters.');
  };

  const getWorker = async () => {
    if (!workerRef.current) {
      const worker = await createWorker({
        logger: (message) => {
          if (message.status === 'recognizing text') {
            setStatus(`OCR progress: ${Math.round(message.progress * 100)}%`);
          }
        },
      });
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      await worker.setParameters({ tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' });
      workerRef.current = worker;
    }
    return workerRef.current;
  };

  const runOcr = async () => {
    if (!image || !selection || !canvasRef.current) {
      alert('Upload a screenshot and drag to select the 4x4 grid area first.');
      return;
    }
    if (selection.w < 10 || selection.h < 10) {
      alert('Selection is too small.');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setRunning(true);
    setStatus('Running OCR...');

    const offscreen = document.createElement('canvas');
    offscreen.width = selection.w;
    offscreen.height = selection.h;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.drawImage(
      canvas,
      selection.x,
      selection.y,
      selection.w,
      selection.h,
      0,
      0,
      selection.w,
      selection.h
    );

    const cellWidth = selection.w / GRID_SIZE;
    const cellHeight = selection.h / GRID_SIZE;

    const letters: string[] = [];
    const worker = await getWorker();

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const cellCanvas = document.createElement('canvas');
        cellCanvas.width = cellWidth;
        cellCanvas.height = cellHeight;
        const cellCtx = cellCanvas.getContext('2d');
        if (!cellCtx) continue;

        cellCtx.drawImage(
          offscreen,
          col * cellWidth,
          row * cellHeight,
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight
        );

        const imgData = cellCtx.getImageData(0, 0, cellWidth, cellHeight);
        for (let i = 0; i < imgData.data.length; i += 4) {
          const avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
          const val = avg > 150 ? 255 : 0;
          imgData.data[i] = val;
          imgData.data[i + 1] = val;
          imgData.data[i + 2] = val;
        }
        cellCtx.putImageData(imgData, 0, 0);

        const result = await worker.recognize(cellCanvas);
        const text = result.data.text.toUpperCase().replace(/[^A-Z]/g, '');
        letters.push(text[0] || '');
        setStatus(`OCR progress: ${letters.length}/16`);
      }
    }

    onLetters(letters);
    setStatus('OCR complete. You can edit any letters and click Solve.');
    setRunning(false);
  };

  return (
    <section className="panel">
      <h2>Screenshot OCR</h2>
      <div className="ocr">
        <div className="ocr-controls">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button onClick={runOcr} disabled={!image || running}>Run OCR</button>
          <p className="hint">Tip: after upload, click once to start the grid box and click again to finish it, then run OCR.</p>
        </div>
        <div className="ocr-canvas-wrap">
          <canvas ref={canvasRef} onClick={handleCanvasClick} />
        </div>
        <div className="status">{status}</div>
      </div>
    </section>
  );
}
