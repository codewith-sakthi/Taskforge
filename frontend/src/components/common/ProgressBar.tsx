import React from 'react';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const getBarColor = (val: number) => {
    if (val === 100) return 'bg-emerald-500';
    if (val >= 60) return 'bg-blue-600';
    if (val >= 30) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
          <span>Progress</span>
          <span>{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor(clampedProgress)}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
