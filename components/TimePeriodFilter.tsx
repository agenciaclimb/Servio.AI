import React from 'react';

export type TimePeriod = 30 | 90 | 365 | 'all';

interface TimePeriodFilterProps {
  selectedPeriod: TimePeriod;
  onSelectPeriod: (period: TimePeriod) => void;
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: 30, label: 'Últimos 30 dias' },
  { value: 90, label: 'Últimos 90 dias' },
  { value: 365, label: 'Último Ano' },
  { value: 'all', label: 'Todo o Período' },
];

const TimePeriodFilter: React.FC<TimePeriodFilterProps> = ({ selectedPeriod, onSelectPeriod }) => {
  return (
    <div className="flex space-x-2 rounded-lg bg-gray-100 p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onSelectPeriod(period.value)}
          className={`w-full rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${selectedPeriod === period.value ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-600 hover:bg-white/60'}`}
        >{period.label}</button>
      ))}
    </div>
  );
};

export default TimePeriodFilter;