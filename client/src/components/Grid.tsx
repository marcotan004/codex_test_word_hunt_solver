type GridProps = {
  grid: string[];
  activePath: number[];
  onChange: (grid: string[]) => void;
};

export default function Grid({ grid, onChange, activePath }: GridProps) {
  const handleInput = (index: number, value: string) => {
    const next = value.toUpperCase().replace(/[^A-Z]/g, '');
    const newGrid = [...grid];
    newGrid[index] = next;
    onChange(newGrid);
  };

  return (
    <div className="grid">
      {grid.map((value, index) => (
        <div
          key={index}
          className={`cell ${activePath.includes(index) ? 'active' : ''}`}
        >
          <input
            value={value}
            maxLength={1}
            onChange={(event) => handleInput(index, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
