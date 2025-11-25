import React, { useState } from 'react';

interface ReviewModalProps {
  jobId: string;
  onClose: () => void;
  onSubmit: (jobId: string, rating: number, comment: string) => void;
}

const StarRating: React.FC<{ rating: number; setRating: (r: number) => void }> = ({ rating, setRating }) => (
  <div className="flex justify-center space-x-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setRating(star)}
        className={`text-4xl transition-transform transform hover:scale-125 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const ReviewModal: React.FC<ReviewModalProps> = ({ jobId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    setIsLoading(true);
    await onSubmit(jobId, rating, comment);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Avalie o Serviço</h2>
        <p className="text-gray-600 mb-6 text-center">Sua opinião é muito importante para a comunidade SERVIO.AI.</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Deixe um comentário sobre sua experiência (opcional)..."
          />
          <div className="mt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading || rating === 0} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;