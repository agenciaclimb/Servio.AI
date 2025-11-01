import React, { useState, useEffect } from 'react';
import { User, ProviderProfile, CategoryPageContent } from '../types';
import { generateCategoryPageContent } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import ProviderCard from './ProviderCard';
import StructuredDataSEO from './StructuredDataSEO';


interface ServiceLandingPageProps {
  category: string;
  location?: string;
  allUsers: User[];
  serviceNameToCategory: { [key: string]: string };
}

const ServiceLandingPage: React.FC<ServiceLandingPageProps> = ({ category, location, allUsers, serviceNameToCategory }) => {
  const [content, setContent] = useState<CategoryPageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedCategory = decodeURIComponent(category || '');
  const decodedLocation = decodeURIComponent(location || '');

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const generatedContent = await generateCategoryPageContent(decodedCategory, decodedLocation);
        setContent(generatedContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar conteúdo.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [decodedCategory, decodedLocation]);

  const providers = allUsers.filter(user => {
    if (user.type !== 'prestador') return false;

    // Match by location if specified
    const locationMatch = !decodedLocation || user.location.toLowerCase().includes(decodedLocation.toLowerCase());
    
    // Match category using the map
    const headline = user.headline || '';
    const providerCategory = serviceNameToCategory[headline];
    const categoryMatch = providerCategory === decodedCategory;

    return categoryMatch && locationMatch;
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg">Erro: {error}</div>;
  }

  if (!content) {
    return <div className="text-center text-gray-500">Página não encontrada.</div>;
  }

  return (
    <div>
        <StructuredDataSEO 
            schemaType="Service"
            data={{
                name: content.title,
                description: content.introduction,
                provider: {
                    "@type": "Organization",
                    name: "SERVIO.AI"
                }
            }}
        />

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{content.title}</h1>
        <p className="mt-4 text-lg text-gray-600">{content.introduction}</p>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Profissionais disponíveis</h2>
        {providers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map(provider => (
                // Dummy conversion for display, a real app would have this structured better
                 <ProviderCard key={provider.email} result={{
                    provider: {
                        id: provider.email,
                        name: provider.name,
                        service: provider.headline || 'Serviço',
                        location: provider.location,
                        rating: 4.5, // Dummy rating
                        bio: provider.bio,
                        headline: provider.headline || ''
                    },
                    compatibilityScore: 90, // Dummy score
                    justification: "Este profissional atende aos critérios da sua busca."
                }} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 bg-gray-50 p-8 rounded-lg">Nenhum profissional encontrado para esta categoria/localização no momento.</p>
        )}
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Perguntas Frequentes (FAQ)</h2>
        <div className="space-y-4">
          {content.faq.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="font-semibold text-lg text-gray-900">{item.question}</h3>
              <p className="mt-2 text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceLandingPage;