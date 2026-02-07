import { useMemo, useRef, useState } from 'react';
import './App.css';
import { solveBoard, type SolveResult } from './lib/api';
import Header from './components/Header';
import Grid from './components/Grid';
import OcrPanel from './components/OcrPanel';
import Results from './components/Results';
import { featureFlags } from './lib/featureFlags';

const GRID_SIZE = 4;
const initialGrid = Array(GRID_SIZE * GRID_SIZE).fill('');

function App() {
  const [grid, setGrid] = useState<string[]>(initialGrid);
  const [results, setResults] = useState<SolveResult[]>([]);
  const [sortBy, setSortBy] = useState('score');
  const [activePath, setActivePath] = useState<number[]>([]);
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  const sortedResults = useMemo(() => {
    const items = [...results];
    if (sortBy === 'score') {
      items.sort((a, b) => b.score - a.score || b.length - a.length || a.word.localeCompare(b.word));
    } else if (sortBy === 'length') {
      items.sort((a, b) => b.length - a.length || b.score - a.score || a.word.localeCompare(b.word));
    } else {
      items.sort((a, b) => a.word.localeCompare(b.word));
    }
    return items;
  }, [results, sortBy]);

  const totalScore = useMemo(() => {
    return results.reduce((sum, item) => sum + item.score, 0);
  }, [results]);

  const handleSolve = async () => {
    if (grid.some((ch) => !ch)) {
      alert('Please fill all 16 letters.');
      return;
    }

    setLoading(true);
    try {
      const response = await solveBoard(grid);
      setResults(response.results ?? []);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message || 'Failed to solve board.');
      } else {
        alert('Failed to solve board.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setGrid(initialGrid);
    setResults([]);
    setActivePath([]);
    setCursorIndex(null);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
    setCursorIndex(null);
  };

  const startAnimation = () => {
    if (results.length === 0 || isAnimating) return;

    const topWords = [...results]
      .sort((a, b) => b.score - a.score || b.length - a.length || a.word.localeCompare(b.word))
      .slice(0, 20);

    if (topWords.length === 0) return;

    const totalDuration = 10000;
    const perWord = totalDuration / topWords.length;
    const frames: { t: number; path: number[]; cursor: number }[] = [];
    let t = 0;

    topWords.forEach((word) => {
      const steps = Math.max(1, word.path.length);
      const stepDuration = perWord / steps;
      for (let i = 1; i <= steps; i += 1) {
        t += stepDuration;
        frames.push({
          t,
          path: word.path.slice(0, i),
          cursor: word.path[i - 1],
        });
      }
    });

    if (!frames.length) return;

    stopAnimation();
    setActivePath([]);
    setIsAnimating(true);

    const startTime = performance.now();
    let index = 0;
    const total = frames[frames.length - 1].t;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      while (index < frames.length - 1 && elapsed >= frames[index].t) {
        index += 1;
      }
      const frame = frames[index];
      setActivePath(frame.path);
      setCursorIndex(frame.cursor);

      if (elapsed < total) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        stopAnimation();
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  };

  return (
    <div className="app">
      <Header />
      <section className="panel">
        <h2>Board</h2>
        <div className="board">
          <Grid grid={grid} activePath={activePath} cursorIndex={cursorIndex} onChange={setGrid} />
          <div className="grid-actions">
            <button onClick={handleClear}>Clear</button>
            <button onClick={handleSolve} disabled={loading}>Solve</button>
          </div>
        </div>
      </section>

      {featureFlags.ocr ? (
        <OcrPanel
          onLetters={(letters) => {
            setGrid(letters);
          }}
        />
      ) : null}

      <Results
        results={sortedResults}
        totalScore={totalScore}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onHover={(path) => {
          if (!isAnimating) setActivePath(path);
        }}
        onPlay={startAnimation}
        onStop={stopAnimation}
        isAnimating={isAnimating}
      />
    </div>
  );
}

export default App;
