import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubsonicClient } from '../api/SubsonicClient';
import { Header } from '../components/common';

interface LocationState {
  name?: string;
  streamUrl?: string;
  homepageUrl?: string;
}

export default function AddStationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) ?? {};

  const [name, setName] = useState(state.name ?? '');
  const [streamUrl, setStreamUrl] = useState(state.streamUrl ?? '');
  const [homepageUrl, setHomepageUrl] = useState(state.homepageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim() !== '' && streamUrl.trim() !== '';

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const client = getSubsonicClient();
      await client.createInternetRadioStation(
        streamUrl.trim(),
        name.trim(),
        homepageUrl.trim() || undefined,
      );
      navigate(-1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save station');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Add Station" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mx-auto max-w-lg space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Station name"
              className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Stream URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://stream.example.com/radio"
              className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Homepage URL
            </label>
            <input
              type="url"
              value={homepageUrl}
              onChange={(e) => setHomepageUrl(e.target.value)}
              placeholder="https://example.com (optional)"
              className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Station'}
          </button>
        </div>
      </div>
    </div>
  );
}
