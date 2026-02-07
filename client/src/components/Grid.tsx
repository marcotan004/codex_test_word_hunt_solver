import { useLayoutEffect, useRef } from 'react';

type GridProps = {
  grid: string[];
  activePath: number[];
  cursorIndex?: number | null;
  onChange: (grid: string[]) => void;
};

export default function Grid({ grid, onChange, activePath, cursorIndex }: GridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleInput = (index: number, value: string) => {
    const next = value.toUpperCase().replace(/[^A-Z]/g, '');
    const newGrid = [...grid];
    newGrid[index] = next;
    onChange(newGrid);
  };

  useLayoutEffect(() => {
    const gridEl = gridRef.current;
    const canvas = canvasRef.current;
    if (!gridEl || !canvas) return;

    const rect = gridEl.getBoundingClientRect();
    const styles = window.getComputedStyle(gridEl);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    const cellSize = (rect.width - gap * 3) / 4;

    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activePath.length === 0) return;

    const points = activePath.map((idx) => {
      const row = Math.floor(idx / 4);
      const col = idx % 4;
      const x = col * (cellSize + gap) + cellSize / 2;
      const y = row * (cellSize + gap) + cellSize / 2;
      return { x, y };
    });

    ctx.save();
    ctx.strokeStyle = '#f6c26b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();

    if (cursorIndex != null) {
      const row = Math.floor(cursorIndex / 4);
      const col = cursorIndex % 4;
      const x = col * (cellSize + gap) + cellSize / 2;
      const y = row * (cellSize + gap) + cellSize / 2;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2f5f3e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }, [activePath, cursorIndex]);

  return (
    <div className="grid-wrap">
      <canvas ref={canvasRef} className="grid-canvas" />
      <div ref={gridRef} className="grid">
        {grid.map((value, index) => (
          <div
            key={index}
            className={`cell ${activePath.includes(index) ? 'active' : ''} ${cursorIndex === index ? 'cursor' : ''}`}
          >
            <input
              value={value}
              maxLength={1}
              onChange={(event) => handleInput(index, event.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
