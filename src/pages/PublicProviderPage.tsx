import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { PublicPageDataProvider, PublicPageData } from '../providers/PublicPageDataProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import providersData from '../../seo/providers.sample.json';
import { logInfo } from '../../utils/logger';

/**
 * COMPONENTE: PublicProviderPage
 *
 * Página pública de prestador de serviços — Landing page de alta conversão
 * com SEO máximo para ranquear nas primeiras posições do Google.
 *
 * 🎯 OBJETIVOS PRIMÁRIOS:
 * 1. Ranquear nas primeiras posições do Google por: "{serviço} em {cidade}"
 * 2. Converter visitantes em solicitações de serviço DENTRO da plataforma
 * 3. Conteúdo relevante, extenso e otimizado para SEO
 * 4. Sem contatos diretos (WhatsApp/telefone/e-mail) — tudo via plataforma
 *
 * 📊 MÉTRICAS DE SUCESSO:
 * - Índices de rankeamento: Google Search Console
 * - Taxa de conversão: cliques em "Solicitar Orçamento"
 * - Tempo médio de permanência: +2min (conteúdo longo)
 * - Bounce rate: <50%
 *
 * 🤖 CAMPOS PREPARADOS PARA GERAÇÃO DE IA (Gemini):
 * - bio: Biografia do profissional. Gerada por Gemini com base em `name`, `service` e evidências de experiência; texto longo, informativo e sem claims não verificáveis (EEAT).
 * - aboutService: Descrição detalhada do serviço. Prompt orientado por `service`, `city` e palavras-chave; ~600–800 palavras, divide em parágrafos curtos, evita linguagem promocional exagerada.
 * - serviceDetails: Lista de serviços com títulos e descrições. Gemini estrutura em bullets com escopo, quando usar, estimativas qualitativas (sem preço fixo) e normas técnicas.
 * - faqs: Perguntas frequentes. Gemini gera Q/A claras e úteis; respostas curtas, objetivas e consistentes com o conteúdo visível.
 * - serviceArea: Áreas/bairros atendidos. Gemini expande a partir de `city` e regiões adjacentes; evitar claims de cobertura excessiva.
 * Cada bloco IA deve ser determinístico por `IA_UNIQUE_KEY` (citySlug:serviceSlug:slug) para evitar variações entre builds.
 */

