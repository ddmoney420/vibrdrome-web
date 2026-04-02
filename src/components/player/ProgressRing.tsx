interface ProgressRingProps {
  progress: number; // 0 to 1
  size: number;
  strokeWidth?: number;
  children: React.ReactNode;
}

export default function ProgressRing({ progress, size, strokeWidth = 2.5, children }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size, minWidth: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-bg-tertiary"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-accent transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      {/* Content (album art) centered inside */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div style={{ width: size - strokeWidth * 2 - 2, height: size - strokeWidth * 2 - 2 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
