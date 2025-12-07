import React from 'react';

interface ChartProps {
  title: string;
  data: { [key: string]: number };
}

const Chart: React.FC<ChartProps> = ({ title, data }) => {
  const maxValue = Math.max(...Object.values(data), 1);
  const dataEntries = Object.entries(data);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {dataEntries.length > 0 ? (
          dataEntries.map(([label, value]) => (
            <div key={label} className="flex items-center">
              <span className="text-sm text-gray-600 w-20 truncate">{label}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 mx-2">
                <div
                  className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(value / maxValue) * 100}%` }}
                >
                  <span className="text-xs font-bold text-white">{value}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">Dados insuficientes para exibir o gráfico.</p>
        )}
      </div>
    </div>
  );
};

export default Chart;
