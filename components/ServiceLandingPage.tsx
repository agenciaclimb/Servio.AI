
import React, { useState, useEffect } from 'react';
import { FiClock, FiTag } from 'react-icons/fi';
import { fetchJobById } from '../services/api';
import { Job } from '../types';
import SkeletonBlock from './skeletons/SkeletonBlock';

interface ServiceLandingPageProps {
  serviceId: string;
}

const ServiceLandingPage: React.FC<ServiceLandingPageProps> = ({ serviceId }) => {
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJob = async () => {
            if (!serviceId) {
                setError('ID de serviço inválido.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const fetchedJob = await fetchJobById(serviceId);
                if (fetchedJob) {
                    setJob(fetchedJob);
                } else {
                    setError('Serviço não encontrado ou indisponível.');
                }
            } catch (err) {
                setError('Serviço não encontrado ou indisponível.');
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [serviceId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto p-8">
                    <SkeletonBlock className="h-12 w-3/4 mb-4" />
                    <SkeletonBlock className="h-6 w-1/2 mb-6" />
                    <SkeletonBlock className="h-72 w-full mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SkeletonBlock className="h-24 w-full" />
                        <SkeletonBlock className="h-24 w-full" />
                        <SkeletonBlock className="h-24 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-red-500">{error}</div>;
    }

    if (!job) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500">Serviço não encontrado.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto py-6 px-8">
                    <h1 className="text-4xl font-bold text-gray-800 capitalize">{job.category}</h1>
                    <p className="text-lg text-gray-500 mt-1 capitalize">{job.serviceType}</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-8">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Descrição do Serviço</h2>
                        <p className="text-gray-600 whitespace-pre-wrap">{job.description}</p>
                    </div>

                    <div className="bg-gray-50 p-8 border-t">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Detalhes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {job.fixedPrice != null && (
                                <div className="flex items-start">
                                    <FiTag className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <span className="font-semibold">Preço Fixo</span>
                                        <p className="text-gray-600">R$ {job.fixedPrice.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                             {job.visitFee != null && (
                                <div className="flex items-start">
                                    <FiTag className="h-6 w-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <span className="font-semibold">Taxa de Visita</span>
                                        <p className="text-gray-600">R$ {job.visitFee.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start">
                                <FiClock className="h-6 w-6 text-orange-500 mt-1 mr-3 flex-shrink-0" />
                                <div>
                                    <span className="font-semibold">Urgência</span>
                                    <p className="text-gray-600 capitalize">{job.urgency.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ServiceLandingPage;
