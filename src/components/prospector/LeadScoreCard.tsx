import React, { useState, useMemo } from 'react';
import { AlertCircle, Target } from 'lucide-react';

interface ScoreAnalysis {
  categoryMatch: number;
  locationScore: number;
  engagementScore: number;
  recencyScore: number;
  demographicScore: number;
}

interface Recommendation {
  action: string;
  template: string;
  timeToSend: string;
  confidence: number;
  reasoning: string;
}

interface LeadScoreCardProps {
  leadId: string;
  score: number;
  temperature?: 'hot' | 'warm' | 'cold';
  analysis?: ScoreAnalysis;
  recommendation?: Recommendation;
  onDetailClick?: (leadId: string) => void;
  compact?: boolean;
}

/**
 * LeadScoreCard Component
 * 
 * Exibe score visual de lead com indicador de temperatura
 * e recomendações de próximas ações.
 * 
 * @component
 * @example
 * <LeadScoreCard
 *   leadId="lead-123"
 *   score={85}
 *   temperature="hot"
 *   analysis={scoreAnalysis}
 *   recommendation={rec}
 *   onDetailClick={handleClick}
 * />
 */
export default function LeadScoreCard({
  leadId,
  score,
  temperature = 'warm',
  analysis,
  recommendation,
  onDetailClick,
  compact = false,
}: LeadScoreCardProps): React.ReactElement {
  const [showDetails, setShowDetails] = useState(false);

  // Determinar temperatura baseado em score se não fornecido
  const determinedTemperature = useMemo(() => {
    if (temperature) return temperature;
    if (score >= 80) return 'hot';
    if (score >= 50) return 'warm';
    return 'cold';
  }, [score, temperature]);

  // Cores por temperatura
  const colorMap = {
    hot: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-700',
      progress: 'bg-red-500',
      badge: 'bg-red-100 text-red-800',
    },
    warm: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      progress: 'bg-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    cold: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-700',
      progress: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-800',
    },
  };

  const colors = colorMap[determinedTemperature];

  const handleDetailClick = () => {
    setShowDetails(!showDetails);
    if (onDetailClick && !showDetails) {
      onDetailClick(leadId);
    }
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2 rounded border ${colors.border} ${colors.bg}`}
        data-testid={`lead-score-card-compact-${leadId}`}
      >
        <div className="w-10 h-10 rounded-full bg-white border-2 border-current flex items-center justify-center font-bold text-sm">
          {score}
        </div>
        <span className={`text-xs font-semibold ${colors.badge} px-2 py-1 rounded`}>
          {determinedTemperature.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border-2 p-4 ${colors.border} ${colors.bg} cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={handleDetailClick}
      data-testid={`lead-score-card-${leadId}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleDetailClick();
        }
      }}
    >
      {/* Header com Score Circular */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Circular Progress */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-300"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(score / 100) * 2 * Math.PI * 45} ${2 * Math.PI * 45}`}
                className={colors.progress}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${colors.text}`}>{score}</span>
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-sm font-semibold text-gray-900">Lead Score</p>
            <p className={`text-xs ${colors.text} font-medium`}>
              {determinedTemperature === 'hot' && '🔥 Hot'}
              {determinedTemperature === 'warm' && '🌡️ Warm'}
              {determinedTemperature === 'cold' && '❄️ Cold'}
            </p>
          </div>
        </div>

        {/* Badge de temperatura */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}
        >
          {determinedTemperature.charAt(0).toUpperCase() + determinedTemperature.slice(1)}
        </span>
      </div>

      {/* Score Breakdown (se análise disponível) */}
      {analysis && (
        <div className="space-y-2 mb-3 pb-3 border-t border-current border-opacity-20">
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Category Match</span>
              <span className="text-xs font-bold">{analysis.categoryMatch}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors.progress}`}
                style={{ width: `${analysis.categoryMatch}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">Location Score</span>
            <span className="text-xs font-bold">{analysis.locationScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.progress}`}
              style={{ width: `${analysis.locationScore}%` }}
            />
          </div>

          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">Engagement</span>
            <span className="text-xs font-bold">{analysis.engagementScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.progress}`}
              style={{ width: `${analysis.engagementScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="flex items-start gap-2 p-2 bg-white bg-opacity-60 rounded border-l-2 border-current">
          <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-900">{recommendation.action}</p>
            <p className="text-xs text-gray-600 mt-0.5">{recommendation.template.substring(0, 60)}...</p>
            <p className="text-xs text-gray-500 mt-1">
              Send in: <span className="font-semibold">{recommendation.timeToSend}</span>
            </p>
          </div>
          <span className="text-xs font-bold px-2 py-1 bg-white rounded whitespace-nowrap">
            {Math.round(recommendation.confidence * 100)}%
          </span>
        </div>
      )}

      {/* Click to expand indicator */}
      <div className="mt-2 text-center">
        <p className={`text-xs font-medium ${colors.text} opacity-70`}>
          {showDetails ? '▼ Click to collapse details' : '▶ Click to view details'}
        </p>
      </div>

      {/* Expanded Details Modal */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20 space-y-2">
          {analysis && (
            <div>
              <p className="text-xs font-bold text-gray-900 mb-2">Score Components</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white bg-opacity-50 rounded">
                  <p className="text-gray-600">Category</p>
                  <p className="font-bold">{analysis.categoryMatch}%</p>
                </div>
                <div className="p-2 bg-white bg-opacity-50 rounded">
                  <p className="text-gray-600">Location</p>
                  <p className="font-bold">{analysis.locationScore}%</p>
                </div>
                <div className="p-2 bg-white bg-opacity-50 rounded">
                  <p className="text-gray-600">Engagement</p>
                  <p className="font-bold">{analysis.engagementScore}%</p>
                </div>
                <div className="p-2 bg-white bg-opacity-50 rounded">
                  <p className="text-gray-600">Recency</p>
                  <p className="font-bold">{analysis.recencyScore}%</p>
                </div>
              </div>
            </div>
          )}

          {recommendation && (
            <div>
              <p className="text-xs font-bold text-gray-900 mb-2">AI Recommendation</p>
              <div className="p-2 bg-white bg-opacity-50 rounded space-y-1">
                <p className="text-xs">
                  <span className="font-semibold">Action:</span> {recommendation.action}
                </p>
                <p className="text-xs">
                  <span className="font-semibold">Confidence:</span>{' '}
                  {Math.round(recommendation.confidence * 100)}%
                </p>
                <p className="text-xs">
                  <span className="font-semibold">Timing:</span> {recommendation.timeToSend}
                </p>
                <p className="text-xs text-gray-600 mt-2">{recommendation.reasoning}</p>
              </div>
            </div>
          )}

          {!analysis && !recommendation && (
            <div className="flex items-center gap-2 p-2 text-yellow-700 bg-yellow-50 rounded">
              <AlertCircle className="w-4 h-4" />
              <p className="text-xs">No detailed analysis available yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

