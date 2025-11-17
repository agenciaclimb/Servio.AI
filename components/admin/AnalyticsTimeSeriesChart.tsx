import React from 'react';

// Minimal, dependency-free time series chart (list-based) to unblock tests.
// Expects data as array of { label: string; jobs: number; revenue?: number }

interface TimePoint {
  label: string;
  jobs: number;
  revenue?: number;
}

interface Props {
  data: TimePoint[];
  title?: string;
}

const AnalyticsTimeSeriesChart: React.FC<Props> = ({ data, title = 'Série Temporal' }) => {
  const maxJobs = Math.max(1, ...data.map(d => d.jobs));
  const maxRevenue = Math.max(1, ...data.map(d => d.revenue ?? 0));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.length === 0 && (
          <p className="text-sm text-gray-600">Sem dados suficientes para exibir.</p>
        )}
        {data.map((p) => (
          <div key={p.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span className="font-medium">{p.label}</span>
              <span>{p.jobs} jobs{p.revenue ? ` · R$ ${p.revenue.toFixed(2)}` : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 h-2 rounded">
                <div
                  className="h-2 rounded bg-blue-600"
                  style={{ width: `${(p.jobs / maxJobs) * 100}%` }}
                />
              </div>
              {p.revenue != null && (
                <div className="flex-1 bg-gray-200 h-2 rounded">
                  <div
                    className="h-2 rounded bg-green-600"
                    style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsTimeSeriesChart;
