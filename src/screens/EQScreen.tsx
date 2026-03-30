import { useEQStore, EQ_PRESETS } from '../stores/eqStore';
import { Header } from '../components/common';

const FREQ_LABELS = ['31', '62', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'];

export default function EQScreen() {
  const { enabled, bands, currentPreset, setEnabled, setBand, setPreset } = useEQStore();
  const presetNames = Object.keys(EQ_PRESETS);

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Equalizer" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-20 md:pb-8">
        {/* ON/OFF toggle */}
        <div className="flex items-center justify-between py-4">
          <span className="text-sm font-medium text-text-primary">
            Equalizer {enabled ? 'ON' : 'OFF'}
          </span>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-accent' : 'bg-bg-tertiary'
            }`}
            aria-label={enabled ? 'Disable equalizer' : 'Enable equalizer'}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Preset chips */}
        <div className="mb-6 -mx-4 overflow-x-auto px-4 scrollbar-hide">
          <div className="flex gap-2 pb-1">
            {presetNames.map((name) => (
              <button
                key={name}
                onClick={() => setPreset(name)}
                disabled={!enabled}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  currentPreset === name
                    ? 'bg-accent text-bg-primary'
                    : enabled
                      ? 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                      : 'bg-bg-secondary text-text-muted opacity-50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* EQ Sliders */}
        <div className="flex items-end justify-between gap-1 overflow-x-auto scrollbar-hide min-w-0">
          {bands.map((gain, index) => (
            <div key={index} className="flex flex-1 shrink-0 min-w-[32px] flex-col items-center gap-1.5">
              {/* dB value */}
              <span
                className={`text-[10px] font-medium ${
                  enabled ? 'text-text-secondary' : 'text-text-muted'
                }`}
              >
                {gain > 0 ? '+' : ''}{gain}
              </span>

              {/* Vertical slider */}
              <div className="flex h-48 items-center">
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={gain}
                  onChange={(e) => setBand(index, Number(e.target.value))}
                  disabled={!enabled}
                  className={`h-40 w-8 cursor-pointer appearance-none rounded-full [writing-mode:vertical-lr] [direction:rtl] ${
                    enabled
                      ? 'accent-accent bg-bg-tertiary'
                      : 'bg-bg-tertiary opacity-40'
                  } [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow disabled:[&::-webkit-slider-thumb]:bg-text-muted`}
                />
              </div>

              {/* Frequency label */}
              <span
                className={`text-[10px] ${
                  enabled ? 'text-text-muted' : 'text-text-muted opacity-50'
                }`}
              >
                {FREQ_LABELS[index]}
              </span>
            </div>
          ))}
        </div>

        {/* dB range labels */}
        <div className="mt-4 flex justify-between px-2">
          <span className="text-[10px] text-text-muted">-12 dB</span>
          <span className="text-[10px] text-text-muted">0 dB</span>
          <span className="text-[10px] text-text-muted">+12 dB</span>
        </div>
      </div>
    </div>
  );
}
