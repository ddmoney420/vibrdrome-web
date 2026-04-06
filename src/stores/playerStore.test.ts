import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from './playerStore';

// Reset store between tests
beforeEach(() => {
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
    playbackSpeed: 1.0,
    crossfadeEnabled: false,
    crossfadeDuration: 5,
  });
});

const makeSong = (id: string, title = `Song ${id}`) => ({
  id,
  title,
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
});

describe('playerStore', () => {
  describe('playSongs', () => {
    it('sets queue and current song', () => {
      const songs = [makeSong('1'), makeSong('2'), makeSong('3')];
      usePlayerStore.getState().playSongs(songs as any, 0);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(3);
      expect(state.currentSong?.id).toBe('1');
      expect(state.currentIndex).toBe(0);
      expect(state.isPlaying).toBe(true);
    });

    it('starts at specified index', () => {
      const songs = [makeSong('1'), makeSong('2'), makeSong('3')];
      usePlayerStore.getState().playSongs(songs as any, 2);

      expect(usePlayerStore.getState().currentSong?.id).toBe('3');
      expect(usePlayerStore.getState().currentIndex).toBe(2);
    });

    it('clears radio mode', () => {
      usePlayerStore.setState({ radioMode: { stationId: 'r1', stationName: 'Test', streamUrl: 'http://test' }, radioPlaying: true });
      usePlayerStore.getState().playSongs([makeSong('1')] as any, 0);

      expect(usePlayerStore.getState().radioMode).toBeNull();
      expect(usePlayerStore.getState().radioPlaying).toBe(false);
    });
  });

  describe('next', () => {
    it('advances to next song', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 0);
      usePlayerStore.getState().next();

      expect(usePlayerStore.getState().currentSong?.id).toBe('2');
      expect(usePlayerStore.getState().currentIndex).toBe(1);
    });

    it('stops at end of queue when repeat is off', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2')] as any, 1);
      usePlayerStore.getState().next();

      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it('wraps to beginning when repeat all', () => {
      usePlayerStore.setState({ repeatMode: 'all' });
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2')] as any, 1);
      usePlayerStore.getState().next();

      expect(usePlayerStore.getState().currentSong?.id).toBe('1');
      expect(usePlayerStore.getState().currentIndex).toBe(0);
    });

    it('does nothing on empty queue', () => {
      usePlayerStore.getState().next();
      expect(usePlayerStore.getState().currentSong).toBeNull();
    });
  });

  describe('previous', () => {
    it('goes to previous song', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 2);
      usePlayerStore.setState({ positionMs: 0 }); // within 3 seconds
      usePlayerStore.getState().previous();

      expect(usePlayerStore.getState().currentSong?.id).toBe('2');
    });

    it('restarts current song if past 3 seconds', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2')] as any, 1);
      usePlayerStore.setState({ positionMs: 5000 });
      usePlayerStore.getState().previous();

      expect(usePlayerStore.getState().currentSong?.id).toBe('2'); // same song
      expect(usePlayerStore.getState().positionMs).toBe(0);
    });
  });

  describe('queue manipulation', () => {
    it('playNext inserts at correct position', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2')] as any, 0);
      usePlayerStore.getState().playNext(makeSong('inserted') as any);

      const queue = usePlayerStore.getState().queue;
      expect(queue[1].id).toBe('inserted');
      expect(queue).toHaveLength(3);
    });

    it('addToQueue appends to end', () => {
      usePlayerStore.getState().playSongs([makeSong('1')] as any, 0);
      usePlayerStore.getState().addToQueue(makeSong('appended') as any);

      const queue = usePlayerStore.getState().queue;
      expect(queue[queue.length - 1].id).toBe('appended');
    });

    it('removeFromQueue removes correct song', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 0);
      usePlayerStore.getState().removeFromQueue(1);

      const queue = usePlayerStore.getState().queue;
      expect(queue).toHaveLength(2);
      expect(queue.map((s) => s.id)).toEqual(['1', '3']);
    });

    it('removeFromQueue adjusts currentIndex when removing before current', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 2);
      usePlayerStore.getState().removeFromQueue(0);

      expect(usePlayerStore.getState().currentIndex).toBe(1);
      expect(usePlayerStore.getState().currentSong?.id).toBe('3');
    });

    it('clearQueue resets everything', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2')] as any, 0);
      usePlayerStore.getState().clearQueue();

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.currentSong).toBeNull();
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('reorderQueue', () => {
    it('moves song forward', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 0);
      usePlayerStore.getState().reorderQueue(0, 2);

      expect(usePlayerStore.getState().queue.map((s) => s.id)).toEqual(['2', '3', '1']);
    });

    it('moves song backward', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 0);
      usePlayerStore.getState().reorderQueue(2, 0);

      expect(usePlayerStore.getState().queue.map((s) => s.id)).toEqual(['3', '1', '2']);
    });

    it('tracks currentIndex correctly when moving current song', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 0);
      usePlayerStore.getState().reorderQueue(0, 2);

      expect(usePlayerStore.getState().currentIndex).toBe(2);
      expect(usePlayerStore.getState().currentSong?.id).toBe('1');
    });

    it('does nothing for same index', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2')] as any, 0);
      usePlayerStore.getState().reorderQueue(0, 0);

      expect(usePlayerStore.getState().queue.map((s) => s.id)).toEqual(['1', '2']);
    });
  });

  describe('shuffle', () => {
    it('toggleShuffle enables and generates shuffleOrder', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 0);
      usePlayerStore.getState().toggleShuffle();

      const state = usePlayerStore.getState();
      expect(state.shuffleEnabled).toBe(true);
      expect(state.shuffleOrder).toHaveLength(3);
    });

    it('toggleShuffle disables and clears shuffleOrder', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2'), makeSong('3')] as any, 0);
      usePlayerStore.getState().toggleShuffle();
      usePlayerStore.getState().toggleShuffle();

      expect(usePlayerStore.getState().shuffleEnabled).toBe(false);
      expect(usePlayerStore.getState().shuffleOrder).toHaveLength(0);
    });

    it('playNext updates shuffleOrder', () => {
      usePlayerStore.getState().playSongs([makeSong('1'), makeSong('2')] as any, 0);
      usePlayerStore.getState().toggleShuffle();
      const orderBefore = usePlayerStore.getState().shuffleOrder.length;

      usePlayerStore.getState().playNext(makeSong('3') as any);

      expect(usePlayerStore.getState().shuffleOrder.length).toBe(orderBefore + 1);
    });
  });

  describe('repeat', () => {
    it('cycles through modes', () => {
      expect(usePlayerStore.getState().repeatMode).toBe('off');

      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeatMode).toBe('all');

      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeatMode).toBe('one');

      usePlayerStore.getState().cycleRepeat();
      expect(usePlayerStore.getState().repeatMode).toBe('off');
    });
  });

  describe('radio', () => {
    it('playRadio sets radio state', () => {
      usePlayerStore.getState().playRadio({
        stationId: 'r1',
        stationName: 'Test FM',
        streamUrl: 'http://test.stream',
      });

      const state = usePlayerStore.getState();
      expect(state.radioMode?.stationId).toBe('r1');
      expect(state.radioMode?.stationName).toBe('Test FM');
      expect(state.isPlaying).toBe(false); // isPlaying only for songs
    });

    it('stopRadio clears radio state', () => {
      usePlayerStore.getState().playRadio({
        stationId: 'r1',
        stationName: 'Test FM',
        streamUrl: 'http://test.stream',
      });
      usePlayerStore.getState().stopRadio();

      expect(usePlayerStore.getState().radioMode).toBeNull();
      expect(usePlayerStore.getState().radioPlaying).toBe(false);
    });

    it('playSongs clears radio', () => {
      usePlayerStore.getState().playRadio({
        stationId: 'r1',
        stationName: 'Test FM',
        streamUrl: 'http://test.stream',
      });
      usePlayerStore.getState().playSongs([makeSong('1')] as any, 0);

      expect(usePlayerStore.getState().radioMode).toBeNull();
    });
  });

  describe('togglePlay', () => {
    it('toggles isPlaying', () => {
      expect(usePlayerStore.getState().isPlaying).toBe(false);
      usePlayerStore.getState().togglePlay();
      expect(usePlayerStore.getState().isPlaying).toBe(true);
      usePlayerStore.getState().togglePlay();
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });
  });

  describe('speed', () => {
    it('cycles through speed options', () => {
      expect(usePlayerStore.getState().playbackSpeed).toBe(1.0);
      usePlayerStore.getState().cycleSpeed();
      expect(usePlayerStore.getState().playbackSpeed).toBe(1.25);
    });
  });
});
