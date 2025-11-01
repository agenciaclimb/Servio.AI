import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CategoryPageContent } from './types';
import LoadingSpinner from './components/LoadingSpinner';

const CategoryLandingPage: React.FC = () => {
  const { category, location } = useParams<{ category: string; location?: string }>();
  const [content, setContent] = useState<CategoryPageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!category) return;
      setIsLoading(true);
      try {
        // Este endpoint é público e não precisa de autenticação
        const response = await fetch(`${import.meta.env.VITE_AI_API_URL}/api/generate-category-page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, location }),
        });
        if (!response.ok) throw new Error('Failed to fetch category content');
        const data = await response.json();
        setContent(data);
        // Atualiza o título da página para SEO
        if (data.title) {
          document.title = data.title;
        }
      } catch (error) {
        console.error("Error fetching category page content:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [category, location]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (!content) {
    return <div className="text-center p-8">Não foi possível carregar o conteúdo para esta categoria.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="text-center my-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">{content.title}</h1>
        <p className="mt-4 text-lg text-gray-600">{content.introduction}</p>
        <Link to="/" state={{ action: 'requestService', category: category }} className="mt-8 inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
          Solicitar Orçamento Gratuito
        </Link>
      </header>

      <section className="mt-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Perguntas Frequentes</h2>
        <div className="space-y-6">
          {content.faq.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-lg text-gray-900">{item.question}</h3>
              <p className="mt-2 text-gray-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CategoryLandingPage;