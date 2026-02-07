import { useMemo, useState } from 'react';
import './App.css';
import { solveBoard, type SolveResult } from './lib/api';
import Header from './components/Header';
import Grid from './components/Grid';
import OcrPanel from './components/OcrPanel';
import Results from './components/Results';

const GRID_SIZE = 4;
const initialGrid = Array(GRID_SIZE * GRID_SIZE).fill('');

function App() {
  const [grid, setGrid] = useState<string[]>(initialGrid);
  const [results, setResults] = useState<SolveResult[]>([]);
  const [sortBy, setSortBy] = useState('score');
  const [activePath, setActivePath] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

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
  };

  return (
    <div className="app">
      <Header />
      <section className="panel">
        <h2>Board</h2>
        <div className="board">
          <Grid grid={grid} activePath={activePath} onChange={setGrid} />
          <div className="grid-actions">
            <button onClick={handleClear}>Clear</button>
            <button onClick={handleSolve} disabled={loading}>Solve</button>
          </div>
        </div>
      </section>

      <OcrPanel
        onLetters={(letters) => {
          setGrid(letters);
        }}
      />

      <Results
        results={sortedResults}
        totalScore={totalScore}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onHover={setActivePath}
      />
    </div>
  );
}

export default App;
