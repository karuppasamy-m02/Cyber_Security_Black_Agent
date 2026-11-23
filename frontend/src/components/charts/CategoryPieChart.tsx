import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useThemeStore } from '../../stores/themeStore';

interface CategoryPieChartProps {
  data: Record<string, number>;
}

// Semantic, refined colors for categories
const COLORS = [
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#EA580C', // Orange
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#475569', // Slate
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  const tooltipBg = isDark ? '#121212' : '#FFFFFF';
  const tooltipBorder = isDark ? '#2B2B2B' : '#E2E8F0';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
        No telemetry categories recorded yet
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke={isDark ? '#121212' : '#FFFFFF'}
            strokeWidth={2}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
