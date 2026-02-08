import { Box, Typography } from '@mui/material';

export default function Header() {
  return (
    <Box component="header" className="hero">
      <Box>
        <Typography variant="h3" component="h1">
          Word Hunt Solver
        </Typography>
        <Typography variant="body1">
          Upload a screenshot or type letters to solve a 4x4 Word Hunt board.
        </Typography>
      </Box>
    </Box>
  );
}
