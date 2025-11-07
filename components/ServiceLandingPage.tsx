import React, { useState, useEffect } from 'react';
import { User } from '../types';
import * as API from '../services/api';
import { SkeletonBlock } from './skeletons/SkeletonBlock';

interface ServiceLandingPageProps {
  category: string;
  location?: string;
  serviceNameToCategory: (name: string) => string;
}

const ProviderCardSkeleton: React.FC = () => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3">
    <div className="flex items-center gap-4">
      <SkeletonBlock className="w-16 h-16 rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonBlock className="h-5 w-1/2" />
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>
    </div>
  </div>
);

const ServiceLandingPage: React.FC<ServiceLandingPageProps> = ({ category, location }) => {
  const [providers, setProviders] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvidersData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // In a real backend, this would be filtered by category and location
        const fetchedProviders = await API.fetchProviders();
        setProviders(fetchedProviders.filter(p => p.specialties?.includes(category)));
      } catch (err) {
        setError("Não foi possível carregar os prestadores de serviço.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProvidersData();
  }, [category, location]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Prestadores de Serviço para <span className="text-blue-600">{category}</span>
      </h1>
      {location && <p className="text-lg text-gray-600 mb-8">em {location}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <ProviderCardSkeleton key={i} />)}
        {!isLoading && error && <p className="text-red-500 col-span-full">{error}</p>}
        {!isLoading && providers.length === 0 && !error && (
          <p className="text-gray-500 col-span-full">Nenhum prestador encontrado para esta categoria.</p>
        )}
        {/* Here you would map over `providers` and render a real ProviderCard component */}
      </div>
    </div>
  );
};

export default ServiceLandingPage;