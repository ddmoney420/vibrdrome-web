import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PresetSearch from './PresetSearch';

const NAMES = ['Alpha Bloom', 'Beta Wave', 'Gamma Spiral', 'Zebra Target'];

// Render helper that fills in favorites props (index-based keys) with overrides.
function renderSearch(over: Partial<React.ComponentProps<typeof PresetSearch>> = {}) {
  const props: React.ComponentProps<typeof PresetSearch> = {
    names: NAMES,
    favoriteKeys: new Set<string>(),
    favoriteKeyForIndex: (i: number) => `fav:${i}`,
    onToggleFavorite: () => {},
    onSelect: () => {},
    onClose: () => {},
    ...over,
  };
  return render(<PresetSearch {...props} />);
}

describe('PresetSearch', () => {
  it('caps rendered results and shows a refine hint when there are more matches', () => {
    const many = Array.from({ length: 120 }, (_, i) => `Preset ${i}`);
    renderSearch({ names: many });
    expect(screen.getAllByRole('option')).toHaveLength(50);
    expect(screen.getByText(/Showing 50 of 120/)).toBeInTheDocument();
  });

  it('maps a fuzzy-sorted result back to its ORIGINAL index on click', () => {
    const onSelect = vi.fn();
    renderSearch({ onSelect });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zebra' } });
    fireEvent.click(screen.getByText('Zebra Target'));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it('shows a no-match state', () => {
    renderSearch();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'qqqzzz-nomatch' } });
    expect(screen.getByText('No matching presets')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('selects the highlighted result with ArrowDown + Enter (original index)', () => {
    const onSelect = vi.fn();
    renderSearch({ onSelect });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    const options = screen.getAllByRole('option');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    const chosenName = options[1].textContent ?? '';
    // textContent includes the star glyph; match the name prefix back to NAMES.
    const idx = NAMES.findIndex((n) => chosenName.startsWith(n));
    expect(onSelect).toHaveBeenCalledWith(idx);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    renderSearch({ onClose });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  // --- favorites ---

  it('a row star toggles the correct key and does NOT select the row', () => {
    const onToggleFavorite = vi.fn();
    const onSelect = vi.fn();
    renderSearch({ onToggleFavorite, onSelect });
    // Empty query lists all in order; row 0 = Alpha Bloom (original index 0).
    const star = screen.getAllByLabelText('Favorite preset')[0];
    fireEvent.click(star);
    expect(onToggleFavorite).toHaveBeenCalledWith('fav:0');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reflects favorited state (filled star + Unfavorite label)', () => {
    renderSearch({ favoriteKeys: new Set(['fav:2']) });
    // Exactly one row is favorited → one "Unfavorite preset" button.
    expect(screen.getAllByLabelText('Unfavorite preset')).toHaveLength(1);
  });

  it('Favorites filter shows only favorited rows, and selecting returns the original index', () => {
    const onSelect = vi.fn();
    renderSearch({ favoriteKeys: new Set(['fav:2']), onSelect });
    fireEvent.click(screen.getByLabelText('Show favorites only'));
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toMatch(/Gamma Spiral/);
    fireEvent.click(options[0]);
    expect(onSelect).toHaveBeenCalledWith(2); // original index, not filtered position
  });

  it('Favorites filter with no favorites shows an empty favorites state', () => {
    renderSearch({ favoriteKeys: new Set() });
    fireEvent.click(screen.getByLabelText('Show favorites only'));
    expect(screen.getByText('No favorited presets yet')).toBeInTheDocument();
  });

  // --- orphan cleanup affordance ---

  it('hides the cleanup affordance when orphanCount is 0 or omitted', () => {
    const { rerender } = renderSearch();
    expect(screen.queryByText('Clean up unavailable')).not.toBeInTheDocument();
    rerender(
      <PresetSearch
        names={NAMES}
        favoriteKeys={new Set()}
        favoriteKeyForIndex={(i) => `fav:${i}`}
        onToggleFavorite={() => {}}
        onSelect={() => {}}
        onClose={() => {}}
        orphanCount={0}
      />,
    );
    expect(screen.queryByText('Clean up unavailable')).not.toBeInTheDocument();
  });

  it('shows a singular count label', () => {
    renderSearch({ orphanCount: 1, engineLabel: 'projectM' });
    expect(screen.getByText('1 unavailable favorite')).toBeInTheDocument();
    expect(screen.getByText('Clean up unavailable')).toBeInTheDocument();
  });

  it('shows a plural count label', () => {
    renderSearch({ orphanCount: 3, engineLabel: 'projectM' });
    expect(screen.getByText('3 unavailable favorites')).toBeInTheDocument();
  });

  it('clicking "Clean up unavailable" reveals the confirmation and does NOT delete', () => {
    const onCleanupOrphans = vi.fn();
    renderSearch({ orphanCount: 1, engineLabel: 'projectM', onCleanupOrphans });
    fireEvent.click(screen.getByText('Clean up unavailable'));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(onCleanupOrphans).not.toHaveBeenCalled(); // first click never deletes
  });

  it('confirmation text includes the engine label and count', () => {
    renderSearch({ orphanCount: 2, engineLabel: 'projectM' });
    fireEvent.click(screen.getByText('Clean up unavailable'));
    expect(
      screen.getByText(/Remove 2 unavailable projectM favorites from this device\?/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/only removes favorites that no longer match the loaded preset list/),
    ).toBeInTheDocument();
  });

  it('Cancel hides the confirmation and calls nothing', () => {
    const onCleanupOrphans = vi.fn();
    renderSearch({ orphanCount: 1, engineLabel: 'projectM', onCleanupOrphans });
    fireEvent.click(screen.getByText('Clean up unavailable'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCleanupOrphans).not.toHaveBeenCalled();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    expect(screen.getByText('Clean up unavailable')).toBeInTheDocument(); // back to the affordance
  });

  it('Remove calls onCleanupOrphans exactly once', () => {
    const onCleanupOrphans = vi.fn();
    renderSearch({ orphanCount: 1, engineLabel: 'projectM', onCleanupOrphans });
    fireEvent.click(screen.getByText('Clean up unavailable'));
    fireEvent.click(screen.getByText('Remove'));
    expect(onCleanupOrphans).toHaveBeenCalledTimes(1);
  });

  it('keeps normal row-star behavior unchanged when the cleanup affordance is present', () => {
    const onToggleFavorite = vi.fn();
    renderSearch({ orphanCount: 1, engineLabel: 'projectM', onToggleFavorite });
    fireEvent.click(screen.getAllByLabelText('Favorite preset')[0]);
    expect(onToggleFavorite).toHaveBeenCalledWith('fav:0');
  });
});
