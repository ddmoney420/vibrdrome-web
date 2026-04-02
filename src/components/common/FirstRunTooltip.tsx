import { useState, useEffect } from 'react';

const STORAGE_KEY = 'vibrdrome_tooltips_seen';

function getSeenTooltips(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSeen(id: string) {
  try {
    const seen = getSeenTooltips();
    seen.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch { /* ignore */ }
}

interface FirstRunTooltipProps {
  id: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
}

export default function FirstRunTooltip({ id, message, position = 'bottom', delay = 1000, children }: FirstRunTooltipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getSeenTooltips().has(id)) return;

    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [id, delay]);

  const dismiss = () => {
    setVisible(false);
    markSeen(id);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex">
      {children}
      {visible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div
            className="animate-in fade-in rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white shadow-lg max-w-[200px] cursor-pointer"
            onClick={dismiss}
          >
            {message}
            <div className="mt-1 text-[10px] text-white/60">Click to dismiss</div>
          </div>
        </div>
      )}
    </div>
  );
}
