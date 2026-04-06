import { describe, it, expect, beforeEach } from 'vitest';
import { useSmartPlaylistStore } from './smartPlaylistStore';

beforeEach(() => {
  useSmartPlaylistStore.setState({
    heavyRotationDays: 30,
    forgottenGemsMonths: 2,
    recentUnplayedDays: 30,
  });
});

describe('smartPlaylistStore', () => {
  it('has sensible defaults', () => {
    const state = useSmartPlaylistStore.getState();
    expect(state.heavyRotationDays).toBe(30);
    expect(state.forgottenGemsMonths).toBe(2);
    expect(state.recentUnplayedDays).toBe(30);
  });

  it('sets heavy rotation days', () => {
    useSmartPlaylistStore.getState().setHeavyRotationDays(7);
    expect(useSmartPlaylistStore.getState().heavyRotationDays).toBe(7);
  });

  it('sets forgotten gems months', () => {
    useSmartPlaylistStore.getState().setForgottenGemsMonths(6);
    expect(useSmartPlaylistStore.getState().forgottenGemsMonths).toBe(6);
  });

  it('sets recent unplayed days', () => {
    useSmartPlaylistStore.getState().setRecentUnplayedDays(14);
    expect(useSmartPlaylistStore.getState().recentUnplayedDays).toBe(14);
  });
});
