import { describe, it, expect, beforeEach } from 'vitest';
import { useLibraryStore } from './libraryStore';

beforeEach(() => {
  // Reset custom carousels
  useLibraryStore.setState({ customCarousels: [] });
});

describe('libraryStore', () => {
  describe('pills', () => {
    it('has default pills', () => {
      const pills = useLibraryStore.getState().pills;
      expect(pills.length).toBeGreaterThan(0);
      expect(pills.find((p) => p.id === 'genres')).toBeDefined();
      expect(pills.find((p) => p.id === 'artists')).toBeDefined();
    });

    it('toggles pill visibility', () => {
      const before = useLibraryStore.getState().pills.find((p) => p.id === 'genres')?.visible;
      useLibraryStore.getState().togglePill('genres');
      const after = useLibraryStore.getState().pills.find((p) => p.id === 'genres')?.visible;
      expect(after).toBe(!before);
    });

    it('moves pill', () => {
      const pills = useLibraryStore.getState().pills;
      const first = pills[0].id;
      const second = pills[1].id;

      useLibraryStore.getState().movePill(0, 1);

      const newPills = useLibraryStore.getState().pills;
      expect(newPills[0].id).toBe(second);
      expect(newPills[1].id).toBe(first);
    });
  });

  describe('carousels', () => {
    it('has default carousels', () => {
      const carousels = useLibraryStore.getState().carousels;
      expect(carousels.length).toBeGreaterThan(0);
      expect(carousels.find((c) => c.id === 'newest')).toBeDefined();
    });

    it('toggles carousel visibility', () => {
      const before = useLibraryStore.getState().carousels.find((c) => c.id === 'newest')?.visible;
      useLibraryStore.getState().toggleCarousel('newest');
      const after = useLibraryStore.getState().carousels.find((c) => c.id === 'newest')?.visible;
      expect(after).toBe(!before);
    });
  });

  describe('custom carousels', () => {
    it('adds custom carousel', () => {
      useLibraryStore.getState().addCustomCarousel({
        label: 'Test Carousel',
        type: 'byYear',
        visible: true,
        fromYear: 2020,
        toYear: 2025,
      });

      const custom = useLibraryStore.getState().customCarousels;
      expect(custom).toHaveLength(1);
      expect(custom[0].label).toBe('Test Carousel');
      expect(custom[0].type).toBe('byYear');
      expect(custom[0].id).toBeTruthy();
    });

    it('removes custom carousel', () => {
      useLibraryStore.getState().addCustomCarousel({
        label: 'To Remove',
        type: 'highest',
        visible: true,
      });

      const id = useLibraryStore.getState().customCarousels[0].id;
      useLibraryStore.getState().removeCustomCarousel(id);

      expect(useLibraryStore.getState().customCarousels).toHaveLength(0);
    });

    it('updates custom carousel', () => {
      useLibraryStore.getState().addCustomCarousel({
        label: 'Original',
        type: 'byGenre',
        visible: true,
        genres: ['Rock'],
      });

      const id = useLibraryStore.getState().customCarousels[0].id;
      useLibraryStore.getState().updateCustomCarousel(id, { label: 'Renamed', genres: ['Rock', 'Jazz'] });

      const updated = useLibraryStore.getState().customCarousels[0];
      expect(updated.label).toBe('Renamed');
      expect(updated.genres).toEqual(['Rock', 'Jazz']);
    });

    it('toggles custom carousel visibility', () => {
      useLibraryStore.getState().addCustomCarousel({
        label: 'Test',
        type: 'highest',
        visible: true,
      });

      const id = useLibraryStore.getState().customCarousels[0].id;
      useLibraryStore.getState().toggleCustomCarousel(id);

      expect(useLibraryStore.getState().customCarousels[0].visible).toBe(false);
    });

    it('moves custom carousel', () => {
      useLibraryStore.getState().addCustomCarousel({ label: 'First', type: 'highest', visible: true });
      useLibraryStore.getState().addCustomCarousel({ label: 'Second', type: 'highest', visible: true });

      useLibraryStore.getState().moveCustomCarousel(0, 1);

      const custom = useLibraryStore.getState().customCarousels;
      expect(custom[0].label).toBe('Second');
      expect(custom[1].label).toBe('First');
    });
  });

  describe('pillsPosition', () => {
    it('defaults to above', () => {
      expect(useLibraryStore.getState().pillsPosition).toBe('above');
    });

    it('sets position', () => {
      useLibraryStore.getState().setPillsPosition('below');
      expect(useLibraryStore.getState().pillsPosition).toBe('below');
    });
  });
});
