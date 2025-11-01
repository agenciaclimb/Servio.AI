import React, { useState, useEffect } from 'react';
import { User, Job, SEOProfileContent, Review } from '../../types';
import CompletedJobCard from './CompletedJobCard';
import PublicContactCTA from './PublicContactCTA';
import StructuredDataSEO from './StructuredDataSEO';
import { summarizeReviews, generateSEOProfileContent } from '../../services/geminiService';
import LocationMap from './LocationMap';
import PortfolioGallery from './PortfolioGallery';

interface ProfilePageProps {
  user: User;
  allJobs: Job[];
  allUsers: User[];
  onBackToDashboard: () => void;
  isPublicView: boolean;
  onLoginToContact: (providerId: string) => void;
}

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className = 'w-5 h-5' }) => (
    <svg className={`${className} ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const ProfilePage: React.FC<ProfilePageProps> = ({ user, allJobs, allUsers, onBackToDashboard, isPublicView, onLoginToContact }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [seoContent, setSeoContent] = useState<SEOProfileContent | null>(null);
  const [isSeoLoading, setIsSeoLoading] = useState(false);

  const providerJobs = allJobs.filter(job => job.providerId === user.email && job.status === 'concluido' && job.review);
  const reviews = providerJobs.map(job => job.review).filter(Boolean) as Review[];
  
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / totalReviews
    : 0;

  // Effect for fetching SEO content
  useEffect(() => {
    if (user.type === 'prestador') {
        const fetchSEOContent = async () => {
            setIsSeoLoading(true);
            try {
                const content = await generateSEOProfileContent(user, reviews);
                setSeoContent(content);
            } catch (error) {
                console.error("Failed to fetch SEO content:", error);
            } finally {
                setIsSeoLoading(false);
            }
        };
        fetchSEOContent();
    }
  }, [user, reviews.length]); // Re-run if user or number of reviews changes

  // Effect for updating the document head with SEO content
  useEffect(() => {
    if (seoContent) {
        document.title = seoContent.seoTitle;
        const metaDesc = document.getElementById('meta-description');
        if (metaDesc) {
            metaDesc.setAttribute('content', seoContent.metaDescription);
        }
    }
    // Cleanup function to reset title on component unmount
    return () => {
        document.title = 'SERVIO.AI - Find the Perfect Professional';
    };
  }, [seoContent]);

  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    try {
        const result = await summarizeReviews(user.name, reviews);
        setSummary(result);
    } catch (error) {
        setSummaryError(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
    } finally {
        setIsSummaryLoading(false);
    }
  };


  return (
    <div>
      {user.type === 'prestador' && (
        <StructuredDataSEO
            schemaType="LocalBusiness"
            data={{
                name: user.name,
                description: seoContent?.metaDescription || user.bio,
                jobTitle: user.headline,
                address: {
                    "@type": "PostalAddress",
                    addressLocality: user.location.split(',')[0],
                    addressRegion: user.location.split(',')[1]?.trim(),
                },
                aggregateRating: totalReviews > 0 ? {
                    "@type": "AggregateRating",
                    ratingValue: averageRating.toFixed(1),
                    reviewCount: totalReviews
                } : undefined
            }}
        />
      )}

        {!isPublicView && (
            <button onClick={onBackToDashboard} className="mb-6 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Voltar para o Painel
            </button>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-center">
                    <div className="flex-shrink-0">
                        <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-4xl font-bold">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-6">
                        <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                        {user.type === 'prestador' && <p className="text-lg text-blue-600 font-semibold">{isSeoLoading ? 'Carregando...' : seoContent?.publicHeadline || user.headline}</p>}
                        <p className="text-sm text-gray-500 mt-1">{user.location}</p>
                    </div>
                </div>

                {user.type === 'prestador' && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center border-t border-b border-gray-200 py-6">
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{averageRating.toFixed(1)}</p>
                        <div className="flex items-center justify-center mt-1">
                             {Array.from({ length: 5 }, (_, i) => (
                                <StarIcon key={i} filled={i < Math.round(averageRating)} className="w-6 h-6" />
                            ))}
                        </div>
                        <p className="text-sm text-gray-500">Avaliação Média</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{providerJobs.length}</p>
                        <p className="text-sm text-gray-500">Jobs Concluídos</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{new Date(user.memberSince).toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm text-gray-500">Membro Desde</p>
                    </div>
                </div>
                )}

                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-800">Sobre</h2>
                    <p className="mt-2 text-gray-600 whitespace-pre-wrap">{isSeoLoading ? 'Carregando...' : seoContent?.publicBio || user.bio || "Nenhuma biografia fornecida."}</p>
                </div>
                
                {user.type === 'prestador' && user.portfolio && user.portfolio.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-gray-800">Portfólio</h2>
                        <PortfolioGallery items={user.portfolio} />
                    </div>
                )}
                
                 {user.type === 'prestador' && (
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Área de Atuação</h2>
                        <LocationMap locations={[{id: user.email, name: user.location, type: 'provider'}]} />
                    </div>
                )}


                {isPublicView && user.type === 'prestador' && (
                    <PublicContactCTA
                        providerName={user.name}
                        onContactClick={() => onLoginToContact(user.email)}
                    />
                )}

                {user.type === 'prestador' && totalReviews > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        {!summary && !isSummaryLoading && !summaryError && (
                             <button 
                                onClick={handleGenerateSummary}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition"
                            >
                                <span>Gerar Resumo das Avaliações com IA</span>
                                <span className="text-lg">✨</span>
                            </button>
                        )}
                        {isSummaryLoading && (
                            <div className="text-center p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-600">Analisando avaliações...</p>
                            </div>
                        )}
                         {summaryError && (
                            <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">
                                <p className="font-semibold">Erro!</p>
                                <p className="text-sm">{summaryError}</p>
                            </div>
                         )}
                        {summary && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Análise por IA das Avaliações</h3>
                                <blockquote className="mt-2 p-4 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg">
                                    <p className="italic text-gray-700">"{summary}"</p>
                                </blockquote>
                            </div>
                        )}
                    </div>
                )}
            </div>

             {user.type === 'prestador' && providerJobs.length > 0 && (
                <div className="bg-slate-50 p-8 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Histórico de Trabalho e Avaliações</h2>
                    <div className="space-y-4">
                        {providerJobs.map(job => (
                            <CompletedJobCard 
                                key={job.id} 
                                job={job} 
                                client={allUsers.find(u => u.email === job.clientId)} 
                            />
                        ))}
                    </div>
                </div>
             )}
        </div>
    </div>
  );
};

export default ProfilePage;