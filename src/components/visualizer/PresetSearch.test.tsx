import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PresetSearch from './PresetSearch';

const NAMES = ['Alpha Bloom', 'Beta Wave', 'Gamma Spiral', 'Zebra Target'];

describe('PresetSearch', () => {
  it('caps rendered results and shows a refine hint when there are more matches', () => {
    const many = Array.from({ length: 120 }, (_, i) => `Preset ${i}`);
    render(<PresetSearch names={many} onSelect={() => {}} onClose={() => {}} />);
    // Empty query lists all, but only the first 50 rows are rendered.
    expect(screen.getAllByRole('option')).toHaveLength(50);
    expect(screen.getByText(/Showing 50 of 120/)).toBeInTheDocument();
  });

  it('maps a fuzzy-sorted result back to its ORIGINAL index on click', () => {
    const onSelect = vi.fn();
    render(<PresetSearch names={NAMES} onSelect={onSelect} onClose={() => {}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zebra' } });
    fireEvent.click(screen.getByText('Zebra Target'));
    expect(onSelect).toHaveBeenCalledWith(3); // original index in NAMES, not the filtered position
  });

  it('shows a no-match state', () => {
    render(<PresetSearch names={NAMES} onSelect={() => {}} onClose={() => {}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'qqqzzz-nomatch' } });
    expect(screen.getByText('No matching presets')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('selects the highlighted result with ArrowDown + Enter (original index)', () => {
    const onSelect = vi.fn();
    render(<PresetSearch names={NAMES} onSelect={onSelect} onClose={() => {}} />);
    const input = screen.getByRole('textbox');
    // 'a' matches several; highlight starts at 0, ArrowDown moves to the 2nd row.
    fireEvent.change(input, { target: { value: 'a' } });
    const options = screen.getAllByRole('option');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    // The 2nd visible row's text maps back to its original index in NAMES.
    const chosenName = options[1].textContent ?? '';
    expect(onSelect).toHaveBeenCalledWith(NAMES.indexOf(chosenName));
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<PresetSearch names={NAMES} onSelect={() => {}} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