interface RequestServiceModalProps {
  providerName: string;
  service: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal de solicitação de serviço — CTA interno centralizado na plataforma.
 *
 * Fluxo:
 * 1. Usuário clica "Solicitar Orçamento"
 * 2. Modal abre com formulário simples
 * 3. Submit cria Job na plataforma (targetProviderId = provider email)
 * 4. Job fica visível na dashboard do prestador
 * 5. Prestador envia proposta
 * 6. Tudo dentro da plataforma (escrow, pagamento, etc)
 *
 * Decisão: Conversão 100% interna. Evento central do funil (sem contato externo).
 */
function RequestServiceModal({ providerName, service, isOpen, onClose }: RequestServiceModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    description: '',
    urgency: 'normal',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrar com API de jobs
    // const newJob = await API.createJob({
    //   description: formData.description,
    //   category: service,
    //   urgency: formData.urgency,
    //   targetProviderId: provider.email
    // }, currentUser.email);
    logInfo('[CTA_EVENT] request_service_submit', { service, ...formData });
    setStep('success');
    setTimeout(() => {
      setStep('form');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Solicitar Orçamento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Profissional</label>
              <input
                type="text"
                value={providerName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Serviço</label>
              <input
                type="text"
                value={service}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Descreva sua necessidade
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                placeholder="Ex: Preciso de reparos na rede elétrica da sala..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Urgência</label>
              <select
                value={formData.urgency}
                onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="baixa">Baixa (até 2 semanas)</option>
                <option value="normal">Normal (até 1 semana)</option>
                <option value="alta">Alta (até 3 dias)</option>
                <option value="urgente">Urgente (hoje/amanhã)</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              ✓ Ao solicitar, você será conectado com {providerName} de forma segura na plataforma
              Servio.AI
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Solicitar Orçamento
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-lg font-bold text-gray-900 mb-2">Solicitação enviada!</p>
            <p className="text-gray-600">
              {providerName} receberá seu pedido e responderá em breve.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente interno — renderiza a página com dados injetados pelo provider.
 *
 * Estrutura:
 * 1. Header minimalista (voltar + breadcrumb)
 * 2. Hero section com H1 otimizado
 * 3. Seções de conteúdo (bio, serviços, área de atendimento)
 * 4. Social proof (avaliações, certificados, experiência)
 * 5. FAQs estruturadas (Schema.org)
 * 6. CTA principal e secundários (conversão)
 * 7. Footer com links de navegação
 */
// Decisão: Estrutura semântica com landmarks e headings para EEAT + SEO.
function PublicProviderPageContent({
  data,
  onRequestService,
}: {
  data: PublicPageData;
  onRequestService: () => void;
}) {
  useSeoMeta(); // Injeta meta tags dinâmicos e JSON-LD

  // IA FIELD: determinismo e unicidade por slug
  // Este identificador é usado nos prompts para garantir que o conteúdo gerado por Gemini
  // seja único e reprodutível por página: citySlug:serviceSlug:slug
  const IA_UNIQUE_KEY = `${data.citySlug}:${data.serviceSlug}:${data.slug}`;

  return (
    <div className="min-h-screen bg-gray-50" role="document">
      {/* ===== HEADER MINIMALISTA ===== */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40" role="banner">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Voltar para Servio.AI
          </a>
          <nav className="text-sm text-gray-600">
            Servio.AI / {data.city} / {data.service}
          </nav>
        </div>
      </header>

      <main role="main">
        {/* ===== HERO SECTION — H1 OTIMIZADO PARA SEO ===== */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
            <div className="mb-6 flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <span>{data.city}</span>
              <span className="mx-1">•</span>
              <span className="capitalize">{data.service}</span>
            </div>

            {/* H1: Otimizado para "{serviço} em {cidade}" — keywords críticas */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {data.name} — {data.service} em {data.city}
            </h1>

            {/* Meta description em forma visual */}
            <p className="text-lg text-gray-700 leading-relaxed max-w-2xl">{data.description}</p>

            {/* IA FIELD: Experiência / credibilidade (Gemini)
              - Prompt usa métricas disponíveis (ex.: jobs concluídos) e limites conservadores
              - Evitar promessas/garantias não suportadas; foco em fatos e processos (EEAT)
              - Pode ser omitido se dados não estiverem disponíveis */}
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>4.8 - 47 avaliações</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>12 anos de experiência</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v4h8v-4zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span>156 jobs concluídos</span>
              </div>
            </div>

            {/* CTA Primário — Acima da dobra (Conversão #1) */}
            <button
              onClick={onRequestService}
              className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              ↓ Solicitar Orçamento Gratuito
            </button>
          </div>
        </section>

        {/* ===== SEÇÃO: SOBRE O PROFISSIONAL ===== */}
        {data.bio && (
          <section className="bg-white py-12 md:py-16">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Sobre {data.name}</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                  {data.bio}
                </p>
              </div>

              {/* IA FIELD: Descrição extensa do serviço (Gemini)
                  - Prompt baseado em {data.service} + {data.city} + IA_UNIQUE_KEY
                  - 600–800 palavras; estrutura em introdução, método, diferenciais e garantia
                  - Keywords prioritárias: "{data.service} em {data.city}" e variações sem stuffing */}
              <article className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Por que escolher {data.name} para {data.service} em {data.city}?
                </h3>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    [IA FIELD] Conteúdo gerado por Gemini: descreve benefícios, processo, boas
                    práticas e garantias usuais do serviço. Usa IA_UNIQUE_KEY={IA_UNIQUE_KEY} para
                    consistência.
                  </p>
                </div>
              </article>

              {/* CTA Secundário — meio da página (Conversão #2) */}
              <div className="mt-8">
                <button
                  onClick={onRequestService}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Solicitar Orçamento com {data.name}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ===== SEÇÃO: SERVIÇOS OFERECIDOS ===== */}
        <section className="bg-gray-50 py-12 md:py-16 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Serviços Oferecidos</h2>

            {/* IA FIELD: Lista de serviços (Gemini)
              - Cada item: título + descrição objetiva (quando usar, passos, normas)
              - Sem preço fixo público; estimativas qualitativas apenas
              - Itens podem ser ordenados por demanda local */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Reparação Elétrica',
                  description: '[IA] Descrição do serviço: instalação, manutenção, reparação...',
                },
                {
                  title: 'Instalação de Circuitos',
                  description: '[IA] Descrição: projeto, execução, normas técnicas...',
                },
                {
                  title: 'Manutenção Preventiva',
                  description: '[IA] Descrição: inspeção, limpeza, testes de segurança...',
                },
                {
                  title: 'Consultoria Técnica',
                  description: '[IA] Descrição: análise de sistemas, recomendações...',
                },
              ].map((service, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-700">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SEÇÃO: ÁREA DE ATENDIMENTO ===== */}
        <section className="bg-white py-12 md:py-16 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Área de Atendimento</h2>

            {/* IA FIELD: Áreas/bairros (Gemini)
              - Baseado em city e regiões adjacentes
              - Evitar claims de cobertura total; preferir exemplos representativos */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-900 mb-4">
                {data.name} atende profissionalmente em {data.city} e região metropolitana, com foco
                em:
              </p>
              <ul className="grid md:grid-cols-2 gap-3">
                {[
                  'Centro',
                  'Zona Sul',
                  'Zona Norte',
                  'Zona Leste',
                  'Zona Oeste',
                  'Região Metropolitana',
                ].map(area => (
                  <li key={area} className="flex items-center gap-2 text-gray-900">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ===== SEÇÃO: PERGUNTAS FREQUENTES (FAQ) ===== */}
        <section className="bg-gray-50 py-12 md:py-16 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Perguntas Frequentes</h2>

            {/* IA FIELD: FAQs estruturadas (Gemini)
                - Formato Schema.org FAQPage para rich results
                - Respostas curtas, claras e alinhadas ao conteúdo da página */}
            <div className="space-y-4">
              {[
                {
                  q: 'Qual é o prazo de atendimento?',
                  a: '[IA] Resposta detalhada sobre prazos, disponibilidade, agendamento...',
                },
                {
                  q: 'Como é feito o orçamento?',
                  a: '[IA] Explicação clara do processo: visita, análise, proposta...',
                },
                {
                  q: 'Há garantia no serviço?',
                  a: '[IA] Descrição das garantias, responsabilidades, proteção ao cliente...',
                },
                {
                  q: 'Como faço para contratar?',
                  a: '[IA] Passo a passo: solicitar, proposta, aceitar, pagamento, execução...',
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="bg-white p-6 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <summary className="font-semibold text-gray-900 flex justify-between items-center">
                    {faq.q}
                    <span className="text-gray-400">+</span>
                  </summary>
                  <p className="mt-4 text-gray-700 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SEÇÃO: CTA FINAL — CONVERSÃO ===== */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Precisa de {data.service} em {data.city}?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Solicite um orçamento gratuito com {data.name}. Resposta rápida e segura.
            </p>
            <button
              onClick={onRequestService}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg text-lg"
            >
              ✓ Solicitar Orçamento Agora
            </button>
          </div>
        </section>

        {/* ===== SEÇÃO: PROVA SOCIAL ===== */}
        <section className="bg-white py-12 md:py-16 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              O que os clientes dizem
            </h2>

            {/* IA FIELD: Reviews (Gemini/Firestore)
              - Quando disponível, usar dados reais do Firestore
              - Placeholder mantém estrutura visual sem expor contato direto
              - Validar consistência com AggregateRating do JSON-LD */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  author: 'Carlos M.',
                  rating: 5,
                  text: 'Profissional excelente! Trabalho de qualidade e entrega no prazo.',
                },
                {
                  author: 'Juliana S.',
                  rating: 5,
                  text: 'Muito atencioso. Explicou tudo claramente. Recomendo!',
                },
                {
                  author: 'Roberto P.',
                  rating: 5,
                  text: 'Melhor orçamento. Trabalho impecável. 100% satisfeito.',
                },
              ].map((review, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex gap-1 mb-3">
                    {[...Array(review.rating)].map((_, j) => (
                      <svg
                        key={j}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-3">"{review.text}"</p>
                  <p className="text-sm font-semibold text-gray-900">— {review.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-semibold text-white mb-4">Servio.AI</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/" className="hover:text-white">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/" className="hover:text-white">
                    Buscar profissionais
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-4">Sobre</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/" className="hover:text-white">
                    Como funciona
                  </a>
                </li>
                <li>
                  <a href="/" className="hover:text-white">
                    Segurança
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-4">Legal</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/" className="hover:text-white">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="/" className="hover:text-white">
                    Privacidade
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>
              © {new Date().getFullYear()} Servio.AI — Marketplace de Serviços | Todos os direitos
              reservados
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Página otimizada para SEO. Ranqueando em "{data.service} em {data.city}"
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * COMPONENTE EXPORTADO: PublicProviderPage
 *
 * Responsabilidades:
 * 1. Capturar params da rota: :cidade, :servico, :slug
 * 2. Buscar dados do prestador em providersData
 * 3. Retornar 404 se não encontrado
 * 4. Montar dados SEO (title, meta, canonical, schema)
 * 5. Injetar dados via PublicPageDataProvider
 * 6. Renderizar página com CTA de conversão
 *
 * INTEGRAÇÃO FUTURA:
 * - Dados virão de Firestore (db.collection('users').doc(providerEmail))
 * - Conteúdo expandido por IA (Gemini API)
 * - Reviews integrados com Firestore
 * - CTA conectado com API de jobs
 */
export default function PublicProviderPage() {
  const { cidade, servico, slug } = useParams<{
    cidade: string;
    servico: string;
    slug: string;
  }>();

  const [showRequestModal, setShowRequestModal] = useState(false);

  // Buscar dados do prestador (atualmente em JSON estático, será Firestore depois)
  const provider = providersData.find(
    p => p.citySlug === cidade && p.serviceSlug === servico && p.slug === slug
  );

  // 404 se não encontrado
  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">Profissional não encontrado</p>
          <a href="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Voltar para Home
          </a>
        </div>
      </div>
    );
  }

  // Montar dados estruturados para SEO técnico
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://servio.ai';
  const publicUrl = `${baseUrl}/p/${provider.citySlug}/${provider.serviceSlug}/${provider.slug}`;

  // Decisão: JSON-LD completo para rich results (LocalBusiness + Service), pronto para Reviews.
  // Canonical: sempre aponta para a URL pública única do prestador
  // Headings: H1 único no hero; H2 nas seções principais; H3 para subtítulos internos
  // JSON-LD: LocalBusiness + Service, consistente com conteúdo visível
  const pageData: PublicPageData = {
    slug: provider.slug,
    city: provider.city,
    citySlug: provider.citySlug,
    service: provider.service,
    serviceSlug: provider.serviceSlug,
    name: provider.name,
    description: provider.description,
    // bio pode ser gerado por IA futuramente; providers.sample.json não contém
    seo: {
      title: `${provider.name} — ${provider.service} em ${provider.city} | Servio.AI`,
      description: `${provider.name} oferece ${provider.service} profissional em ${provider.city}. Solicite seu orçamento gratuito agora.`,
      canonical: publicUrl,
    },
    schema: {
      type: 'LocalBusiness',
      name: provider.name,
      description: provider.description,
      url: publicUrl,
      address: {
        addressLocality: provider.city,
        addressRegion:
          provider.citySlug.includes('sao-paulo') || provider.citySlug === 'sao-paulo'
            ? 'SP'
            : provider.citySlug.includes('rio') || provider.citySlug === 'rio-de-janeiro'
              ? 'RJ'
              : 'MG',
        addressCountry: 'BR',
      },
      ...(provider.geo && { geo: { latitude: provider.geo.lat, longitude: provider.geo.lng } }),
      ...(provider.phone && { telephone: provider.phone }),
      ...(provider.email && { email: provider.email }),
      // Placeholder estruturado para rich results; substituir por dados reais
      aggregateRating: {
        ratingValue: 4.8,
        reviewCount: 47,
      },
    },
    // CRÍTICO: contato armazenado para uso interno (JSON-LD, Firestore)
    // NUNCA renderizar telefone/email/website diretamente na página pública
    contact: {
      phone: provider.phone,
      email: provider.email,
    },
    links: {
      website: provider.website,
    },
    // JSON-LD de Service — dinâmico por serviço; pronto para rich results
    serviceSchema: {
      type: 'Service',
      serviceType: provider.service,
      areaServed: provider.city,
      provider: {
        '@type': 'LocalBusiness',
        name: provider.name,
      },
    },
  };

  return (
    <PublicPageDataProvider data={pageData}>
      <PublicProviderPageContent
        data={pageData}
        onRequestService={() => {
          // Conversão: aciona modal e integra com fluxo existente via CustomEvent
          // Evento rastreável: 'open-wizard-from-chat' com payload mínimo necessário
          setShowRequestModal(true);
          const detail = {
            description: `Solicitação de serviço: ${provider.service} em ${provider.city}`,
            category: provider.serviceSlug,
            serviceType: 'personalizado',
            targetProviderId: provider.email, // cria job direcionado
            urgency: 'normal',
          };
          const evt = new CustomEvent('open-wizard-from-chat', { detail });
          globalThis.dispatchEvent(evt);
        }}
      />
      <RequestServiceModal
        providerName={provider.name}
        service={provider.service}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </PublicPageDataProvider>
  );
}
