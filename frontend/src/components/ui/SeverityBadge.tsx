import React from 'react';

interface SeverityBadgeProps {
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational' | 'Healthy' | string;
  size?: 'sm' | 'md';
  className?: string;
  showDot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  className = '',
  showDot = true,
}) => {
  const normalized = severity ? severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase() : 'Informational';

  const getStyle = () => {
    switch (normalized) {
      case 'Critical':
        return {
          badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50',
          dot: 'bg-red-600 dark:bg-red-500',
        };
      case 'High':
        return {
          badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50',
          dot: 'bg-orange-600 dark:bg-orange-500',
        };
      case 'Medium':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
          dot: 'bg-amber-600 dark:bg-amber-500',
        };
      case 'Low':
        return {
          badge: 'bg-[#181818] text-[#A8A8A3] border border-[#2B2B2B]',
          dot: 'bg-[#A8A8A3]',
        };
      case 'Healthy':
        return {
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50',
          dot: 'bg-emerald-600 dark:bg-emerald-500',
        };
      case 'Informational':
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60',
          dot: 'bg-slate-500 dark:bg-slate-400',
        };
    }
  };

  const { badge, dot } = getStyle();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors select-none ${sizeClasses} ${badge} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
      <span>{normalized}</span>
    </span>
  );
};
