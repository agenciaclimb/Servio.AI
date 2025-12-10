import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PotentialMatch, User } from '../types';
import { logInfo } from '../utils/logger';

interface MatchingResultsProps {
  jobId: string;
}

/**
 * Fetch potential matches for a job from the API
 * @param jobId - The job ID to fetch matches for
 * @returns Promise with matches array
 */
async function fetchMatchesForJob(jobId: string): Promise<(PotentialMatch & { provider?: User })[]> {
  if (!jobId) {
    throw new Error('Job ID is required');
  }

  const response = await fetch(`/api/v2/jobs/${jobId}/potential-matches`);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch matches: ${response.statusText}`);
  }

  const data = await response.json();
  return data.matches || [];
}

/**
 * MatchingResults Component
 *
 * Displays a list of potential matching providers for a job.
 * Fetches provider data from the potential_matches subcollection in Firestore
 * using React Query for caching, revalidation, and background updates.
 * Shows loading, empty, and error states appropriately.
 *
 * @component
 * @param {string} jobId - The ID of the job to fetch matching providers for
 * @returns {React.ReactElement} The rendered component
 */
const MatchingResults: React.FC<MatchingResultsProps> = ({ jobId }) => {
  const {
    data: matches = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['potentialMatches', jobId],
    queryFn: () => fetchMatchesForJob(jobId),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (cache time)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Loading state
  if (isLoading) {
    return (
      <div
        data-testid="matching-results-loading"
        className="flex justify-center items-center py-12"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Buscando prestadores compatíveis...</p>
        </div>
      </div>
    );
  }

  // Error state
  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  if (isError) {
    return (
      <div
        data-testid="matching-results-error"
        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar resultados</h3>
            <div className="mt-2 text-sm text-red-700">{errorMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (matches.length === 0) {
    return (
      <div
        data-testid="matching-results-empty"
        className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center"
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum prestador encontrado</h3>
        <p className="mt-2 text-sm text-gray-500">
          Não há prestadores disponíveis que correspondam aos critérios do seu trabalho.
        </p>
      </div>
    );
  }

  // Results state
  return (
    <div data-testid="matching-results-container" className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900">
          Encontramos {matches.length} prestador{matches.length !== 1 ? 'es' : ''} compatível
          {matches.length !== 1 ? 's' : ''}
        </h3>
        <p className="mt-2 text-sm text-blue-700">
          Classific{matches.length !== 1 ? 'ados' : 'ado'} por compatibilidade com seu trabalho.
        </p>
      </div>

      <div data-testid="matching-results-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map(match => (
          <div
            key={match.provider_id}
            data-testid={`matching-result-${match.provider_id}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {match.provider?.name || match.provider_id}
                </h4>
                {match.provider?.headline && (
                  <p className="text-sm text-gray-600 mt-1">{match.provider.headline}</p>
                )}
              </div>
              <div
                className="bg-green-100 rounded-full px-3 py-1 text-sm font-semibold text-green-800"
                data-testid={`match-score-${match.provider_id}`}
              >
                {Math.round(match.score * 100)}%
              </div>
            </div>

            {match.provider?.location && (
              <p className="text-sm text-gray-600 mb-2">📍 {match.provider.location}</p>
            )}

            {match.provider?.specialties && match.provider.specialties.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Especialidades:</p>
                <div className="flex flex-wrap gap-1">
                  {match.provider.specialties.slice(0, 3).map(specialty => (
                    <span
                      key={specialty}
                      className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-700"
                    >
                      {specialty}
                    </span>
                  ))}
                  {match.provider.specialties.length > 3 && (
                    <span className="inline-block text-xs text-gray-500 px-2 py-1">
                      +{match.provider.specialties.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Taxa de Conclusão</p>
                <p className="font-semibold text-gray-900">
                  {match.provider?.completionRate
                    ? `${Math.round((match.provider.completionRate as unknown as number) * 100)}%`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tempo de Resposta</p>
                <p className="font-semibold text-gray-900">
                  {match.provider?.avgResponseTimeMinutes
                    ? `${match.provider.avgResponseTimeMinutes}h`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {match.status && (
              <div className="mb-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    match.status === 'suggested'
                      ? 'bg-blue-100 text-blue-800'
                      : match.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                  data-testid={`match-status-${match.provider_id}`}
                >
                  {match.status === 'suggested'
                    ? 'Sugerido'
                    : match.status === 'accepted'
                      ? 'Aceito'
                      : 'Rejeitado'}
                </span>
              </div>
            )}

            <button
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
              data-testid={`match-contact-${match.provider_id}`}
              onClick={() => {
                // TODO: Implement contact/invite logic
                logInfo(`Contact clicked for provider ${match.provider_id}`, {
                  component: 'MatchingResults',
                  action: 'contact',
                });
              }}
            >
              Entrar em Contato
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchingResults;
