import React from 'react';

interface StatusPillProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
  showDot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  className = '',
  showDot = false,
}) => {
  const norm = status ? status.toLowerCase() : 'unknown';

  const getStyle = () => {
    switch (norm) {
      case 'new':
        return {
          pill: 'bg-[#1A1A1A] text-[#F5F5F2] border border-[#2B2B2B]',
          dot: 'bg-[#F5F5F2]',
        };
      case 'investigating':
      case 'in_progress':
      case 'pending':
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
          dot: 'bg-amber-500',
        };
      case 'contained':
        return {
          pill: 'bg-[#181818] text-[#A8A8A3] border border-[#2B2B2B]',
          dot: 'bg-[#A8A8A3]',
        };
      case 'resolved':
      case 'online':
      case 'active':
      case 'approved':
      case 'completed':
      case 'healthy':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
          dot: 'bg-emerald-500',
        };
      case 'rejected':
      case 'failed':
      case 'offline':
      case 'compromised':
      case 'false positive':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50',
          dot: 'bg-rose-500',
        };
      default:
        return {
          pill: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50',
          dot: 'bg-slate-400',
        };
    }
  };

  const { pill, dot } = getStyle();
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border tracking-tight transition-colors select-none ${sizeClasses} ${pill} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
      <span className="capitalize">{status}</span>
    </span>
  );
};
