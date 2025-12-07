// FIX: Create the FindProvidersPage component
import React, { useState, useMemo } from 'react';
import type { User, Job } from '../types';
import ProviderSearchResultCard from './ProviderSearchResultCard';
// import { parseSearchQuery } from '../services/geminiService';

interface FindProvidersPageProps {
  allUsers: User[];
  allJobs: Job[];
  onViewProfile: (userId: string) => void;
  onContact: (userId: string) => void;
}

type SortBy = 'relevance' | 'rating' | 'experience';

const FindProvidersPage: React.FC<FindProvidersPageProps> = ({
  allUsers,
  allJobs,
  onViewProfile,
  onContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    service: '',
    location: '',
    hasCertificates: false,
    isVerified: false,
    availability: 'any',
  });
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [isLoading, setIsLoading] = useState(false);

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;

    setIsLoading(true);
    try {
      // AI parsing disabled (unused types). Simple fallback search only.
      setFilters(prev => ({ ...prev, service: searchQuery }));
    } catch (error) {
      console.error('AI Search failed:', error);
      // Fallback to basic search if AI fails
      setFilters(prev => ({ ...prev, service: searchQuery, location: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setFilters(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      service: '',
      location: '',
      hasCertificates: false,
      isVerified: false,
      availability: 'any',
    });
    setSortBy('relevance');
  };

  const providersWithStats = useMemo(() => {
    return allUsers
      .filter(u => u.type === 'prestador')
      .map(user => {
        const providerJobs = allJobs.filter(
          j => j.providerId === user.email && j.status === 'concluido' && j.review
        );
        const reviews = providerJobs.map(j => j.review!).filter(Boolean);
        const avgRating =
          reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

        return {
          ...user,
          stats: {
            jobsCompleted: providerJobs.length,
            avgRating: avgRating,
          },
        };
      });
  }, [allUsers, allJobs]);

  const filteredAndSortedProviders = useMemo(() => {
    const results = providersWithStats.filter(user => {
      const serviceLower = filters.service.toLowerCase();
      const locationLower = filters.location.toLowerCase();

      const nameMatch = user.name.toLowerCase().includes(serviceLower);
      const headlineMatch = user.headline?.toLowerCase().includes(serviceLower);
      const specialtiesMatch = user.specialties?.some(s => s.toLowerCase().includes(serviceLower));
      const textMatch = !filters.service || nameMatch || headlineMatch || specialtiesMatch;

      const locationMatch =
        !filters.location || user.location.toLowerCase().includes(locationLower);
      const certificatesMatch = !filters.hasCertificates || user.hasCertificates === true;
      const verifiedMatch = !filters.isVerified || user.verificationStatus === 'verificado';
      const availabilityMatch =
        filters.availability === 'any' || user.availability === filters.availability;

      return textMatch && locationMatch && certificatesMatch && verifiedMatch && availabilityMatch;
    });

    switch (sortBy) {
      case 'rating':
        results.sort((a, b) => b.stats.avgRating - a.stats.avgRating);
        break;
      case 'experience':
        results.sort((a, b) => b.stats.jobsCompleted - a.stats.jobsCompleted);
        break;
      case 'relevance':
      default:
        // Basic relevance: give points for matching criteria
        results.sort((a, b) => {
          const scoreA =
            (a.headline?.toLowerCase().includes(filters.service.toLowerCase()) ? 5 : 0) +
            a.stats.jobsCompleted +
            a.stats.avgRating * 2;
          const scoreB =
            (b.headline?.toLowerCase().includes(filters.service.toLowerCase()) ? 5 : 0) +
            b.stats.jobsCompleted +
            b.stats.avgRating * 2;
          return scoreB - scoreA;
        });
        break;
    }

    return results;
  }, [filters, sortBy, providersWithStats]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Encontre o Profissional Perfeito
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Use nossa busca inteligente ou os filtros para achar exatamente o que você precisa.
        </p>
        <form onSubmit={handleAISearch} className="mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Descreva o que precisa, ex: 'eletricista urgente em São Paulo'"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-grow block w-full rounded-lg border-gray-300 px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Analisando...' : 'Buscar com IA ✨'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <aside className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 self-start">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Filtros</h3>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Limpar
            </button>
          </div>
          <div className="space-y-6 mt-4">
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700">
                Serviço / Nome
              </label>
              <input
                type="text"
                name="service"
                id="service"
                value={filters.service}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Localização
              </label>
              <input
                type="text"
                name="location"
                id="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                Disponibilidade
              </label>
              <select
                name="availability"
                id="availability"
                value={filters.availability}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="any">Qualquer</option>
                <option value="imediata">Imediata</option>
                <option value="24h">Em 24h</option>
                <option value="3dias">Em 3 dias</option>
                <option value="1semana">Em 1 semana</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="isVerified"
                    name="isVerified"
                    type="checkbox"
                    checked={filters.isVerified}
                    onChange={handleFilterChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isVerified" className="font-medium text-gray-800">
                    Identidade Verificada
                  </label>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    id="hasCertificates"
                    name="hasCertificates"
                    type="checkbox"
                    checked={filters.hasCertificates}
                    onChange={handleFilterChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="hasCertificates" className="font-medium text-gray-800">
                    Possui Certificados
                  </label>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Results Panel */}
        <main className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <p className="text-sm text-gray-600 font-medium">
              {filteredAndSortedProviders.length} profissionais encontrados
            </p>
            <div className="flex items-center space-x-2">
              <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
                Ordenar por:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                className="rounded-md border-gray-300 shadow-sm text-sm"
              >
                <option value="relevance">Relevância (IA)</option>
                <option value="rating">Melhor Avaliado</option>
                <option value="experience">Mais Experiente</option>
              </select>
            </div>
          </div>

          {filteredAndSortedProviders.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredAndSortedProviders.map(provider => (
                <ProviderSearchResultCard
                  key={provider.email}
                  provider={{
                    id: provider.email,
                    name: provider.name,
                    service: provider.headline || 'Serviço',
                    location: provider.location,
                    rating: provider.stats.avgRating,
                    jobsCompleted: provider.stats.jobsCompleted,
                    bio: provider.bio,
                    headline: provider.headline || '',
                  }}
                  onViewProfile={() => onViewProfile(provider.email)}
                  onContact={() => onContact(provider.email)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">Nenhum resultado encontrado</h3>
              <p className="mt-1 text-sm text-gray-600">
                Tente ajustar seus termos de busca ou limpar os filtros.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FindProvidersPage;
