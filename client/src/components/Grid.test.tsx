import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Grid from './Grid';

const makeGrid = () => Array(16).fill('');

describe('Grid', () => {
  it('uppercases input and calls onChange', () => {
    const onChange = vi.fn();
    render(<Grid grid={makeGrid()} activePath={[]} onChange={onChange} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextGrid = onChange.mock.calls[0][0] as string[];
    expect(nextGrid[0]).toBe('A');
  });
});
