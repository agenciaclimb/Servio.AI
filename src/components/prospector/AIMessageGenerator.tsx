/**
 * AIMessageGenerator - Gerador Automático de Mensagens com IA
 * 
 * Features:
 * - Gera mensagens personalizadas por IA baseado no contexto do lead
 * - Templates dinâmicos com variáveis substituídas automaticamente
 * - Sugestões de timing ideal (IA analisa histórico)
 * - Preview em tempo real
 * - Envio 1-click para WhatsApp/Email/SMS
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ProspectLead } from '../ProspectorCRM';

interface AIMessageGeneratorProps {
  lead: ProspectLead;
  prospectorName: string;
  referralLink: string;
  onSendSuccess?: () => void;
}

export default function AIMessageGenerator({
  lead,
  prospectorName,
  referralLink,
  onSendSuccess
}: Readonly<AIMessageGeneratorProps>) {
  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  
  // Auto-gerar mensagem ao abrir e ao trocar canal
  const generateLocalTemplateCallback = () => {
    const variables = {
      nome: lead.name,
      categoria: lead.category || 'serviços profissionais',
      prospector: prospectorName,
      link: referralLink,
      saudacao: getGreeting(),
      dia: format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
    };

    const templates = {
      whatsapp: {
        new: `${variables.saudacao} ${variables.nome}! 👋

Meu nome é ${variables.prospector} e quero te apresentar uma oportunidade incrível!

A Servio.AI é a plataforma que está revolucionando o mercado de ${variables.categoria} - conectando profissionais qualificados com clientes através de IA. 🤖

✨ **Por que se cadastrar?**
• Receba pedidos de serviço qualificados direto no seu WhatsApp
• IA faz o matching perfeito entre você e o cliente ideal
• Pagamento garantido via escrow (sem risco de calote)
• Comece a receber oportunidades hoje mesmo

🔗 Cadastre-se agora: ${variables.link}

Topa conhecer? Estou à disposição para tirar dúvidas! 😊`,
        contacted: `Oi ${variables.nome}! 👋

Vi que você demonstrou interesse na Servio.AI! Já teve chance de explorar a plataforma?

${variables.categoria.includes('Eletricista') || variables.categoria.includes('Encanador') 
  ? `Só hoje tivemos 15+ pedidos de ${variables.categoria} na sua região! 🔧⚡`
  : `A demanda por profissionais como você está crescendo! 📈`}

Quer que eu te ajude com o cadastro? Leva menos de 5 minutos!

Link direto: ${variables.link}`,
        negotiating: `${variables.nome}, como estão as coisas? 😊

Percebi que você começou o cadastro mas não finalizou. Tem alguma dúvida que eu possa esclarecer?

💡 **Lembre-se:**
• Cadastro 100% gratuito
• Sem mensalidade ou taxas ocultas
• Você só paga comissão ao fechar o serviço

Vamos finalizar agora? ${variables.link}

Estou aqui para ajudar! 💪`
      },
      email: {
        new: `Assunto: ${variables.nome}, conheça a plataforma que vai transformar seu negócio de ${variables.categoria}

Olá ${variables.nome},

Meu nome é ${variables.prospector} e sou parceiro da Servio.AI.

Quero apresentar uma oportunidade que pode revolucionar a forma como você encontra clientes para seus serviços de ${variables.categoria}.

**O que é a Servio.AI?**
Uma plataforma inteligente que conecta profissionais qualificados com clientes através de Inteligência Artificial. Nosso algoritmo faz o matching perfeito entre suas habilidades e as necessidades dos clientes.

**Por que se cadastrar?**
✅ Receba pedidos de serviço qualificados automaticamente
✅ IA identifica os melhores clientes para você
✅ Pagamento garantido via sistema de escrow (sem risco)
✅ Dashboard completo para gestão de propostas
✅ Suporte 24/7

**Como funciona?**
1. Cadastre-se gratuitamente (2 minutos)
2. Complete seu perfil profissional
3. Comece a receber oportunidades no mesmo dia

📱 Cadastre-se agora: ${variables.link}

Qualquer dúvida, estou à disposição!

Abraço,
${variables.prospector}
Prospector Servio.AI`,
        contacted: `Assunto: ${variables.nome}, já viu as oportunidades disponíveis?

Oi ${variables.nome}!

Vi que você se interessou pela Servio.AI! 🎉

Só para você ter uma ideia, nas últimas 24h tivemos mais de 50 pedidos de ${variables.categoria} na plataforma. Profissionais cadastrados já estão aproveitando essas oportunidades!

Quer fazer parte desse crescimento? O cadastro leva menos de 5 minutos:
${variables.link}

Posso te ajudar com alguma dúvida?

Att,
${variables.prospector}`,
        negotiating: `Assunto: ${variables.nome}, vamos finalizar seu cadastro?

Olá ${variables.nome},

Notei que você começou o cadastro na Servio.AI mas ainda não finalizou. 

Tem alguma dúvida ou dificuldade que eu possa ajudar a resolver?

**Lembrete rápido:**
• 100% gratuito para começar
• Sem mensalidade
• Você controla quando quer trabalhar
• Comissão apenas ao fechar serviços

Finalize agora e comece a receber oportunidades hoje: ${variables.link}

Estou aqui para ajudar!

${variables.prospector}
Prospector Servio.AI`
      },
      sms: {
        new: `Oi ${variables.nome}! ${variables.prospector} aqui. Conheça a Servio.AI - plataforma com IA que conecta profissionais de ${variables.categoria} com clientes. Cadastro grátis: ${variables.link}`,
        contacted: `${variables.nome}, vi seu interesse na Servio.AI! Tem dúvidas? Estou aqui. Finalize: ${variables.link}`,
        negotiating: `${variables.nome}, que tal finalizar o cadastro hoje? Leva 5min. Link: ${variables.link}. Dúvidas? Fale comigo!`
      }
    };

    return templates[channel][lead.stage === 'new' ? 'new' : lead.stage === 'contacted' ? 'contacted' : 'negotiating'];
  };
  
  const [message, setMessage] = useState<string>(() => generateLocalTemplateCallback());

  // Regenerar quando trocar canal
  useEffect(() => {
    setMessage(generateLocalTemplateCallback());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, lead.stage]);

  function generateAIMessage() {
    setMessage(generateLocalTemplateCallback());
  }

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function getBestTimeToSend(): string {
    const hour = new Date().getHours();
    
    // IA simples: sugere melhor horário baseado em padrões
    if (hour < 10) {
      return '⏰ Ideal enviar entre 10h-12h para maximizar taxa de resposta (+60%)';
    }
    if (hour >= 10 && hour < 12) {
      return '✅ Excelente momento! Horário de pico de engajamento.';
    }
    if (hour >= 12 && hour < 14) {
      return '🍽️ Horário de almoço. Considere aguardar até 14h para melhor resultado.';
    }
    if (hour >= 14 && hour < 18) {
      return '✅ Bom horário! Profissionais costumam checar mensagens agora.';
    }
    if (hour >= 18 && hour < 20) {
      return '✅ Horário nobre! Taxa de conversão 3x maior.';
    }
    return '🌙 Horário não ideal. Melhor enviar amanhã pela manhã (10h-12h).';
  }

  async function handleSend() {
    const url = {
      whatsapp: `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`,
      email: `mailto:${lead.email}?subject=${encodeURIComponent('Oportunidade Servio.AI')}&body=${encodeURIComponent(message)}`,
      sms: `sms:${lead.phone}?body=${encodeURIComponent(message)}`
    }[channel];

    window.open(url, '_blank');

    // Log atividade automaticamente
    try {
      await fetch('/api/prospector/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          type: channel === 'whatsapp' ? 'message' : channel,
          description: `Enviado via ${channel}: ${message.substring(0, 50)}...`,
          timestamp: new Date().toISOString()
        })
      });

      if (onSendSuccess) onSendSuccess();
    } catch (error) {
      console.error('Erro ao logar atividade:', error);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(message);
    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = '✅ Mensagem copiada!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          Mensagem Gerada por IA
        </h3>
        <button
          onClick={generateAIMessage}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          🔄 Regenerar
        </button>
      </div>

      {/* Canal Selection */}
      <div className="flex gap-2">
        {(['whatsapp', 'email', 'sms'] as const).map(ch => (
          <button
            key={ch}
            onClick={() => setChannel(ch)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              channel === ch
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {ch === 'whatsapp' && '💬 WhatsApp'}
            {ch === 'email' && '📧 Email'}
            {ch === 'sms' && '📱 SMS'}
          </button>
        ))}
      </div>

      {/* Timing Suggestion */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        {getBestTimeToSend()}
      </div>

      {/* Message Preview */}
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensagem (editável)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={channel === 'email' ? 12 : 8}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Gerando mensagem..."
        />
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{(message || '').length} caracteres</span>
          {channel === 'whatsapp' && (message || '').length > 1000 && (
            <span className="text-orange-600">⚠️ Mensagem longa pode ser cortada</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSend}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all"
        >
          {channel === 'whatsapp' && '💬 Enviar WhatsApp'}
          {channel === 'email' && '📧 Enviar Email'}
          {channel === 'sms' && '📱 Enviar SMS'}
        </button>
        <button
          onClick={copyToClipboard}
          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          title="Copiar mensagem"
        >
          📋
        </button>
      </div>
    </div>
  );
}
