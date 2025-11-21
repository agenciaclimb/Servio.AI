/**
 * Message Template Selector Component
 * 
 * Allows prospectors to browse, filter, and copy ready-to-use social media templates
 * with their personalized referral link embedded.
 */

import React, { useState } from 'react';
import {
  getTemplates,
  getTemplateById,
  formatTemplate,
  getCategories,
  getPlatforms,
  type MessageTemplate,
} from '../data/messageTemplates';

interface MessageTemplateSelectorProps {
  referralLink: string; // Prospector's personalized referral link
}

const platformIcons: Record<MessageTemplate['platform'], string> = {
  all: '🌐',
  whatsapp: '💬',
  facebook: '📘',
  instagram: '📷',
  linkedin: '💼',
  twitter: '🐦',
};

const platformNames: Record<MessageTemplate['platform'], string> = {
  all: 'Todas',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
};

export const MessageTemplateSelector: React.FC<MessageTemplateSelectorProps> = ({
  referralLink,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<MessageTemplate['platform']>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = getCategories();
  const platforms = getPlatforms();
  const filteredTemplates = getTemplates(
    selectedPlatform === 'all' ? undefined : selectedPlatform,
    selectedCategory || undefined
  );

  const handleCopy = async (template: MessageTemplate) => {
    const formatted = formatTemplate(template, referralLink);
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Erro ao copiar. Tente selecionar o texto manualmente.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📝 Templates de Mensagens
        </h2>
        <p className="text-gray-600">
          Copie mensagens prontas para compartilhar seu link de indicação nas redes sociais
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Platform Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plataforma
            </label>
            <select
              value={selectedPlatform}
              onChange={e => setSelectedPlatform(e.target.value as MessageTemplate['platform'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>
                  {platformIcons[platform]} {platformNames[platform]}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria de Serviço
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} encontrado{filteredTemplates.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">
              Nenhum template encontrado com esses filtros
            </p>
            <button
              onClick={() => {
                setSelectedPlatform('all');
                setSelectedCategory('');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredTemplates.map(template => {
            const isExpanded = expandedId === template.id;
            const isCopied = copiedId === template.id;
            const formatted = formatTemplate(template, referralLink);

            return (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Template Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{template.emoji || platformIcons[template.platform]}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {platformIcons[template.platform]} {platformNames[template.platform]}
                      </span>
                      {template.category && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          {template.category}
                        </span>
                      )}
                      {template.bestTime && (
                        <span className="text-gray-500">
                          ⏰ {template.bestTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(template)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCopied ? '✓ Copiado!' : '📋 Copiar'}
                  </button>
                </div>

                {/* Template Preview (Collapsed) */}
                {!isExpanded && (
                  <div className="mb-3">
                    <p className="text-gray-700 line-clamp-3 whitespace-pre-wrap">
                      {formatted}
                    </p>
                  </div>
                )}

                {/* Template Preview (Expanded) */}
                {isExpanded && (
                  <div className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm">
                      {formatted}
                    </p>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => toggleExpand(template.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isExpanded ? '↑ Recolher' : '↓ Ver mensagem completa'}
                </button>

                {/* Hashtags (if any) */}
                {template.hashtags && template.hashtags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.hashtags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          💡 Dicas para Compartilhar
        </h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Personalize:</strong> Adicione seu toque pessoal à mensagem antes de compartilhar
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Horários:</strong> Poste nos horários sugeridos para maior engajamento
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Grupos:</strong> Compartilhe em grupos de profissionais da sua área
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Stories:</strong> Use templates curtos para Stories do Instagram/WhatsApp
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>
              <strong>Frequência:</strong> Compartilhe 2-3 vezes por semana para não saturar
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MessageTemplateSelector;
