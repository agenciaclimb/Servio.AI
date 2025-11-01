import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Job } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { auth } from '../firebaseConfig'; // Import auth for token
import LocationMap from './LocationMap';

const PortfolioItem: React.FC<{ job: Job }> = ({ job }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (job.media && job.media.length > 0) {
      const firstImage = job.media.find(m => m.type === 'image');
      if (firstImage) {
        const storage = getStorage();
        const fileRef = ref(storage, firstImage.path);
        getDownloadURL(fileRef)
          .then(setImageUrl)
          .catch(err => console.error("Error fetching portfolio image:", err));
      }
    }
  }, [job.media]);

  if (!imageUrl) return null;

  return (
    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
      <img src={imageUrl} alt={job.category} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-end p-4">
        <p className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{job.category}</p>
      </div>
    </div>
  );
};

const PublicProfilePage: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<User | null>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!providerId) return;
      setIsLoading(true);
      try {
        const [userResponse, jobsResponse] = await Promise.all([
          // Pass token for authenticated requests
          fetch(`${process.env.REACT_APP_BACKEND_API_URL}/users/${providerId}`),
          fetch(`${process.env.REACT_APP_BACKEND_API_URL}/jobs?providerId=${providerId}`)
        ]);
        const userData: User = await userResponse.json();
        const allJobs: Job[] = await jobsResponse.json();

        setProvider(userData);
        setCompletedJobs(allJobs.filter(job => job.status === 'concluido' && job.review));
      } catch (error) {
        console.error("Failed to fetch provider profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [providerId]);

  useEffect(() => {
    if (provider?.seo) {
      document.title = provider.seo.seoTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', provider.seo.metaDescription);
      }
    }
  }, [provider]);

  if (isLoading) return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;
  if (!provider) return <div className="text-center p-8">Perfil do prestador não encontrado.</div>;

  const averageRating = completedJobs.length > 0
    ? (completedJobs.reduce((acc, job) => acc + (job.review?.rating || 0), 0) / completedJobs.length).toFixed(1)
    : 'N/A';

  const handleRequestQuote = () => {
    // This will be caught by App.tsx to open the wizard with the target provider
    navigate('/', { state: { targetProviderId: provider.email, action: 'requestQuote' } });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{provider.seo?.publicHeadline || provider.name}</h1>
          <p className="text-xl text-blue-600 font-semibold mt-1">{provider.headline}</p>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">{provider.bio}</p>
          <div className="mt-4 text-sm text-gray-500">Membro desde {new Date(provider.memberSince).toLocaleDateString()}</div>
          <button onClick={handleRequestQuote} className="mt-6 px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-lg transition transform hover:scale-105">
            Solicitar Orçamento para {provider.name.split(' ')[0]}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-10">
          <div><div className="text-3xl font-bold text-gray-800">{averageRating} ★</div><div className="text-sm text-gray-500">Avaliação Média</div></div>
          <div><div className="text-3xl font-bold text-gray-800">{completedJobs.length}</div><div className="text-sm text-gray-500">Serviços Concluídos</div></div>
          <div><div className="text-3xl font-bold text-gray-800">{provider.specialties?.length || 0}</div><div className="text-sm text-gray-500">Especialidades</div></div>
        </div>

        {/* Location Section */}
        {provider.location && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Área de Atuação</h2>
            <LocationMap locations={[{ id: provider.email, name: provider.location, type: 'provider' }]} />
          </section>
        )}

        {/* Portfolio Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Portfólio</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedJobs.filter(j => j.media && j.media.length > 0).map(job => <PortfolioItem key={job.id} job={job} />)}
          </div>
        </section>

        {/* Reviews Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Avaliações Recentes</h2>
          <div className="space-y-4">
            {completedJobs.map(job => job.review && <div key={job.id} className="bg-gray-50 p-4 rounded-lg border"><p className="italic">"{job.review.comment}"</p><p className="text-right text-sm font-semibold mt-2">- {job.clientId.split('@')[0]}</p></div>)}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PublicProfilePage;