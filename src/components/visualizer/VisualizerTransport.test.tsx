import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisualizerTransport from './VisualizerTransport';
import { usePlayerStore } from '../../stores/playerStore';
import type { Song } from '../../types/subsonic';

// Mock PlaybackManager so the component's getVolume()/seek()/volume calls never
// load the real PlaybackManager → SubsonicClient chain (which can resolve after
// Vitest teardown). Same rationale as playerStore.test.ts.
const setVolume = vi.fn();
const toggleMute = vi.fn();
const seek = vi.fn();
vi.mock('../../audio/PlaybackManager', () => ({
  getPlaybackManager: () => ({
    getVolume: () => 1,
    setVolume,
    toggleMute,
    seek,
    pauseRadio: () => {},
    resumeRadio: () => {},
  }),
}));

// Stub the heavy children — they pull in canvas / network / IntersectionObserver
// not relevant to the transport's own logic, and are covered elsewhere.
vi.mock('../common/CoverArt', () => ({ default: () => <div data-testid="cover" /> }));
vi.mock('../player/WaveformSeekbar', () => ({ default: () => <div data-testid="seekbar" /> }));

const makeSong = (id: string, title = `Song ${id}`): Song => ({
  id,
  title,
  artist: `Artist ${id}`,
  album: 'Test Album',
  duration: 180,
});

beforeEach(() => {
  setVolume.mockClear();
  toggleMute.mockClear();
  seek.mockClear();
  usePlayerStore.setState({
    queue: [],
    currentIndex: -1,
    currentSong: null,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    radioMode: null,
    radioPlaying: false,
    repeatMode: 'off',
    shuffleEnabled: false,
    shuffleOrder: [],
  });
});

describe('VisualizerTransport', () => {
  it('renders nothing when there is no current song or radio', () => {
    const { container } = render(<VisualizerTransport onInteract={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current track title and artist', () => {
    const song = makeSong('1', 'Song One');
    usePlayerStore.setState({ queue: [song], currentIndex: 0, currentSong: song });
    render(<VisualizerTransport onInteract={() => {}} />);
    expect(screen.getByText('Song One')).toBeInTheDocument();
    expect(screen.getByText('Artist 1')).toBeInTheDocument();
  });

  it('toggles play state and fires onInteract on play/pause (reusing the store action)', () => {
    const song = makeSong('1', 'One');
    usePlayerStore.setState({ queue: [song], currentIndex: 0, currentSong: song, isPlaying: false });
    const onInteract = vi.fn();
    render(<VisualizerTransport onInteract={onInteract} />);
    fireEvent.click(screen.getByLabelText('Play'));
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    // Fires from the button handler and again as the click bubbles to the
    // wrapper (which wakes the overlay) — both wake the timer, which is fine.
    expect(onInteract).toHaveBeenCalled();
  });

  it('advances to the next track via the existing store action', () => {
    const queue = [makeSong('1', 'One'), makeSong('2', 'Two')];
    usePlayerStore.setState({ queue, currentIndex: 0, currentSong: queue[0] });
    render(<VisualizerTransport onInteract={() => {}} />);
    fireEvent.click(screen.getByLabelText('Next track'));
    expect(usePlayerStore.getState().currentSong?.title).toBe('Two');
  });

  it('goes to the previous track via the existing store action', () => {
    const queue = [makeSong('1', 'One'), makeSong('2', 'Two')];
    usePlayerStore.setState({ queue, currentIndex: 1, currentSong: queue[1], positionMs: 0 });
    render(<VisualizerTransport onInteract={() => {}} />);
    fireEvent.click(screen.getByLabelText('Previous track'));
    expect(usePlayerStore.getState().currentSong?.title).toBe('One');
  });

  it('mutes via the existing PlaybackManager API', () => {
    const song = makeSong('1', 'One');
    usePlayerStore.setState({ queue: [song], currentIndex: 0, currentSong: song });
    render(<VisualizerTransport onInteract={() => {}} />);
    fireEvent.click(screen.getByLabelText('Mute'));
    expect(toggleMute).toHaveBeenCalledTimes(1);
  });
});
