import React, { useState, useEffect } from 'react';
import {
  generateReferralLink,
  getReferralLink,
  getLinkAnalytics,
  generateQRCodeUrl,
  generateShareUrls,
  type ReferralLink,
  type LinkAnalytics,
} from '../services/referralLinkService';
import { useAppContext } from '../contexts/AppContext';

interface ReferralLinkGeneratorProps {
  prospectorId: string;
  onLinkGenerated?: (fullUrl: string) => void;
}

export default function ReferralLinkGenerator({ prospectorId, onLinkGenerated }: ReferralLinkGeneratorProps) {
  const [referralLink, setReferralLink] = useState<ReferralLink | null>(null);
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadReferralLink();
  }, [prospectorId]);

  async function loadReferralLink() {
    if (!prospectorId) return;

    setLoading(true);
    try {
      // Try to get existing link
      let link = await getReferralLink(prospectorId);

      // If doesn't exist, generate new one
      if (!link) {
        link = await generateReferralLink(prospectorId, 'Prospector');
      }

      setReferralLink(link);

      // Notify parent component
      if (onLinkGenerated && link) {
        onLinkGenerated(link.fullUrl);
      }

      // Load analytics
      const stats = await getLinkAnalytics(prospectorId);
      setAnalytics(stats);
    } catch (error) {
      console.error('Error loading referral link:', error);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function downloadQRCode() {
    if (!referralLink) return;
    const qrUrl = generateQRCodeUrl(referralLink.shortUrl, 500);
    window.open(qrUrl, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!referralLink) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro ao carregar link de indicação. Tente novamente.</p>
      </div>
    );
  }

  const shareMessage = `Cadastre-se na Servio.AI e receba oportunidades de trabalho qualificadas! 🚀`;
  const shareUrls = generateShareUrls(referralLink.shortUrl, shareMessage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🔗 Seu Link de Indicação</h2>
        <p className="text-blue-100">
          Compartilhe este link para rastrear suas indicações e ganhar comissões
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total de Cliques</div>
          <div className="text-3xl font-bold text-gray-900">{analytics?.totalClicks || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Conversões</div>
          <div className="text-3xl font-bold text-gray-900">{analytics?.conversions || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Taxa de Conversão</div>
          <div className="text-3xl font-bold text-gray-900">
            {analytics?.conversionRate.toFixed(1) || 0}%
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Links para Compartilhar</h3>

        {/* Short Link */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link Curto (Recomendado)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink.shortUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
            <button
              onClick={() => copyToClipboard(referralLink.shortUrl, 'short')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              {copiedField === 'short' ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Full Link */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link Completo (com UTM)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink.fullUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
            />
            <button
              onClick={() => copyToClipboard(referralLink.fullUrl, 'full')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              {copiedField === 'full' ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">QR Code (para materiais impressos)</label>
            <button
              onClick={downloadQRCode}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              📥 Baixar em Alta Resolução
            </button>
          </div>
          <div className="flex justify-center">
            <img
              src={generateQRCodeUrl(referralLink.shortUrl, 200)}
              alt="QR Code"
              className="border-4 border-white shadow-md rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Social Share Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Compartilhar nas Redes Sociais</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <a
            href={shareUrls.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            <span className="text-xl">📱</span>
            <span className="font-medium">WhatsApp</span>
          </a>

          <a
            href={shareUrls.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <span className="text-xl">👍</span>
            <span className="font-medium">Facebook</span>
          </a>

          <a
            href={shareUrls.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition"
          >
            <span className="text-xl">✈️</span>
            <span className="font-medium">Telegram</span>
          </a>

          <a
            href={shareUrls.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
          >
            <span className="text-xl">💼</span>
            <span className="font-medium">LinkedIn</span>
          </a>

          <a
            href={shareUrls.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            <span className="text-xl">𝕏</span>
            <span className="font-medium">Twitter</span>
          </a>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Dicas para Aumentar Conversões:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Compartilhe o link curto em conversas pessoais (mais fácil de digitar)</li>
          <li>• Use o QR Code em cartões de visita e materiais impressos</li>
          <li>• Poste regularmente nas redes sociais com histórias de sucesso</li>
          <li>• Adicione uma mensagem personalizada ao compartilhar</li>
          <li>• Responda perguntas rapidamente para não perder prospects</li>
        </ul>
      </div>
    </div>
  );
}
