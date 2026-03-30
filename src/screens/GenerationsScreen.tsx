import { useNavigate } from 'react-router-dom';
import { Header } from '../components/common';

interface Decade {
  label: string;
  fromYear: number;
  toYear: number;
  gradient: string;
}

const DECADES: Decade[] = [
  { label: '1950s', fromYear: 1950, toYear: 1959, gradient: 'from-amber-900 via-amber-700 to-yellow-600' },
  { label: '1960s', fromYear: 1960, toYear: 1969, gradient: 'from-orange-800 via-orange-600 to-yellow-400' },
  { label: '1970s', fromYear: 1970, toYear: 1979, gradient: 'from-emerald-800 via-lime-600 to-yellow-500' },
  { label: '1980s', fromYear: 1980, toYear: 1989, gradient: 'from-fuchsia-700 via-pink-500 to-purple-400' },
  { label: '1990s', fromYear: 1990, toYear: 1999, gradient: 'from-teal-700 via-cyan-500 to-sky-400' },
  { label: '2000s', fromYear: 2000, toYear: 2009, gradient: 'from-blue-800 via-blue-500 to-indigo-400' },
  { label: '2010s', fromYear: 2010, toYear: 2019, gradient: 'from-violet-700 via-purple-500 to-fuchsia-400' },
  { label: '2020s', fromYear: 2020, toYear: 2029, gradient: 'from-rose-700 via-red-500 to-orange-400' },
];

export default function GenerationsScreen() {
  const navigate = useNavigate();

  const handleDecadeClick = (decade: Decade) => {
    const params = new URLSearchParams({
      type: 'byYear',
      fromYear: String(decade.fromYear),
      toYear: String(decade.toYear),
      title: decade.label,
    });
    navigate(`/albums?${params.toString()}`);
  };

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <Header title="Generations" showBack />

      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-2">
        <div className="grid grid-cols-2 gap-3">
          {DECADES.map((decade) => (
            <button
              key={decade.label}
              onClick={() => handleDecadeClick(decade)}
              className={`relative flex h-36 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${decade.gradient} shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.97]`}
            >
              <div className="absolute inset-0 bg-black/10" />
              <span className="relative text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                {decade.label}
              </span>
              <span className="relative mt-1 text-[11px] font-medium text-white/70">
                {decade.fromYear} &ndash; {decade.toYear}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
