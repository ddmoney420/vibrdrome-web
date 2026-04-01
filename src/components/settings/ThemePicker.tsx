import { useUIStore } from '../../stores/uiStore';

interface ThemeOption {
  id: string;
  label: string;
  colors: { bg: string; secondary: string; accent: string; text: string };
  description: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'system',
    label: 'System',
    colors: { bg: '#0f0f13', secondary: '#1a1a24', accent: '#8b5cf6', text: '#f3f4f6' },
    description: 'Follows your OS preference',
  },
  {
    id: 'dark',
    label: 'Dark',
    colors: { bg: '#0f0f13', secondary: '#1a1a24', accent: '#8b5cf6', text: '#f3f4f6' },
    description: 'Default dark theme',
  },
  {
    id: 'light',
    label: 'Light',
    colors: { bg: '#ffffff', secondary: '#f9fafb', accent: '#8b5cf6', text: '#111827' },
    description: 'Clean and bright',
  },
  {
    id: 'apple',
    label: 'zApple Light',
    colors: { bg: '#f5f5f7', secondary: '#ffffff', accent: '#fc3c44', text: '#1d1d1f' },
    description: 'Clean, airy, rounded',
  },
  {
    id: 'apple-dark',
    label: 'zApple Dark',
    colors: { bg: '#1c1c1e', secondary: '#2c2c2e', accent: '#fc3c44', text: '#f5f5f7' },
    description: 'Sleek, rounded, red accent',
  },
  {
    id: 'retro',
    label: 'Retro',
    colors: { bg: '#1a1a2e', secondary: '#16213e', accent: '#00ff41', text: '#00ff41' },
    description: 'Pixel art neon vibes',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    colors: { bg: '#000000', secondary: '#0a0a0a', accent: '#00ff41', text: '#00ff41' },
    description: 'Hacker green on black',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    colors: { bg: '#0b1120', secondary: '#111a2e', accent: '#60a5fa', text: '#e2e8f0' },
    description: 'Deep blue, calm',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    colors: { bg: '#1a1008', secondary: '#241a0e', accent: '#f59e0b', text: '#fef3c7' },
    description: 'Warm amber tones',
  },
];

export default function ThemePicker() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="grid grid-cols-3 gap-2">
      {THEMES.map((t) => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id as typeof theme)}
            className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
              isActive
                ? 'border-accent ring-1 ring-accent/30'
                : 'border-border hover:border-text-muted'
            }`}
          >
            {/* Mini preview */}
            <div
              className="flex h-16 flex-col p-2"
              style={{ background: t.colors.bg }}
            >
              {/* Fake top bar */}
              <div className="flex items-center gap-1 mb-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: t.colors.accent }} />
                <div className="h-1 w-8 rounded-full" style={{ background: t.colors.text, opacity: 0.3 }} />
              </div>
              {/* Fake content rows */}
              <div className="flex gap-1 flex-1">
                <div className="w-5 rounded" style={{ background: t.colors.secondary }} />
                <div className="flex-1 space-y-1">
                  <div className="h-1 w-full rounded-full" style={{ background: t.colors.text, opacity: 0.2 }} />
                  <div className="h-1 w-3/4 rounded-full" style={{ background: t.colors.text, opacity: 0.1 }} />
                  <div className="h-1.5 w-1/2 rounded-full" style={{ background: t.colors.accent, opacity: 0.6 }} />
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="bg-bg-secondary px-2 py-1.5">
              <p className={`text-[10px] font-semibold ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                {t.label}
              </p>
              <p className="text-[8px] text-text-muted truncate">{t.description}</p>
            </div>

            {/* Check mark */}
            {isActive && (
              <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: t.colors.accent }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-3 w-3">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
