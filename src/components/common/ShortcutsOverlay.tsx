import { useEffect } from 'react';

const SHORTCUT_GROUPS = [
  {
    label: 'Playback',
    shortcuts: [
      { key: 'Space', description: 'Play / Pause' },
      { key: '\u2192', description: 'Next track' },
      { key: '\u2190', description: 'Previous track' },
      { key: 'Shift + \u2192', description: 'Seek forward 10s' },
      { key: 'Shift + \u2190', description: 'Seek backward 10s' },
    ],
  },
  {
    label: 'Volume',
    shortcuts: [
      { key: '\u2191', description: 'Volume up' },
      { key: '\u2193', description: 'Volume down' },
      { key: 'M', description: 'Mute / Unmute' },
    ],
  },
  {
    label: 'Queue',
    shortcuts: [
      { key: 'S', description: 'Toggle shuffle' },
      { key: 'R', description: 'Cycle repeat mode' },
    ],
  },
  {
    label: 'App',
    shortcuts: [
      { key: '?', description: 'Show this overlay' },
      { key: 'Ctrl + K', description: 'Command palette' },
    ],
  },
];

interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="mx-4 w-full max-w-md rounded-xl border border-border bg-bg-primary p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Keyboard Shortcuts</h2>

        <div className="space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {group.label}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{s.description}</span>
                    <kbd className="rounded border border-border bg-bg-tertiary px-2 py-0.5 text-xs font-mono text-text-primary">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Press <kbd className="rounded border border-border bg-bg-tertiary px-1 text-[10px]">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
