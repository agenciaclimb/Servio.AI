import React, { useState, useEffect } from 'react';
import { Job, FAQItem } from '../types';
import { generateJobFAQ } from '../services/geminiService';

interface JobFAQModalProps {
  job: Job;
  onClose: () => void;
}

const JobFAQModal: React.FC<JobFAQModalProps> = ({ job, onClose }) => {
  const [faq, setFaq] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQ = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const generatedFaq = await generateJobFAQ(job);
        setFaq(generatedFaq);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar FAQ.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFAQ();
  }, [job]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <header className="relative p-6 border-b border-gray-200">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800">FAQ Rápida do Job (Gerada por IA)</h2>
            <p className="text-sm text-gray-500 mt-1">Perguntas que você talvez queira fazer ao cliente.</p>
        </header>
        
        <main className="p-6">
            {isLoading && <p className="text-center animate-pulse">Analisando job...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!isLoading && !error && (
                <div className="space-y-4">
                    {faq.map((item, index) => (
                        <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-gray-800">P: {item.question}</h3>
                            <p className="mt-1 text-sm text-gray-600">R: {item.answer}</p>
                        </div>
                    ))}
                </div>
            )}
        </main>

        <footer className="p-4 bg-gray-50 border-t border-gray-200 text-right rounded-b-2xl">
            <button 
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            >
                Entendido
            </button>
        </footer>
      </div>
    </div>
  );
};

export default JobFAQModal;