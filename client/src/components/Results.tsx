import type { SolveResult } from '../lib/api';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';

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
    <Paper elevation={3} className="panel" component="section">
      <Typography variant="h6" gutterBottom>
        Results
      </Typography>
      <Box className="results">
        <Box className="result-controls">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="sort-by-label">Sort by</InputLabel>
            <Select
              labelId="sort-by-label"
              label="Sort by"
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value)}
            >
              <MenuItem value="score">Score</MenuItem>
              <MenuItem value="length">Length</MenuItem>
              <MenuItem value="alpha">Alphabetical</MenuItem>
              <MenuItem value="position">Board Position</MenuItem>
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1} className="result-actions">
            <Button variant="outlined" onClick={onPlay} disabled={isAnimating || results.length === 0}>
              Play Top 20
            </Button>
            <Button variant="outlined" onClick={onStop} disabled={!isAnimating}>
              Stop
            </Button>
          </Stack>

          <Box className="totals">
            <span>{results.length} words</span>
            <span>Score: {totalScore}</span>
          </Box>
        </Box>

        <Box className="results-list">
          {results.map((item) => (
            <Box
              key={item.word}
              className="result-row"
              onMouseEnter={() => {
                if (!isAnimating) onHover(item.path);
              }}
              onMouseLeave={() => onHover([])}
              onClick={() => onHover(item.path)}
            >
              <span>{item.word}</span>
              <span>{item.length}</span>
              <span>{item.score}</span>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
