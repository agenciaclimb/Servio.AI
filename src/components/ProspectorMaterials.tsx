/**
 * Prospector Marketing Materials
 * 
 * Banco de recursos para prospectores:
 * - Templates de mensagens
 * - Imagens para redes sociais
 * - PDFs explicativos
 * - Vídeos de apresentação
 * - Scripts de venda
 */

import { useState } from 'react';

interface Material {
  id: string;
  type: 'image' | 'pdf' | 'video' | 'template';
  title: string;
  description: string;
  url?: string;
  content?: string;
  category: 'social' | 'email' | 'whatsapp' | 'presentation' | 'training';
  preview?: string;
}

const MATERIALS: Material[] = [
  // Templates WhatsApp
  {
    id: 'wpp-1',
    type: 'template',
    title: 'Convite Inicial WhatsApp',
    description: 'Primeira mensagem para prospect via WhatsApp',
    category: 'whatsapp',
    content: `Olá [NOME]! 👋

Vi que você trabalha com [CATEGORIA] e queria te apresentar uma oportunidade incrível!

A Servio.AI é uma plataforma que conecta prestadores de serviço com clientes qualificados. Você recebe jobs direto no seu celular, sem precisar sair procurando!

✅ 100% gratuito para cadastro
✅ Pagamento garantido via escrow
✅ Você escolhe quais jobs aceitar
✅ Avaliações dos clientes

Quer conhecer? [SEU_LINK]

Qualquer dúvida, estou aqui! 😊`,
  },
  {
    id: 'wpp-2',
    type: 'template',
    title: 'Follow-up 2 dias',
    description: 'Mensagem de follow-up após 2 dias sem resposta',
    category: 'whatsapp',
    content: `Oi [NOME]! 

Voltando aqui pra te contar que a Servio.AI já tem mais de 500 prestadores ativos e centenas de jobs por semana!

Alguns números:
📊 Média de 3-5 jobs/semana por prestador
💰 Ticket médio: R$ 250-500
⭐ 4.8 estrelas de satisfação

Vale muito a pena dar uma olhada: [SEU_LINK]

Bora conversar? 😊`,
  },
  // Templates Email
  {
    id: 'email-1',
    type: 'template',
    title: 'Email Profissional',
    description: 'Email formal para prospects',
    category: 'email',
    content: `Assunto: Oportunidade: Plataforma de Jobs para [CATEGORIA]

Olá [NOME],

Me chamo [SEU_NOME] e sou prospector parceiro da Servio.AI, uma plataforma inovadora que conecta prestadores de serviço com clientes qualificados.

**Por que a Servio.AI é diferente:**

🎯 **IA de Matching**: Algoritmo inteligente conecta você com clientes ideais
💳 **Pagamento Seguro**: Sistema de escrow garante seu pagamento
📱 **100% Mobile**: Receba e gerencie jobs direto do celular
⚡ **Sem Mensalidade**: Totalmente gratuito para cadastro

**Como funciona:**
1. Você se cadastra gratuitamente
2. Recebe notificações de jobs na sua área
3. Escolhe quais jobs aceitar
4. Presta o serviço com pagamento garantido
5. Recebe avaliações dos clientes

Cadastre-se agora: [SEU_LINK]

Abraços,
[SEU_NOME]
Prospector Servio.AI`,
  },
  // Imagens Redes Sociais
  {
    id: 'social-1',
    type: 'image',
    title: 'Post Instagram - Chamada',
    description: 'Imagem para stories/feed do Instagram',
    category: 'social',
    url: '/materials/social/post-instagram-chamada.png',
    preview: '/materials/social/previews/post-instagram-chamada-preview.png',
  },
  {
    id: 'social-2',
    type: 'image',
    title: 'Banner Facebook',
    description: 'Banner para posts no Facebook',
    category: 'social',
    url: '/materials/social/banner-facebook.png',
    preview: '/materials/social/previews/banner-facebook-preview.png',
  },
  // PDFs
  {
    id: 'pdf-1',
    type: 'pdf',
    title: 'Guia do Prestador',
    description: 'PDF completo explicando a plataforma',
    category: 'presentation',
    url: '/materials/guia-prestador.pdf',
  },
  {
    id: 'pdf-2',
    type: 'pdf',
    title: 'FAQ - Perguntas Frequentes',
    description: 'Respostas para as 20 dúvidas mais comuns',
    category: 'training',
    url: '/materials/faq.pdf',
  },
  // Vídeos
  {
    id: 'video-1',
    type: 'video',
    title: 'Pitch 60 segundos',
    description: 'Vídeo curto apresentando a Servio.AI',
    category: 'presentation',
    url: '/materials/videos/pitch-60s.mp4',
    preview: '/materials/videos/previews/pitch-60s-preview.jpg',
  },
];

export default function ProspectorMaterials() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: '📚 Todos', icon: '📚' },
    { id: 'whatsapp', label: '💬 WhatsApp', icon: '💬' },
    { id: 'email', label: '📧 Email', icon: '📧' },
    { id: 'social', label: '📱 Redes Sociais', icon: '📱' },
    { id: 'presentation', label: '🎯 Apresentação', icon: '🎯' },
    { id: 'training', label: '📖 Treinamento', icon: '📖' },
  ];

  const filteredMaterials = selectedCategory === 'all'
    ? MATERIALS
    : MATERIALS.filter(m => m.category === selectedCategory);

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadMaterial = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📚 Materiais de Marketing</h2>
        <p className="text-purple-100">
          Tudo que você precisa para prospectar com sucesso: templates, imagens, vídeos e guias
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map(material => (
          <div
            key={material.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Preview/Icon */}
            {material.preview && (
              <img
                src={material.preview}
                alt={material.title}
                className="w-full h-40 object-cover"
              />
            )}
            {!material.preview && (
              <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <span className="text-6xl">
                  {material.type === 'template' && '📝'}
                  {material.type === 'pdf' && '📄'}
                  {material.type === 'video' && '🎥'}
                  {material.type === 'image' && '🖼️'}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{material.title}</h3>
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  {material.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{material.description}</p>

              {/* Actions */}
              <div className="flex gap-2">
                {material.type === 'template' && material.content && (
                  <button
                    onClick={() => copyToClipboard(material.content!, material.id)}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
                  >
                    {copiedId === material.id ? '✅ Copiado!' : '📋 Copiar'}
                  </button>
                )}
                {(material.type === 'image' || material.type === 'pdf') && material.url && (
                  <>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-white border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 text-sm font-medium transition-colors text-center"
                    >
                      👁️ Visualizar
                    </a>
                    <button
                      onClick={() => downloadMaterial(material.url!, material.title)}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"
                    >
                      ⬇️ Baixar
                    </button>
                  </>
                )}
                {material.type === 'video' && material.url && (
                  <a
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors text-center"
                  >
                    ▶️ Assistir
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Nenhum material encontrado nesta categoria</p>
          <p className="text-sm">Tente selecionar outra categoria</p>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas de Uso</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li><strong>Templates WhatsApp:</strong> Copie e personalize com o nome do prospect e seu link</li>
          <li><strong>Imagens:</strong> Use nos seus stories e posts para atrair prospects</li>
          <li><strong>PDFs:</strong> Envie como anexo em emails ou compartilhe no WhatsApp</li>
          <li><strong>Vídeos:</strong> Compartilhe o link direto ou baixe para usar offline</li>
        </ul>
      </div>
    </div>
  );
}
