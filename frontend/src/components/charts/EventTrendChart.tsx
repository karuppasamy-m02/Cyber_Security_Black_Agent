import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useThemeStore } from '../../stores/themeStore';

interface EventTrendChartProps {
  data: Array<{
    time: string;
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
    Total: number;
  }>;
}

export const EventTrendChart: React.FC<EventTrendChartProps> = ({ data }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const gridColor = isDark ? '#2B2B2B' : '#F1F5F9';
  const axisColor = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#121212' : '#FFFFFF';
  const tooltipBorder = isDark ? '#2B2B2B' : '#E2E8F0';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EA580C" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="time" stroke={axisColor} fontSize={11} tickLine={false} />
          <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: '8px',
              fontSize: '12px',
              color: tooltipText,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            formatter={(value) => <span style={{ color: isDark ? '#94A3B8' : '#475569' }}>{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="Critical"
            stroke="#DC2626"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorCritical)"
          />
          <Area
            type="monotone"
            dataKey="High"
            stroke="#EA580C"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorHigh)"
          />
          <Area
            type="monotone"
            dataKey="Medium"
            stroke="#D97706"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorMedium)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
