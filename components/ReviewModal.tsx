
import React, { useState } from 'react';
import { Job } from '../types';
import StarRatingInput from './StarRatingInput';
import { generateReviewComment } from '../services/geminiService';

interface ReviewModalProps {
  job: Job;
  onClose: () => void;
  onSubmit: (reviewData: { rating: number; comment: string }) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ job, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Por favor, selecione uma avaliação de 1 a 5 estrelas.');
      return;
    }
    onSubmit({ rating, comment });
  };
  
  const handleGenerateComment = async () => {
    if (rating === 0) {
        setError('Primeiro, selecione uma nota para a IA gerar um comentário.');
        return;
    }
    setIsGenerating(true);
    setError('');
    try {
        const generatedComment = await generateReviewComment(rating, job.category, job.description);
        setComment(generatedComment);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
        setIsGenerating(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="relative p-8">
              <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Finalizar e Avaliar Serviço</h2>
              <p className="text-gray-600 mb-6">Seu feedback é importante para a comunidade.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Sua nota para este serviço</label>
                  <StarRatingInput rating={rating} setRating={setRating} />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="comment"  className="block text-sm font-medium text-gray-700">Deixe um comentário</label>
                         <button
                            type="button"
                            onClick={handleGenerateComment}
                            disabled={isGenerating || rating === 0}
                            className="flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Gerando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Gerar com IA</span>
                                    <span className="text-sm">✨</span>
                                </>
                            )}
                        </button>
                    </div>
                    <textarea 
                      id="comment" 
                      rows={4} 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)} 
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Profissional excelente, muito pontual e o serviço ficou impecável!"
                    />
                    {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                </div>
              </div>
          </div>
          <div className="bg-gray-50 px-8 py-4 rounded-b-2xl">
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400" disabled={rating === 0}>
                Liberar Pagamento e Enviar Avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;