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
