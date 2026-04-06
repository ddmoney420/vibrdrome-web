import { describe, it, expect, beforeEach } from 'vitest';
import { useMusicFolderStore } from './musicFolderStore';

beforeEach(() => {
  useMusicFolderStore.setState({
    folders: [],
    activeFolderId: null,
    loaded: false,
  });
});

describe('musicFolderStore', () => {
  it('defaults to no active folder', () => {
    expect(useMusicFolderStore.getState().activeFolderId).toBeNull();
  });

  it('sets active folder', () => {
    useMusicFolderStore.getState().setActiveFolderId('folder1');
    expect(useMusicFolderStore.getState().activeFolderId).toBe('folder1');
  });

  it('clears active folder', () => {
    useMusicFolderStore.getState().setActiveFolderId('folder1');
    useMusicFolderStore.getState().setActiveFolderId(null);
    expect(useMusicFolderStore.getState().activeFolderId).toBeNull();
  });

  it('starts not loaded', () => {
    expect(useMusicFolderStore.getState().loaded).toBe(false);
  });
});
