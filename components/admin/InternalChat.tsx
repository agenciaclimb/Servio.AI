import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiCall } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

type InternalChatMessage = {
  id: string;
  text: string;
  timestamp: Date | string;
  from: string;
};

interface InternalChatProps {
  adminId: string;
}

export default function InternalChat({ adminId }: InternalChatProps): React.ReactElement {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<InternalChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return ta - tb;
    });
  }, [messages]);

  const scrollToEnd = () => {
    const el = endRef.current;
    const scrollFn = (el as unknown as { scrollIntoView?: unknown })?.scrollIntoView;
    if (el && typeof scrollFn === 'function') {
      (scrollFn as (arg?: unknown) => void).call(el, { behavior: 'auto' });
    }
  };

  const loadMessages = useCallback(async () => {
    try {
      const res = await apiCall<{ success: boolean; messages: InternalChatMessage[] }>('/api/admin/chat', {
        method: 'GET',
      });
      if (res?.messages) setMessages(res.messages);
    } catch (err: unknown) {
      // Retry once on timeout-ish errors
      const msg = (err as Error | undefined)?.message || '';
      if (/timeout/i.test(msg)) {
        try {
          const res = await apiCall<{ success: boolean; messages: InternalChatMessage[] }>(
            '/api/admin/chat',
            { method: 'GET' }
          );
          if (res?.messages) setMessages(res.messages);
          return;
        } catch {
          // fallthrough
        }
      }
      addToast?.('Erro ao carregar chat interno.', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToEnd();
  }, [sortedMessages.length]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      await apiCall('/api/admin/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ from: adminId, text: trimmed }),
      });

      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          text: trimmed,
          timestamp: new Date(),
          from: adminId,
        },
      ]);
      setInput('');
      scrollToEnd();
    } catch {
      addToast?.('Erro ao enviar mensagem.', 'error');
    } finally {
      setLoading(false);
    }
  }, [adminId, addToast, input, loading]);

  return (
    <main className="p-4" aria-label="Chat interno" role="main">
      <div className="flex flex-col gap-3">
        <div aria-label="Mensagens" className="flex flex-col gap-2">
          {sortedMessages.map(m => {
            const isOwn = m.from === adminId;
            return (
              <div
                key={m.id}
                data-from={isOwn ? 'self' : 'other'}
                className={isOwn ? 'text-right' : 'text-left'}
              >
                <div className="inline-block max-w-[80%] rounded border px-3 py-2">
                  <div>{m.text}</div>
                  <div className="text-xs opacity-60">
                    {new Date(m.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2" aria-label="Enviar mensagem">
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            className="flex-1 border rounded px-3 py-2"
            aria-label="Mensagem"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={loading}
            aria-label="Enviar mensagem"
            className="border rounded px-3 py-2"
          >
            Enviar
          </button>
        </div>
      </div>
    </main>
  );
}
