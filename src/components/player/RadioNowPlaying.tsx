import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/playerStore';
import { getPlaybackManager } from '../../audio/PlaybackManager';
import DynamicBackground from './DynamicBackground';
import { CoverArt } from '../common';

export default function RadioNowPlaying() {
  const navigate = useNavigate();
  const { radioMode, radioPlaying, stopRadio } = usePlayerStore();

  if (!radioMode) return null;

  const handleTogglePlay = () => {
    const pm = getPlaybackManager();
    if (radioPlaying) {
      pm.pauseRadio();
    } else {
      pm.resumeRadio();
    }
    usePlayerStore.setState({ radioPlaying: !radioPlaying });
  };

  const handleStop = () => {
    getPlaybackManager().stopRadio();
    stopRadio();
    navigate(-1);
  };

  return (
    <DynamicBackground coverArt={radioMode.coverArt} className="flex h-full flex-col">
      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-medium uppercase tracking-widest text-white/40">Radio</span>
        <div className="w-9" />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-12">
        {/* Station artwork */}
        <div className="w-full max-w-[300px]">
          <CoverArt coverArt={radioMode.coverArt} className="w-full rounded-2xl shadow-2xl" />
        </div>

        {/* Station info */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{radioMode.stationName}</h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className={`h-2 w-2 rounded-full ${radioPlaying ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
            <span className="text-sm text-white/50">{radioPlaying ? 'Live' : 'Paused'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {/* Stop */}
          <button
            onClick={handleStop}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white/60 hover:bg-white/10"
            aria-label="Stop radio"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={handleTogglePlay}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-black hover:opacity-90"
            aria-label={radioPlaying ? 'Pause' : 'Play'}
          >
            {radioPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-10 w-10">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
          </button>

          {/* Back to radio list */}
          <button
            onClick={() => navigate('/radio')}
            className="flex h-12 w-12 items-center justify-center rounded-full text-white/60 hover:bg-white/10"
            aria-label="Radio stations"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>
      </div>
    </DynamicBackground>
  );
}
