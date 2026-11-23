import React from 'react';

interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  direction: 'positive' | 'negative';
  impact_percentage: number;
}

interface ShapWaterfallProps {
  features: FeatureContribution[];
  predictedClass?: string;
  confidence?: number;
}

export const ShapWaterfall: React.FC<ShapWaterfallProps> = ({
  features,
  predictedClass = 'Suspicious Activity',
  confidence = 0.88,
}) => {
  return (
    <div className="space-y-4 bg-white dark:bg-[#121212] p-5 rounded-lg border border-slate-200 dark:border-[#2B2B2B]">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2B2B2B] pb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            SHAP Explainability Decomposition
            <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              TreeSHAP
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Attribution of input telemetry features to prediction '{predictedClass}'
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400">Prediction Confidence:</span>
          <span className="ml-1.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {features.map((item, idx) => {
          const isPositive = item.direction === 'positive';
          const barWidth = Math.min(100, Math.max(8, item.impact_percentage * 2));

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {item.feature} <span className="font-mono text-slate-400">({item.value})</span>
                </span>
                <span
                  className={`font-mono text-xs font-semibold tabular-nums ${
                    isPositive ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isPositive ? '+' : '-'}{item.impact_percentage}% impact
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#181818] rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive ? 'bg-red-500 dark:bg-red-500' : 'bg-emerald-500 dark:bg-emerald-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
