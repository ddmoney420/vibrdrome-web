import { Header } from '../components/common';

export default function DownloadsScreen() {
  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Downloads" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-20">
          {/* Illustration */}
          <div className="relative mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-12 w-12 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-bg-secondary ring-4 ring-bg-primary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-text-muted">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <h2 className="mb-2 text-xl font-semibold text-text-primary">
            Offline Downloads
          </h2>
          <p className="mb-1 text-center text-sm leading-relaxed text-text-secondary">
            This feature is coming soon.
          </p>
          <p className="max-w-xs text-center text-xs leading-relaxed text-text-muted">
            You will be able to download albums, playlists, and individual tracks for offline listening -- no internet connection required.
          </p>
        </div>
      </div>
    </div>
  );
}
