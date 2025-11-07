import React, { useState } from 'react';

interface HeroSectionProps {
    onSmartSearch: (prompt: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSmartSearch }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(prompt.trim()) {
        onSmartSearch(prompt);
    }
  }

  return (
    <div className="text-center py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tighter">
        Qual problema podemos 
        <span className="block text-blue-600">resolver para você hoje?</span>
      </h1>
      <p className="mt-4 max-w-md mx-auto text-lg text-gray-500 sm:text-xl md:mt-5 md:max-w-3xl">
        Simplesmente descreva sua necessidade abaixo e deixe nossa IA criar um pedido de serviço detalhado para os melhores profissionais.
      </p>
      <div className="mt-8 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="sm:flex sm:gap-3">
          <div className="w-full">
            <label htmlFor="job-prompt" className="sr-only">Descreva o serviço</label>
            <input
              id="job-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="block w-full rounded-lg border-gray-300 px-5 py-4 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500 transition"
              placeholder="Ex: Preciso instalar um ventilador de teto no meu quarto"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-3 w-full sm:mt-0 sm:w-auto flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            Começar Agora ✨
          </button>
        </form>
         <p className="mt-4 text-xs text-gray-500">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>

      {/* Serviços Populares */}
      <div className="mt-16 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Serviços Mais Procurados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Eletricista', 'Encanador', 'Pintor', 'Marceneiro', 'Pedreiro', 'Jardineiro', 'Técnico de TI', 'Chaveiro'].map((service) => (
            <button
              key={service}
              onClick={() => { setPrompt(`Preciso de um ${service}`); handleSubmit(new Event('submit') as any); }}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border border-gray-200 text-gray-700 font-medium hover:bg-blue-50 hover:border-blue-300"
            >
              {service}
            </button>
          ))}
        </div>
      </div>

      {/* Cidades Atendidas */}
      <div className="mt-16 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Principais Cidades</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza', 'Recife', 'Goiânia', 'Campinas', 'Florianópolis'].map((city) => (
            <div key={city} className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700 font-medium">📍 {city}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;