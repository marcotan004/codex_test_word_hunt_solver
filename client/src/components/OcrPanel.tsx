import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { createWorker, type Worker } from 'tesseract.js';
import workerPath from 'tesseract.js/dist/worker.min.js?url';
import corePath from 'tesseract.js-core/tesseract-core.wasm.js?url';
import { featureFlags } from '../lib/featureFlags';

const GRID_SIZE = 4;
const MAX_WIDTH = 900;
const CALIBRATION_KEY = 'wordhunt-ocr-grid-v1';
const OCR_CELL_TIMEOUT_MS = 15000;
const OCR_WORKER_TIMEOUT_MS = 45000;
const DEBUG_TICK_MS = 500;

type OcrPanelProps = {
  onLetters: (letters: string[]) => void;
};

type Point = { x: number; y: number };

type Selection = { x: number; y: number; w: number; h: number };
type Calibration = { x: number; y: number; w: number; h: number };
type CellMetric = {
  letter: string;
  confidence: number | null;
};
type DebugInfo = {
  total: number;
  current: number;
  startedAt: number;
  cellStartedAt: number;
  lastStatus: string;
  lastProgress: number | null;
  lastLogAt: number | null;
  timeouts: number;
  stage: string;
  stageStartedAt: number;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function loadCalibration(): Calibration | null {
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Calibration>;
    if (
      typeof parsed.x !== 'number' ||
      typeof parsed.y !== 'number' ||
      typeof parsed.w !== 'number' ||
      typeof parsed.h !== 'number'
    ) {
      return null;
    }
    return {
      x: clamp01(parsed.x),
      y: clamp01(parsed.y),
      w: clamp01(parsed.w),
      h: clamp01(parsed.h),
    };
  } catch {
    return null;
  }
}

function saveCalibration(calibration: Calibration) {
  localStorage.setItem(CALIBRATION_KEY, JSON.stringify(calibration));
}

function clearCalibration() {
  localStorage.removeItem(CALIBRATION_KEY);
}

