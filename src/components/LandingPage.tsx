import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import StructuredDataSEO from './StructuredDataSEO';
import PublicLayout from './PublicLayout';
import SEOMetaTags from './SEOMetaTags';

interface LandingPageProps {
  onSearch: (query: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const popularCategories = useMemo(() => ([
    { slug: 'eletricista', label: 'Eletricista' },
    { slug: 'encanador', label: 'Encanador' },
    { slug: 'pintor', label: 'Pintor' },
    { slug: 'ar-condicionado', label: 'Instalação de Ar-Condicionado' },
    { slug: 'montador-moveis', label: 'Montador de Móveis' },
    { slug: 'diarista', label: 'Diarista' },
  ]), []);

  const featuredCategories = useMemo(() => ([
    { slug: 'eletricista', label: 'Eletricista', desc: 'Instalações elétricas, reparos e manutenção' },
    { slug: 'encanador', label: 'Encanador', desc: 'Vazamentos, entupimentos e instalações' },
    { slug: 'pintor', label: 'Pintor', desc: 'Pintura residencial e comercial' },
    { slug: 'ar-condicionado', label: 'Ar-Condicionado', desc: 'Instalação, manutenção e conserto' },
  ]), []);

  const cities = useMemo(() => ([
    { slug: 'sao-paulo', name: 'São Paulo' },
    { slug: 'rio-de-janeiro', name: 'Rio de Janeiro' },
    { slug: 'belo-horizonte', name: 'Belo Horizonte' },
    { slug: 'brasilia', name: 'Brasília' },
    { slug: 'curitiba', name: 'Curitiba' },
    { slug: 'porto-alegre', name: 'Porto Alegre' },
  ]), []);

  const faqItems = useMemo(() => ([
    { q: 'Como funciona a SERVIO.AI?', a: 'Você descreve sua necessidade, nossa IA cria um pedido claro e você recebe propostas de profissionais verificados.' },
    { q: 'É grátis solicitar orçamento?', a: 'Sim. Você só paga quando contratar um profissional.' },
    { q: 'Como é feito o pagamento?', a: 'Usamos pagamentos protegidos: o prestador só recebe após o serviço concluído.' },
    { q: 'Os profissionais são verificados?', a: 'Sim. Validamos documentos, avaliamos histórico e monitoramos qualidade.' },
    { q: 'Quanto tempo leva para receber propostas?', a: 'Geralmente em poucas horas. Serviços urgentes recebem propostas ainda mais rápido.' },
    { q: 'Posso cancelar um serviço agendado?', a: 'Sim, consulte nossa política de cancelamento nos Termos de Serviço.' },
  ]), []);

  const hostname = typeof window !== 'undefined' ? window.location.origin : 'https://servio.ai';

  return (
    <PublicLayout>
      <SEOMetaTags 
        title="SERVIO.AI - Encontre o profissional perfeito com IA"
        description="Descreva sua necessidade e nossa IA conecta você aos melhores profissionais verificados. Pagamento seguro, orçamento grátis."
        canonical="/"
      />
      <div>
        <div className="text-center py-20 px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tighter">
            Qual problema podemos
            <span className="block text-blue-600">resolver para você hoje?</span>
          </h1>
          <p className="mt-4 max-w-md mx-auto text-lg text-gray-500 dark:text-gray-400 sm:text-xl md:mt-5 md:max-w-3xl">
            Simplesmente descreva sua necessidade abaixo e deixe nossa IA criar um pedido de serviço detalhado para os melhores profissionais.
          </p>
          
          <form onSubmit={handleSubmit} className="mt-10 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-grow w-full px-5 py-4 text-base text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Preciso instalar um ventilador de teto no n..."
              />
              <button type="submit" className="px-8 py-4 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Começar Agora ✨
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Ou <Link to="/login" className="font-medium text-blue-600 hover:underline">seja um prestador de serviço</Link>.</p>
          </form>
        </div>

        {/* Popular category links for internal linking and UX */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Serviços populares</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {popularCategories.map(cat => (
              <Link key={cat.slug} to={`/servicos/${cat.slug}`} className="group border rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50">
                <span className="group-hover:text-blue-700 font-medium">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[{
              t: 'Descreva seu problema', d: 'Conte rapidamente o que você precisa, fotos são bem-vindas.'
            },{ t: 'IA monta seu pedido', d: 'Geramos um pedido claro para profissionais qualificados.' },{ t: 'Receba propostas', d: 'Compare, converse e agende com segurança.' }].map((s, i) => (
              <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="text-2xl mb-2">{i+1}.</div>
                <h3 className="font-semibold text-gray-900">{s.t}</h3>
                <p className="text-gray-600 mt-1 text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Categories */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Categorias em destaque</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {featuredCategories.map(cat => (
                <Link key={cat.slug} to={`/servicos/${cat.slug}`} className="group bg-white border rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">{cat.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{cat.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Cities served */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Cidades atendidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {cities.map(city => (
              <Link key={city.slug} to={`/servicos/reparos/${city.slug}`} className="text-center border rounded-lg px-3 py-4 text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                {city.name}
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ expandido */}
        <section className="bg-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Perguntas frequentes</h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <details key={i} className="border rounded-lg p-4 group">
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none group-open:text-blue-700">
                    {item.q}
                  </summary>
                  <p className="text-gray-600 mt-2 text-sm">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* SEO structured data for homepage */}
      <StructuredDataSEO schemaType="WebSite" data={{
        name: 'SERVIO.AI',
        url: hostname,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${hostname}/servicos?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        }
      }} />

      <StructuredDataSEO schemaType="Organization" data={{
        name: 'SERVIO.AI',
        url: hostname,
        logo: `${hostname}/vite.svg`,
      }} />

      <StructuredDataSEO schemaType="FAQPage" data={{
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a }
        }))
      }} />

      {/* HowTo schema para os 3 passos */}
      <StructuredDataSEO schemaType="HowTo" data={{
        name: 'Como contratar um profissional na SERVIO.AI',
        description: 'Guia passo a passo para solicitar serviços com IA',
        step: [
          { '@type': 'HowToStep', name: 'Descreva seu problema', text: 'Conte rapidamente o que você precisa, fotos são bem-vindas.' },
          { '@type': 'HowToStep', name: 'IA monta seu pedido', text: 'Geramos um pedido claro para profissionais qualificados.' },
          { '@type': 'HowToStep', name: 'Receba propostas', text: 'Compare, converse e agende com segurança.' },
        ]
      }} />
    </PublicLayout>
  );
};

export default LandingPage;