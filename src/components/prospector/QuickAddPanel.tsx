/**
 * QuickAddPanel - Cadastro rápido de leads com IA
 * Permite adicionar leads via paste de texto, upload CSV, ou formulário simplificado
 */

import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';

interface Lead {
  name: string;
  phone: string;
  email?: string;
  category?: string;
}

interface QuickAddPanelProps {
  onLeadsAdded?: (count: number) => void;
}

export default function QuickAddPanel({ onLeadsAdded }: QuickAddPanelProps) {
  const [mode, setMode] = useState<'paste' | 'form' | 'csv'>('paste');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);

  // Formulário simplificado
  const [formData, setFormData] = useState<Lead>({
    name: '',
    phone: '',
    email: '',
    category: 'Geral',
  });

  const auth = getAuth();

  /**
   * Parse inteligente de texto colado
   * Suporta formatos: "Nome, Telefone, Email, Categoria" ou "Nome - Telefone"
   */
  const parseTextInput = (text: string): Lead[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const leads: Lead[] = [];

    for (const line of lines) {
      try {
        // Tenta formato CSV: "Nome, Telefone, Email, Categoria"
        if (line.includes(',')) {
          const parts = line.split(',').map(p => p.trim());
          leads.push({
            name: parts[0] || '',
            phone: parts[1] || '',
            email: parts[2] || undefined,
            category: parts[3] || 'Geral',
          });
        }
        // Formato simplificado: "Nome - Telefone"
        else if (line.includes('-')) {
          const parts = line.split('-').map(p => p.trim());
          leads.push({
            name: parts[0] || '',
            phone: parts[1] || '',
            category: 'Geral',
          });
        }
        // Formato livre (extrai telefone via regex)
        else {
          const phoneMatch = line.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/);
          if (phoneMatch) {
            const phone = phoneMatch[0];
            const name = line.replace(phone, '').trim();
            leads.push({
              name: name || 'Lead',
              phone,
              category: 'Geral',
            });
          }
        }
      } catch (error) {
        console.warn('Erro ao parsear linha:', line, error);
      }
    }

    return leads;
  };

  /**
   * Importa leads via API do backend
   */
  const handleImport = async () => {
    if (!auth.currentUser) {
      alert('❌ Você precisa estar autenticado');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let leads: Lead[] = [];

      if (mode === 'paste') {
        leads = parseTextInput(textInput);
      } else if (mode === 'form') {
        leads = [formData];
      }

      if (leads.length === 0) {
        alert('❌ Nenhum lead válido encontrado. Verifique o formato.');
        setLoading(false);
        return;
      }

      // Envia para o backend
      const user = auth.currentUser;
      if (!user || !user.email) {
        alert('❌ Você precisa estar autenticado para importar leads.');
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/prospector/import-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.email,
          leads,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao importar leads');
      }

      const data = await response.json();
      setResult(data);

      // Limpa formulário
      setTextInput('');
      setFormData({ name: '', phone: '', email: '', category: 'Geral' });

      // Notifica componente pai
      if (onLeadsAdded) {
        onLeadsAdded(data.imported);
      }

      alert(
        `✅ ${data.imported} leads importados com sucesso! ${data.failed > 0 ? `(${data.failed} falharam)` : ''}`
      );
    } catch (error) {
      console.error('Erro ao importar leads:', error);
      alert('❌ Erro ao importar leads. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload de CSV
   */
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setTextInput(text);
      setMode('paste');
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">🚀 Cadastro Rápido de Leads</h3>

      {/* Abas de modo */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('paste')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            mode === 'paste'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📝 Colar Texto
        </button>
        <button
          onClick={() => setMode('form')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            mode === 'form'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ✏️ Formulário
        </button>
        <button
          onClick={() => setMode('csv')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            mode === 'csv'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📁 Upload CSV
        </button>
      </div>

      {/* Modo: Colar Texto */}
      {mode === 'paste' && (
        <div>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={`Cole seus leads aqui. Formatos aceitos:

Nome, Telefone, Email, Categoria
João Silva, (11) 98765-4321, joao@email.com, Eletricista
Maria Souza, (21) 91234-5678, maria@email.com, Pintora

Ou formato simplificado:
João Silva - (11) 98765-4321
Maria Souza - (21) 91234-5678`}
            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
          />
          <p className="text-sm text-gray-500 mt-2">
            💡 Dica: Cole uma lista de nomes e telefones. A IA enriquecerá os dados automaticamente.
          </p>
        </div>
      )}

      {/* Modo: Formulário */}
      {mode === 'form' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="João Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="(11) 98765-4321"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="joao@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="Geral">Geral</option>
              <option value="Eletricista">Eletricista</option>
              <option value="Encanador">Encanador</option>
              <option value="Pintor">Pintor</option>
              <option value="Pedreiro">Pedreiro</option>
              <option value="Jardineiro">Jardineiro</option>
              <option value="Marceneiro">Marceneiro</option>
              <option value="Serralheiro">Serralheiro</option>
            </select>
          </div>
        </div>
      )}

      {/* Modo: Upload CSV */}
      {mode === 'csv' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleCSVUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer inline-flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-purple-600 font-semibold hover:text-purple-700">
              Clique para fazer upload
            </span>
            <span className="text-gray-500 text-sm mt-1">ou arraste um arquivo CSV aqui</span>
          </label>
          <p className="text-xs text-gray-500 mt-4">
            Formato CSV: Nome, Telefone, Email, Categoria
          </p>
        </div>
      )}

      {/* Botão de importação */}
      <button
        onClick={handleImport}
        disabled={
          loading ||
          (mode === 'paste' && !textInput) ||
          (mode === 'form' && (!formData.name || !formData.phone))
        }
        className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Importando...</span>
          </>
        ) : (
          <>
            <span>🚀</span>
            <span>Importar e Enriquecer com IA</span>
          </>
        )}
      </button>

      {/* Resultado */}
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">
            ✅ {result.imported} leads importados com sucesso!
          </p>
          {result.failed > 0 && (
            <p className="text-orange-600 text-sm mt-1">
              ⚠️ {result.failed} leads falharam na importação
            </p>
          )}
        </div>
      )}
    </div>
  );
}