function rectFromPoints(a: Point, b: Point): Selection {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: number | null = null;
  try {
    return await new Promise<T>((resolve, reject) => {
      timer = window.setTimeout(() => reject(new Error('OCR worker timed out')), timeoutMs);
      promise.then(resolve).catch(reject);
    });
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

export default function OcrPanel({ onLetters }: OcrPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [cellMetrics, setCellMetrics] = useState<CellMetric[]>([]);
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [debugTick, setDebugTick] = useState(0);
  const showDebug = featureFlags.ocrDebug && import.meta.env.DEV;
  const now = showDebug ? Date.now() + debugTick * 0 : Date.now();

  const getScale = useCallback((img: HTMLImageElement) => {
    return img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
  }, []);

  const toCanvasSelection = useCallback((img: HTMLImageElement, cal: Calibration): Selection => {
    const scale = getScale(img);
    const width = img.width * scale;
    const height = img.height * scale;
    return {
      x: cal.x * width,
      y: cal.y * height,
      w: cal.w * width,
      h: cal.h * height,
    };
  }, [getScale]);

  const toCalibration = useCallback((img: HTMLImageElement, rect: Selection): Calibration => {
    const scale = getScale(img);
    const width = img.width * scale;
    const height = img.height * scale;
    return {
      x: clamp01(rect.x / width),
      y: clamp01(rect.y / height),
      w: clamp01(rect.w / width),
      h: clamp01(rect.h / height),
    };
  }, [getScale]);

  const applyCalibration = useCallback((img: HTMLImageElement, cal: Calibration) => {
    const rect = toCanvasSelection(img, cal);
    setSelection(rect);
    setSelectionStart({ x: rect.x, y: rect.y });
    setSelectionEnd({ x: rect.x + rect.w, y: rect.y + rect.h });
    setStatus('Using saved grid position. Run OCR or click to reselect the full 4x4 board.');
  }, [toCanvasSelection]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = getScale(image);
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    let rect: Selection | null = null;
    if (selectionStart && selectionEnd) {
      rect = rectFromPoints(selectionStart, selectionEnd);
    } else if (selection) {
      rect = selection;
    }

    if (rect) {
      ctx.save();
      ctx.strokeStyle = '#f6c26b';
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
  }, [image, selectionStart, selectionEnd, selection, getScale]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    setCalibration(loadCalibration());
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!showDebug || !running) return;
    const id = window.setInterval(() => {
      setDebugTick((tick) => tick + 1);
    }, DEBUG_TICK_MS);
    return () => window.clearInterval(id);
  }, [showDebug, running]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setSelection(null);
        setSelectionStart(null);
        setSelectionEnd(null);
        setCellMetrics([]);
        setDebugInfo(null);
        const saved = loadCalibration();
        setCalibration(saved);
        if (saved) {
          applyCalibration(img, saved);
        } else {
          setStatus('Image loaded. Select the full 4x4 board (not a single letter) and run OCR.');
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const getCanvasPoint = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsSelecting(true);
    setSelectionStart(point);
    setSelectionEnd(point);
    setSelection(null);
    setStatus('Selecting... drag to cover the full 4x4 board.');
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isSelecting) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    setSelectionEnd(point);
    if (selectionStart) {
      setSelection(rectFromPoints(selectionStart, point));
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isSelecting || !selectionStart) return;
    const point = getCanvasPoint(event) ?? selectionStart;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsSelecting(false);

    const rect = rectFromPoints(selectionStart, point);

    if (rect.w < 10 || rect.h < 10) {
      setSelection(null);
      setSelectionEnd(null);
      setStatus('Selection too small. Click and drag to cover the full 4x4 board.');
      return;
    }

    setSelection(rect);
    setSelectionEnd(point);
    setStatus('Selection complete. Run OCR to extract letters from the full board.');
  };

  const handlePointerLeave = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isSelecting) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsSelecting(false);
  };

  const getWorker = async () => {
    if (!workerRef.current) {
      if (showDebug) {
        const now = Date.now();
        setDebugInfo((info) => (info ? {
          ...info,
          stage: 'Creating worker',
          stageStartedAt: now,
        } : info));
      }
      setStatus('Loading OCR engine (first run can take 10-30s)...');
      const worker = await withTimeout(
        createWorker({
          workerPath,
          corePath,
          logger: (message) => {
            if (showDebug) {
              setDebugInfo((info) => (info ? {
                ...info,
                lastStatus: message.status,
              lastProgress: typeof message.progress === 'number' ? message.progress : null,
              lastLogAt: Date.now(),
            } : info));
          }
          if (message.status === 'recognizing text') {
            setStatus(`OCR progress: ${Math.round(message.progress * 100)}%`);
          }
        },
        }),
        OCR_WORKER_TIMEOUT_MS
      );
      if (showDebug) {
        const now = Date.now();
        setDebugInfo((info) => (info ? { ...info, stage: 'Loading language', stageStartedAt: now } : info));
      }
      await withTimeout(worker.loadLanguage('eng'), OCR_WORKER_TIMEOUT_MS);
      if (showDebug) {
        const now = Date.now();
        setDebugInfo((info) => (info ? { ...info, stage: 'Initializing', stageStartedAt: now } : info));
      }
      await withTimeout(worker.initialize('eng'), OCR_WORKER_TIMEOUT_MS);
      await worker.setParameters({ tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' });
      if (showDebug) {
        const now = Date.now();
        setDebugInfo((info) => (info ? { ...info, stage: 'Ready', stageStartedAt: now } : info));
      }
      workerRef.current = worker;
    }
    return workerRef.current;
  };

  const recognizeWithTimeout = async (worker: Worker, canvas: HTMLCanvasElement, timeoutMs: number) => {
    let timer: number | null = null;
    return await new Promise<{ result: any | null; timedOut: boolean }>((resolve) => {
      timer = window.setTimeout(() => resolve({ result: null, timedOut: true }), timeoutMs);
      worker.recognize(canvas)
        .then((result) => {
          if (timer) window.clearTimeout(timer);
          resolve({ result, timedOut: false });
        })
        .catch(() => {
          if (timer) window.clearTimeout(timer);
          resolve({ result: null, timedOut: false });
        });
    });
  };

  const runOcr = async () => {
    if (!image || !canvasRef.current) {
      alert('Upload a screenshot and drag to select the 4x4 grid area first.');
      return;
    }
    const rect = selection ?? (selectionStart && selectionEnd ? rectFromPoints(selectionStart, selectionEnd) : null);
    if (!rect) {
      alert('Upload a screenshot and drag to select the 4x4 grid area first.');
      return;
    }
    if (rect.w < 10 || rect.h < 10) {
      alert('Selection is too small.');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setRunning(true);
    setStatus('Running OCR...');
    if (showDebug) {
      const now = Date.now();
      setDebugInfo({
        total: GRID_SIZE * GRID_SIZE,
        current: 0,
        startedAt: now,
        cellStartedAt: now,
        lastStatus: '',
        lastProgress: null,
        lastLogAt: null,
        timeouts: 0,
        stage: 'Starting',
        stageStartedAt: now,
      });
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = rect.w;
    offscreen.height = rect.h;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.drawImage(
      canvas,
      rect.x,
      rect.y,
      rect.w,
      rect.h,
      0,
      0,
      rect.w,
      rect.h
    );

    const cellWidth = rect.w / GRID_SIZE;
    const cellHeight = rect.h / GRID_SIZE;

    const letters: string[] = [];
    const metrics: CellMetric[] = [];
    let worker: Worker;
    try {
      worker = await getWorker();
    } catch (error) {
      setRunning(false);
      const message = error instanceof Error ? error.message : 'OCR worker failed to load';
      setStatus(`${message}. Check network access and reload.`);
      return;
    }
    let cellIndex = 0;

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        cellIndex += 1;
        if (showDebug) {
          setDebugInfo((info) => (info ? {
            ...info,
            current: cellIndex,
            cellStartedAt: Date.now(),
            stage: 'Recognizing',
            stageStartedAt: Date.now(),
          } : info));
        }

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

        const { result, timedOut } = await recognizeWithTimeout(worker, cellCanvas, OCR_CELL_TIMEOUT_MS);
        if (timedOut) {
          setStatus(`OCR timed out on cell ${cellIndex}/${GRID_SIZE * GRID_SIZE}. Continuing...`);
          if (showDebug) {
            setDebugInfo((info) => (info ? { ...info, timeouts: info.timeouts + 1 } : info));
          }
          try {
            await worker.terminate();
          } catch {
            // ignore termination errors
          }
          workerRef.current = null;
          worker = await getWorker();
          letters.push('');
          metrics.push({ letter: '', confidence: null });
          continue;
        }

        if (!result) {
          letters.push('');
          metrics.push({ letter: '', confidence: null });
          setStatus(`OCR progress: ${letters.length}/16`);
          continue;
        }

        const text = result.data.text.toUpperCase().replace(/[^A-Z]/g, '');
        const letter = text[0] || '';
        const symbol = result.data.symbols?.[0];
        const confidence = typeof symbol?.confidence === 'number'
          ? symbol.confidence
          : typeof result.data.confidence === 'number'
            ? result.data.confidence
            : null;
        letters.push(letter);
        metrics.push({ letter, confidence });
        setStatus(`OCR progress: ${letters.length}/16`);
      }
    }

    onLetters(letters);
    setCellMetrics(metrics);
    setStatus('OCR complete. You can edit any letters and click Solve.');
    setRunning(false);
  };

  const handleSaveCalibration = () => {
    if (!image || !selection) return;
    const next = toCalibration(image, selection);
    saveCalibration(next);
    setCalibration(next);
    setStatus('Saved grid position. Future uploads will auto-select the board.');
  };

  const handleApplySaved = () => {
    if (!image || !calibration) return;
    applyCalibration(image, calibration);
  };

  const handleClearSaved = () => {
    clearCalibration();
    setCalibration(null);
    setStatus('Saved grid position cleared.');
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
          <button onClick={handleSaveCalibration} disabled={!image || !selection || running}>
            Save grid position
          </button>
          {calibration ? (
            <button onClick={handleApplySaved} disabled={!image || running}>
              Use saved grid
            </button>
          ) : null}
          {calibration ? (
            <button onClick={handleClearSaved} disabled={running}>
              Clear saved grid
            </button>
          ) : null}
          <p className="hint">
            Tip: select the whole 4x4 board (not a single letter). Click and drag to draw the box, then run OCR.
          </p>
        </div>
        <div className="ocr-canvas-wrap">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
          />
        </div>
        <div className="status">{status}</div>
        {showDebug && debugInfo ? (
          <div className="ocr-debug">
            <div className="ocr-debug-title">Dev: OCR debug</div>
            <div className="ocr-debug-stats">
              <div>Stage: {debugInfo.stage} ({((now - debugInfo.stageStartedAt) / 1000).toFixed(1)}s)</div>
              <div>Cell: {debugInfo.current}/{debugInfo.total}</div>
              <div>Elapsed: {((now - debugInfo.startedAt) / 1000).toFixed(1)}s</div>
              <div>Cell time: {((now - debugInfo.cellStartedAt) / 1000).toFixed(1)}s</div>
              <div>
                Last worker: {debugInfo.lastStatus || 'n/a'}
                {debugInfo.lastProgress == null ? '' : ` (${Math.round(debugInfo.lastProgress * 100)}%)`}
              </div>
              <div>Timeouts: {debugInfo.timeouts}</div>
            </div>
            {cellMetrics.length === GRID_SIZE * GRID_SIZE ? (
              <div className="ocr-debug-grid">
                {cellMetrics.map((item, index) => (
                  <div key={index} className="ocr-debug-cell">
                    <div className="ocr-debug-letter">{item.letter || '∅'}</div>
                    <div className="ocr-debug-confidence">
                      {item.confidence == null ? 'n/a' : `${Math.round(item.confidence)}%`}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
