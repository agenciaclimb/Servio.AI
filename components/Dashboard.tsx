import React, { useState } from 'react';
import ServiceRequestForm from './ServiceRequestForm';
import ProviderCard from './ProviderCard';
import LoadingSpinner from './LoadingSpinner';
import { getMatchingProviders } from '../services/geminiService';
// FIX: Import the Job type to create a valid job object.
import { MatchingResult, User, Job } from '../types';

interface DashboardProps {
  user: User;
  // FIX: Add allUsers and allJobs to props to be available for getMatchingProviders.
  allUsers: User[];
  allJobs: Job[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, allUsers, allJobs }) => {
  const [description, setDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<MatchingResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !selectedCategory) {
      setError("Por favor, descreva o serviço e selecione uma categoria.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // FIX: Create a job object that matches the signature of getMatchingProviders.
      const job: Job = {
        id: `temp-job-${Date.now()}`,
        clientId: user.email,
        category: selectedCategory,
        description,
        status: 'ativo',
        createdAt: new Date(),
        serviceType: 'personalizado', // Assume a default service type
        urgency: '1semana', // Assume a default urgency
      };
      const matchingResults = await getMatchingProviders(job, allUsers, allJobs);
      setResults(matchingResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const WelcomeMessage = () => (
    <div className="text-center py-10 px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Seu painel está pronto!</h2>
      <p className="text-gray-600 max-w-2xl mx-auto">
        Utilize o formulário acima para encontrar os melhores profissionais para o seu serviço.
      </p>
    </div>
  );

  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-8">Seu Painel, {user.email}!</h1>
        <div className="max-w-4xl mx-auto">
            <ServiceRequestForm
                description={description}
                setDescription={setDescription}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                // FIX: Add the missing 'submitButtonText' prop required by ServiceRequestFormProps.
                submitButtonText="Encontrar Profissionais"
            />

            <div className="mt-12">
                {isLoading && <LoadingSpinner />}
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">Erro</p>
                        <p>{error}</p>
                    </div>
                )}
                
                {!isLoading && !results && !error && <WelcomeMessage />}

                {results && results.length > 0 && (
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">Resultados Encontrados</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {results.map((result, index) => (
                                <ProviderCard key={index} result={result} />
                            ))}
                        </div>
                    </div>
                )}

                {results && results.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-600">Nenhum profissional encontrado. Tente refinar sua busca.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;