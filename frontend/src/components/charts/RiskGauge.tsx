import React from 'react';
import { useThemeStore } from '../../stores/themeStore';

interface RiskGaugeProps {
  score: number;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = 120 }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#DC2626'; // Critical
    if (score >= 60) return '#EA580C'; // High
    if (score >= 35) return '#D97706'; // Medium
    return '#16A34A'; // Healthy / Low
  };

  const trackColor = isDark ? '#2B2B2B' : '#E2E8F0';

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Calibrated Risk Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Centered Score */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono tabular-nums tracking-tight" style={{ color: getColor() }}>
          {score}
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
          Risk Index
        </span>
      </div>
    </div>
  );
};
