import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import type { MusicFolder } from '../types/subsonic';
import { Header, LoadingSpinner } from '../components/common';

export default function FolderBrowserScreen() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<MusicFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSubsonicClient();
        const data = await client.getMusicFolders();
        setFolders(data);
      } catch (err) {
        console.error('Failed to load music folders:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-bg-primary">
        <Header title="Folders" showBack />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Folders" showBack />

      <div className="flex-1 overflow-y-auto pb-20">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => navigate(`/folder/${folder.id}`)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-tertiary active:bg-bg-tertiary"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-accent"
              >
                <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="truncate text-sm font-medium text-text-primary">
                {folder.name || `Folder ${folder.id}`}
              </span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-text-muted">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        ))}

        {folders.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mb-3 h-10 w-10 text-text-muted/50">
              <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
            </svg>
            <p className="text-sm text-text-muted">No music folders found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
