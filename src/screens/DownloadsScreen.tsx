import { Header } from '../components/common';

export default function DownloadsScreen() {
  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Downloads" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="mx-auto max-w-lg space-y-6">

          {/* Active Downloads (stub) */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Active Downloads
            </h2>
            <div className="rounded-lg bg-bg-secondary p-6 text-center">
              <p className="text-sm text-text-muted">No active downloads</p>
            </div>
          </section>

          {/* Completed Downloads (stub) */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Completed
            </h2>
            <div className="rounded-lg bg-bg-secondary p-6 text-center">
              <p className="text-sm text-text-muted">No completed downloads</p>
            </div>
          </section>

          {/* Placeholder message */}
          <div className="py-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mx-auto mb-3 h-12 w-12 text-text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <p className="text-lg font-medium text-text-secondary">Downloads feature coming soon</p>
            <p className="mt-1 text-sm text-text-muted">
              Download albums and playlists for offline listening
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
