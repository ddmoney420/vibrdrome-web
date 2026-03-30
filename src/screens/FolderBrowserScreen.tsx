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

      <div className="flex-1 overflow-y-auto">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => navigate(`/folder/${folder.id}`)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-tertiary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 shrink-0 text-accent"
            >
              <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
            </svg>
            <span className="truncate text-sm font-medium text-text-primary">
              {folder.name || `Folder ${folder.id}`}
            </span>
          </button>
        ))}

        {folders.length === 0 && (
          <p className="py-8 text-center text-text-muted">No music folders found.</p>
        )}
      </div>
    </div>
  );
}
