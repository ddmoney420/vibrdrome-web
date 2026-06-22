import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VisualizerHud from './VisualizerHud';

describe('VisualizerHud', () => {
  it('shows only the preset name in shader mode (engine null, no badges)', () => {
    render(
      <VisualizerHud
        presetName="Plasma"
        engine={null}
        index={1}
        total={6}
        autoAdvance
        shuffle
        frozen
      />,
    );
    expect(screen.getByText('Plasma')).toBeInTheDocument();
    // Status badges are Milkdrop-only — none should render in shader mode.
    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
    expect(screen.queryByText('Shuffle')).not.toBeInTheDocument();
    expect(screen.queryByText('Frozen')).not.toBeInTheDocument();
    expect(screen.queryByText('1 / 6')).not.toBeInTheDocument();
  });

  it('renders engine, position, and active status badges in Milkdrop mode', () => {
    render(
      <VisualizerHud
        presetName="Geiss - Cosmic"
        engine="projectm"
        index={3}
        total={120}
        autoAdvance
        shuffle={false}
        frozen
      />,
    );
    expect(screen.getByText('Geiss - Cosmic')).toBeInTheDocument();
    expect(screen.getByText('projectM')).toBeInTheDocument();
    expect(screen.getByText('3 / 120')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(screen.getByText('Frozen')).toBeInTheDocument();
    // shuffle is off → no Shuffle badge
    expect(screen.queryByText('Shuffle')).not.toBeInTheDocument();
  });

  it('shows the ★ favorite indicator when isFavorite and a Milkdrop preset is shown', () => {
    render(
      <VisualizerHud
        presetName="Geiss - Cosmic"
        engine="projectm"
        index={3}
        total={120}
        autoAdvance={false}
        shuffle={false}
        frozen={false}
        isFavorite
      />,
    );
    const star = screen.getByLabelText('Favorited');
    expect(star).toBeInTheDocument();
    expect(star).toHaveTextContent('★');
    // Name still renders alongside the star.
    expect(screen.getByText('Geiss - Cosmic')).toBeInTheDocument();
  });

  it('does not show the ★ when isFavorite is false or omitted', () => {
    const { rerender } = render(
      <VisualizerHud
        presetName="Geiss - Cosmic"
        engine="projectm"
        index={3}
        total={120}
        autoAdvance={false}
        shuffle={false}
        frozen={false}
        isFavorite={false}
      />,
    );
    expect(screen.queryByLabelText('Favorited')).not.toBeInTheDocument();
    // Omitted prop → defaults to not favorited.
    rerender(
      <VisualizerHud
        presetName="Geiss - Cosmic"
        engine="projectm"
        index={3}
        total={120}
        autoAdvance={false}
        shuffle={false}
        frozen={false}
      />,
    );
    expect(screen.queryByLabelText('Favorited')).not.toBeInTheDocument();
  });

  it('does not show the ★ in shader mode even when isFavorite is true', () => {
    render(
      <VisualizerHud
        presetName="Plasma"
        engine={null}
        index={1}
        total={6}
        autoAdvance={false}
        shuffle={false}
        frozen={false}
        isFavorite
      />,
    );
    expect(screen.queryByLabelText('Favorited')).not.toBeInTheDocument();
    expect(screen.getByText('Plasma')).toBeInTheDocument();
  });

  it('shows the ★ for a favorited butterchurn preset', () => {
    render(
      <VisualizerHud
        presetName="Fallback"
        engine="butterchurn"
        index={1}
        total={50}
        autoAdvance={false}
        shuffle={false}
        frozen={false}
        isFavorite
      />,
    );
    expect(screen.getByLabelText('Favorited')).toBeInTheDocument();
  });

  it('labels the butterchurn engine badge', () => {
    render(
      <VisualizerHud
        presetName="Fallback"
        engine="butterchurn"
        index={1}
        total={50}
        autoAdvance={false}
        shuffle={false}
        frozen={false}
      />,
    );
    expect(screen.getByText('butterchurn')).toBeInTheDocument();
    expect(screen.getByText('1 / 50')).toBeInTheDocument();
  });
});
