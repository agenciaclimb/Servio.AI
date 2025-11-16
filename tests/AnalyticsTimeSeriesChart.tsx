import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '../../types';

interface AnalyticsTimeSeriesChartProps {
  data: TimeSeriesData[];
}

const AnalyticsTimeSeriesChart: React.FC<AnalyticsTimeSeriesChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => `R$ ${value.toFixed(0)}`;

  return (
    <div className="bg-white rounded-lg shadow p-6 h-96">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Crescimento Mensal</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" stroke="#3b82f6" label={{ value: 'Jobs Criados', angle: -90, position: 'insideLeft', fill: '#3b82f6' }} />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" tickFormatter={formatCurrency} label={{ value: 'Receita (R$)', angle: -90, position: 'insideRight', fill: '#10b981' }} />
          <Tooltip
            formatter={(value: number, name: string) => {
              return name === 'Receita (R$)' ? formatCurrency(value) : value;
            }}
            labelStyle={{ color: '#333' }}
            itemStyle={{ fontWeight: 'bold' }}
          />
          <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Jobs Criados"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Receita (R$)"
            stroke="#10b981"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsTimeSeriesChart;