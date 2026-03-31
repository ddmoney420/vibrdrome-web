import { useState, useEffect, useRef } from 'react';
import { useMusicFolderStore } from '../../stores/musicFolderStore';

export default function FolderPicker() {
  const { folders, activeFolderId, loaded, setActiveFolderId, loadFolders } = useMusicFolderStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaded) loadFolders();
  }, [loaded, loadFolders]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Don't show if server only has 1 or no folders
  if (!loaded || folders.length <= 1) return null;

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const label = activeFolder?.name ?? 'All Libraries';

  return (
    <div ref={ref} className="relative px-3 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg bg-bg-tertiary/50 px-3 py-2 text-left text-xs transition-colors hover:bg-bg-tertiary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-accent">
          <path d="M10.362 1.093a.75.75 0 00-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925zM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0018 14.25V6.443zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 00.388.657l6.862 3.786z" />
        </svg>
        <span className="flex-1 truncate text-text-primary font-medium">{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-3 right-3 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-bg-secondary shadow-xl">
          {/* All Libraries option */}
          <button
            onClick={() => { setActiveFolderId(null); setOpen(false); }}
            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
              activeFolderId === null
                ? 'bg-accent/10 text-accent'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
              <path d="M10.362 1.093a.75.75 0 00-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925zM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0018 14.25V6.443zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 00.388.657l6.862 3.786z" />
            </svg>
            <span className="flex-1 font-medium">All Libraries</span>
            {activeFolderId === null && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-accent">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <div className="border-t border-border" />

          {/* Individual folders */}
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => { setActiveFolderId(folder.id); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                activeFolderId === folder.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
              </svg>
              <span className="flex-1 truncate font-medium">{folder.name ?? folder.id}</span>
              {activeFolderId === folder.id && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-accent">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
