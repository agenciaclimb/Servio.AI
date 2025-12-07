import React from 'react';

interface ServiceRequestFormProps {
  description: string;
  setDescription: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  submitButtonText: string;
}

const serviceCategories = [
  { id: 'limpeza', name: 'Limpeza', icon: '✨' },
  { id: 'reparos', name: 'Reparos', icon: '🔧' },
  { id: 'aulas', name: 'Aulas', icon: '🎓' },
  { id: 'eventos', name: 'Eventos', icon: '🎉' },
  { id: 'design', name: 'Design', icon: '🎨' },
  { id: 'saude', name: 'Saúde', icon: '❤️' },
  { id: 'ti', name: 'TI & Suporte', icon: '💻' },
];

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  description,
  setDescription,
  selectedCategory,
  setSelectedCategory,
  onSubmit,
  isLoading,
  submitButtonText,
}) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100">
      <form onSubmit={onSubmit}>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="service-description"
              className="block text-lg font-semibold text-gray-800 mb-2"
            >
              1. Descreva o serviço que você precisa
            </label>
            <textarea
              id="service-description"
              rows={5}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out p-4"
              placeholder="Ex: Preciso de um pintor para preparar e pintar as paredes de um quarto de 12m². As paredes estão em bom estado."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">2. Selecione uma categoria</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {serviceCategories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  disabled={isLoading}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ease-in-out text-center
                    ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-3xl mb-1">{category.icon}</span>
                  <span className="font-semibold text-sm">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !description || !selectedCategory}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Publicando...
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ServiceRequestForm;
