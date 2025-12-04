import { useState } from 'react';
import { auth } from '../../../firebaseConfig';

interface BulkCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: (result: { success: number; failed: number; total: number }) => void;
}

export default function BulkCampaignModal({ isOpen, onClose, onSent }: BulkCampaignModalProps) {
  const [channels, setChannels] = useState<{ email: boolean; whatsapp: boolean }>({ email: true, whatsapp: false });
  const [subject, setSubject] = useState('Oportunidade Servio.AI - Cadastre-se Agora!');
  const [message, setMessage] = useState('Olá! Você é profissional de serviços? A Servio.AI conecta você com clientes que precisam do seu trabalho. Cadastro 100% gratuito. Acesse: https://gen-lang-client-0737507616.web.app/cadastro');
  const [leadEmails, setLeadEmails] = useState('');
  const [leadPhones, setLeadPhones] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggle = (key: 'email' | 'whatsapp') => setChannels(prev => ({ ...prev, [key]: !prev[key] }));

  async function handleSend() {
    setSending(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Valida canais selecionados
      const selectedChannels = Object.keys(channels).filter(k => channels[k as keyof typeof channels]);
      if (selectedChannels.length === 0) {
        setError('Selecione pelo menos um canal (Email ou WhatsApp)');
        setSending(false);
        return;
      }

      // Parse leads
      const leads: Array<{ email?: string; phone?: string }> = [];
      const emails = leadEmails.split(/[;,\n]/).map(s => s.trim()).filter(Boolean);
      const phones = leadPhones.split(/[;,\n]/).map(s => s.trim()).filter(Boolean);
      
      // Valida que tem leads
      if (emails.length === 0 && phones.length === 0) {
        setError('Adicione pelo menos um email ou telefone');
        setSending(false);
        return;
      }

      // Valida email se canal email selecionado
      if (channels.email && emails.length === 0) {
        setError('Canal Email selecionado mas nenhum email fornecido');
        setSending(false);
        return;
      }

      // Valida telefone se canal WhatsApp selecionado
      if (channels.whatsapp && phones.length === 0) {
        setError('Canal WhatsApp selecionado mas nenhum telefone fornecido');
        setSending(false);
        return;
      }

      // Monta lista de leads (evita duplicatas)
      const leadMap = new Map<string, { email?: string; phone?: string }>();
      emails.forEach(e => {
        const key = e.toLowerCase();
        if (!leadMap.has(key)) leadMap.set(key, { email: e });
      });
      phones.forEach(p => {
        const clean = p.replace(/\D/g, '');
        if (clean.length >= 10 && !leadMap.has(clean)) {
          leadMap.set(clean, { phone: p });
        }
      });
      leads.push(...Array.from(leadMap.values()));

      if (leads.length === 0) {
        setError('Nenhum lead válido encontrado');
        setSending(false);
        return;
      }

      if (leads.length > 50) {
        setError('Máximo de 50 leads por campanha');
        setSending(false);
        return;
      }

      // Obter token Firebase
      const user = auth.currentUser;
      if (!user) {
        setError('Você precisa estar autenticado');
        setSending(false);
        return;
      }

      const token = await user.getIdToken();

      // Envia campanha
      const payload = {
        channels: selectedChannels,
        template: { 
          subject: subject.trim(), 
          message: message.trim() 
        },
        leads,
      };

      const res = await fetch('/api/prospector/send-campaign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Erro ${res.status}`);
      }

      const json = await res.json();
      
      // Mostra resultado
      const totalSent = (json.results?.email?.sent || 0) + (json.results?.whatsapp?.sent || 0);
      const totalFailed = (json.results?.email?.failed || 0) + (json.results?.whatsapp?.failed || 0);
      
      setSuccess(`✅ Campanha enviada! ${totalSent} sucesso, ${totalFailed} falhas.`);
      
      onSent?.(json);
      
      // Fecha modal após 2s
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (e: Error | unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Falha ao enviar campanha';
      console.error('Campaign error:', e);
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: 600, background: '#fff', borderRadius: 8, padding: 16 }}>
        <h3>Enviar Campanha</h3>

        <div style={{ display: 'flex', gap: 12 }}>
          <label><input type="checkbox" checked={channels.email} onChange={() => toggle('email')} /> Email</label>
          <label><input type="checkbox" checked={channels.whatsapp} onChange={() => toggle('whatsapp')} /> WhatsApp</label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Assunto</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Mensagem (suporta variáveis: name, service)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} style={{ width: '100%' }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Emails (separados por ; , ou quebra de linha)</label>
          <textarea value={leadEmails} onChange={e => setLeadEmails(e.target.value)} rows={2} style={{ width: '100%' }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Telefones (separados por ; , ou quebra de linha)</label>
          <textarea value={leadPhones} onChange={e => setLeadPhones(e.target.value)} rows={2} style={{ width: '100%' }} />
        </div>

        {error && <div style={{ color: 'red', marginTop: 8, padding: 8, background: '#fee', borderRadius: 4 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8, padding: 8, background: '#efe', borderRadius: 4 }}>{success}</div>}

        <div style={{ marginTop: 16, padding: 8, background: '#f0f9ff', borderRadius: 4, fontSize: 12 }}>
          💡 <strong>Dica:</strong> Variáveis disponíveis: {'{nome}'}, {'{categoria}'}, {'{email}'}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={sending} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: sending ? 'not-allowed' : 'pointer' }}>Cancelar</button>
          <button onClick={handleSend} disabled={sending} style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: sending ? '#ccc' : '#6366f1', color: '#fff', cursor: sending ? 'not-allowed' : 'pointer' }}>{sending ? 'Enviando...' : 'Enviar Campanha'}</button>
        </div>
      </div>
    </div>
  );
}
