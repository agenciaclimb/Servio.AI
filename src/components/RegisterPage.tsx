import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Job } from '../../types';
import LoadingSpinner from './LoadingSpinner';

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Placeholder sem dependências do AppContext; integração de cadastro será adicionada futuramente.

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobId = searchParams.get('jobId');
  const prospectId = searchParams.get('prospectId');

  useEffect(() => {
    if (jobId) {
      const fetchJobDetails = async () => {
        setIsLoading(true);
        try {
          // Este endpoint deve ser público ou usar uma chave de API se necessário
          const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/jobs/${jobId}`);
          if (!response.ok) {
            throw new Error('Oportunidade não encontrada.');
          }
          const jobData: Job = await response.json();
          setJob(jobData);
        } catch (err) {
          setError('Não foi possível carregar os detalhes da oportunidade.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchJobDetails();
    }
  }, [jobId]);

  const WelcomeMessage: React.FC = () => {
    if (!jobId) {
      return <h1 className="text-3xl font-bold text-gray-900">Crie sua Conta na SERVIO.AI</h1>;
    }
    if (isLoading) {
      return <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse"></div>;
    }
    if (job) {
      return (
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Você foi convidado para uma oportunidade de <span className="text-blue-600">{job.category}</span>!
          </h1>
          <p className="mt-2 text-gray-600">Crie seu perfil gratuito para ver os detalhes e enviar sua proposta.</p>
        </div>
      );
    }
    return <h1 className="text-3xl font-bold text-gray-900">Crie sua Conta na SERVIO.AI</h1>;
  };

  // Supondo que o formulário de registro seja um componente separado ou definido aqui
  const handleRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    navigate('/login');
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <WelcomeMessage />
        </div>
        {/* Aqui entraria o formulário de cadastro */}
        <form className="mt-8 space-y-6" onSubmit={handleRegistration}>
          {/* Campos de Nome, Email, Senha, etc. */}
          <p className="text-center text-sm text-gray-500">Formulário de cadastro aqui.</p>
          <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Criar Conta
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
