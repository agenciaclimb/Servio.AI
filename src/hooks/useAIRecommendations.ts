import { useState, useCallback, useEffect } from 'react';

export interface AIRecommendation {
  action: string;
  template: string;
  timeToSend: string;
  confidence: number;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

interface ConversionPrediction {
  probability: number;
  factors: string[];
  risk: string;
  timeline: string;
  recommendation: string;
}

interface FollowUpStep {
  step: number;
  action: string;
  delay: string;
  message: string;
  scheduledFor: string;
}

export interface ComprehensiveRecommendation {
  nextAction: AIRecommendation;
  conversionPrediction: ConversionPrediction;
  followUpSequence: FollowUpStep[];
  priority: 'high' | 'medium' | 'low';
}

interface UseAIRecommendationsReturn {
  recommendations: ComprehensiveRecommendation | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar recomendações de IA para um lead
 * 
 * Integra com backend API `/api/prospector/ai-recommendations`
 * 
 * @param leadId - ID do lead
 * @param prospectorId - ID do prospector
 * @returns Recomendações, loading state e error handling
 * 
 * @example
 * const { recommendations, loading, error } = useAIRecommendations('lead-1', 'prospect-1');
 */
export function useAIRecommendations(
  leadId: string,
  prospectorId: string
): UseAIRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<ComprehensiveRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!leadId || !prospectorId) {
      setError(new Error('leadId and prospectorId are required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prospector/ai-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, prospectorId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = (await response.json()) as ComprehensiveRecommendation;
      setRecommendations(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, prospectorId]);

  // Auto-fetch on mount or when leadId/prospectorId changes
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
  };
}

/**
 * Hook para buscar apenas recomendação de próxima ação
 */
export function useNextAction(
  leadId: string,
  prospectorId: string
): Omit<UseAIRecommendationsReturn, 'recommendations'> & { nextAction: AIRecommendation | null } {
  const [nextAction, setNextAction] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!leadId || !prospectorId) {
      setError(new Error('leadId and prospectorId are required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prospector/next-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, prospectorId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch next action: ${response.statusText}`);
      }

      const data = (await response.json()) as AIRecommendation;
      setNextAction(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching next action:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, prospectorId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    nextAction,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook para buscar predição de conversão
 */
export function useConversionPrediction(
  leadId: string,
  prospectorId: string
): Omit<UseAIRecommendationsReturn, 'recommendations'> & { prediction: ConversionPrediction | null } {
  const [prediction, setPrediction] = useState<ConversionPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!leadId || !prospectorId) {
      setError(new Error('leadId and prospectorId are required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prospector/conversion-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, prospectorId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversion prediction: ${response.statusText}`);
      }

      const data = (await response.json()) as ConversionPrediction;
      setPrediction(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching conversion prediction:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, prospectorId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    prediction,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook para buscar sequência de follow-ups
 */
export function useFollowUpSequence(
  leadId: string,
  prospectorId: string
): Omit<UseAIRecommendationsReturn, 'recommendations'> & { sequence: FollowUpStep[] | null } {
  const [sequence, setSequence] = useState<FollowUpStep[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!leadId || !prospectorId) {
      setError(new Error('leadId and prospectorId are required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prospector/followup-sequence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, prospectorId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch follow-up sequence: ${response.statusText}`);
      }

      const data = (await response.json()) as FollowUpStep[];
      setSequence(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching follow-up sequence:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, prospectorId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    sequence,
    loading,
    error,
    refetch,
  };
}
