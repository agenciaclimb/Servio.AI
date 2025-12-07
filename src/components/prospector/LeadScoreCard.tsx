
import React from 'react';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Tooltip } from '@/components/Tooltip';
import { Button } from '@/components/ui/button';

interface LeadScoreCardProps {
  score: number;
  onDetailsClick: () => void;
}

const LeadScoreCard: React.FC<LeadScoreCardProps> = ({ score, onDetailsClick }) => {
  const getScoreColor = (score: number) => {
    if (score > 75) return 'text-green-500';
    if (score > 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <StatCard title="Lead Score" value={score.toString()}>
      <Tooltip content="Lead Score indica a probabilidade de conversão do lead.">
        <div className="relative">
          <ProgressBar percentage={score} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
        </div>
      </Tooltip>
      <Button onClick={onDetailsClick} className="mt-4">
        Ver Detalhes
      </Button>
    </StatCard>
  );
};

export default LeadScoreCard;
