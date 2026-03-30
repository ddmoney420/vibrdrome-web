import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightActions?: React.ReactNode;
}

export default function Header({ title, showBack = false, rightActions }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-2 px-3 py-3 md:gap-3 md:px-4">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-text-primary md:text-xl">
        {title}
      </h1>

      {rightActions && (
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">{rightActions}</div>
      )}
    </header>
  );
}
