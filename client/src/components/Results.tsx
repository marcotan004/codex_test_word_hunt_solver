import type { SolveResult } from '../lib/api';

type ResultsProps = {
  results: SolveResult[];
  totalScore: number;
  sortBy: string;
  onSortChange: (value: string) => void;
  onHover: (path: number[]) => void;
};

export default function Results({
  results,
  totalScore,
  sortBy,
  onSortChange,
  onHover,
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
            </select>
          </label>
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
