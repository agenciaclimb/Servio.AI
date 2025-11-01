import React from 'react';
import { Link } from 'react-router-dom';

// Em uma aplicação real, estes dados viriam de uma API
const mockPosts = [
  {
    slug: 'como-escolher-o-eletricista-certo',
    title: 'Como Escolher o Eletricista Certo para Sua Casa?',
    excerpt: 'Não corra riscos com a parte elétrica. Aprenda os 5 passos essenciais para contratar um profissional qualificado e de confiança.',
  },
  {
    slug: 'sinais-de-vazamento-oculto',
    title: '5 Sinais de um Vazamento Oculto que Você Não Pode Ignorar',
    excerpt: 'Um pequeno vazamento pode causar grandes estragos. Descubra os sinais de alerta antes que seja tarde demais e saiba quando chamar um encanador.',
  },
  {
    slug: 'tendencias-de-pintura-para-2025',
    title: 'Tendências de Pintura para 2025: Renove Seus Ambientes',
    excerpt: 'Quer dar uma nova cara para sua casa? Conheça as cores e técnicas que estarão em alta e encontre o pintor ideal para seu projeto.',
  },
];

const BlogIndexPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="text-center my-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Blog & Dicas da SERVIO.AI</h1>
        <p className="mt-4 text-lg text-gray-600">Dicas de especialistas para cuidar da sua casa e contratar os melhores serviços.</p>
      </header>
      <div className="space-y-8">
        {mockPosts.map(post => (
          <Link to={`/blog/${post.slug}`} key={post.slug} className="block p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
            <p className="mt-2 text-gray-600">{post.excerpt}</p>
            <span className="mt-4 inline-block text-blue-600 font-semibold">Ler artigo &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BlogIndexPage;