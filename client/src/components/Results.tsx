import type { SolveResult } from '../lib/api';

type ResultsProps = {
  results: SolveResult[];
  totalScore: number;
  sortBy: string;
  onSortChange: (value: string) => void;
  onHover: (path: number[]) => void;
  onPlay: () => void;
  onStop: () => void;
  isAnimating: boolean;
};

export default function Results({
  results,
  totalScore,
  sortBy,
  onSortChange,
  onHover,
  onPlay,
  onStop,
  isAnimating,
}: ResultsProps) {
  return (
    <section className="panel">
      <h2>Results</h2>
      <div className="results">
        <div className="result-controls">
          <label>
            Sort by
            <select value={sortBy} onChange={(event) => onSortChange(event.target.value)}>
              <option value="score">Score</option>
              <option value="length">Length</option>
              <option value="alpha">Alphabetical</option>
              <option value="position">Board Position</option>
            </select>
          </label>
          <div className="result-actions">
            <button onClick={onPlay} disabled={isAnimating || results.length === 0}>
              Play Top 20
            </button>
            <button onClick={onStop} disabled={!isAnimating}>
              Stop
            </button>
          </div>
          <div className="totals">
            <span>{results.length} words</span>
            <span>Score: {totalScore}</span>
          </div>
        </div>
        <div className="results-list">
          {results.map((item) => (
            <div
              key={item.word}
              className="result-row"
              onMouseEnter={() => onHover(item.path)}
              onMouseLeave={() => onHover([])}
              onClick={() => onHover(item.path)}
            >
              <span>{item.word}</span>
              <span>{item.length}</span>
              <span>{item.score}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
