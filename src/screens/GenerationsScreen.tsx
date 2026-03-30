import { useNavigate } from 'react-router-dom';
import { Header } from '../components/common';

interface Decade {
  label: string;
  fromYear: number;
  toYear: number;
  gradient: string;
}

const DECADES: Decade[] = [
  { label: '1950s', fromYear: 1950, toYear: 1959, gradient: 'from-amber-800 to-amber-600' },
  { label: '1960s', fromYear: 1960, toYear: 1969, gradient: 'from-orange-700 to-yellow-500' },
  { label: '1970s', fromYear: 1970, toYear: 1979, gradient: 'from-yellow-700 to-lime-500' },
  { label: '1980s', fromYear: 1980, toYear: 1989, gradient: 'from-pink-600 to-purple-500' },
  { label: '1990s', fromYear: 1990, toYear: 1999, gradient: 'from-teal-600 to-cyan-400' },
  { label: '2000s', fromYear: 2000, toYear: 2009, gradient: 'from-blue-600 to-indigo-400' },
  { label: '2010s', fromYear: 2010, toYear: 2019, gradient: 'from-violet-600 to-fuchsia-400' },
  { label: '2020s', fromYear: 2020, toYear: 2029, gradient: 'from-rose-600 to-red-400' },
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

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {DECADES.map((decade) => (
            <button
              key={decade.label}
              onClick={() => handleDecadeClick(decade)}
              className={`flex h-28 items-center justify-center rounded-xl bg-gradient-to-br ${decade.gradient} text-2xl font-bold text-white shadow-md transition-transform hover:scale-[1.03] active:scale-[0.98]`}
            >
              {decade.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
