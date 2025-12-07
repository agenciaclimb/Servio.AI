import { useEffect, useState, useCallback } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface FilterCondition {
  field?: string;
  operator?: string;
  value?: unknown;
  [key: string]: unknown;
}

interface SavedView {
  id: string;
  name: string;
  prospectorId: string;
  density: 'compact' | 'detailed';
  conditions: FilterCondition[];
  createdAt: Date;
  description?: string;
}

export default function SavedViewsBar({
  prospectorId,
  density,
  setDensity,
  conditions,
  setConditions,
}: {
  prospectorId: string;
  density: 'compact' | 'detailed';
  setDensity: (d: 'compact' | 'detailed') => void;
  conditions: FilterCondition[];
  setConditions: (c: FilterCondition[]) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showViewsModal, setShowViewsModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  async function loadViews() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'prospector_views'));
      const list: SavedView[] = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            prospectorId: data.prospectorId,
            density: data.density,
            conditions: data.conditions || [],
            createdAt: data.createdAt?.toDate?.() || new Date(),
            description: data.description,
          };
        })
        .filter(v => v.prospectorId === prospectorId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setViews(list);
    } catch (error) {
      console.error('Erro ao carregar views:', error);
      showToast('❌ Erro ao carregar vistas salvas', 'error');
    } finally {
      setLoading(false);
    }
  }

  const memoLoadViews = useCallback(loadViews, [prospectorId]);

  useEffect(() => {
    memoLoadViews();
  }, [memoLoadViews]);

  async function saveView() {
    if (!newViewName.trim()) {
      showToast('⚠️ Digite um nome para a vista', 'warning');
      return;
    }
    try {
      await addDoc(collection(db, 'prospector_views'), {
        prospectorId,
        name: newViewName.trim(),
        description: newViewDescription.trim() || null,
        density,
        conditions,
        createdAt: Timestamp.now(),
      });
      await loadViews();
      setShowSaveModal(false);
      setNewViewName('');
      setNewViewDescription('');
      showToast('✅ Vista salva com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar view:', error);
      showToast('❌ Erro ao salvar vista', 'error');
    }
  }

  async function deleteView(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir a vista "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'prospector_views', id));
      if (activeViewId === id) setActiveViewId(null);
      await loadViews();
      showToast('🗑️ Vista excluída', 'success');
    } catch (error) {
      console.error('Erro ao excluir view:', error);
      showToast('❌ Erro ao excluir vista', 'error');
    }
  }

  async function shareView(id: string, name: string) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', id);
      await navigator.clipboard.writeText(url.toString());
      showToast(`🔗 Link da vista "${name}" copiado!`, 'success');
    } catch (error) {
      showToast('❌ Erro ao copiar link', 'error');
    }
  }

  function loadView(view: SavedView) {
    setDensity(view.density);
    setConditions(view.conditions);
    setActiveViewId(view.id);
    setShowViewsModal(false);
    showToast(`📂 Vista "${view.name}" carregada`, 'success');
  }

  function showToast(message: string, type: 'success' | 'error' | 'warning') {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-amber-500',
    };
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-xl z-50 animate-bounce`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  return (
    <>
      {/* Barra Principal */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="font-semibold text-gray-800">Vistas Salvas</span>
          {activeViewId && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
              {views.find(v => v.id === activeViewId)?.name || 'Carregada'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowViewsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-all hover:shadow-md"
          >
            <span>📂</span>
            <span>Minhas Vistas</span>
            {views.length > 0 && (
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {views.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            disabled={conditions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              conditions.length === 0
                ? 'Configure filtros antes de salvar'
                : 'Salvar configuração atual'
            }
          >
            <span>💾</span>
            <span>Salvar Vista</span>
          </button>
        </div>
      </div>

      {/* Modal Salvar Vista */}
      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">💾</span>
                Salvar Nova Vista
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Vista *
                </label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={e => setNewViewName(e.target.value)}
                  placeholder="Ex: Leads Quentes para Hoje"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newViewDescription}
                  onChange={e => setNewViewDescription(e.target.value)}
                  placeholder="Descreva o propósito desta vista..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="text-sm text-gray-600">Configuração atual:</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white px-2 py-1 rounded border">
                    Densidade: {density === 'compact' ? '📏 Compacta' : '📐 Detalhada'}
                  </span>
                  <span className="bg-white px-2 py-1 rounded border">
                    Filtros: {conditions.length}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveView}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Salvar Vista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Minhas Vistas */}
      {showViewsModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowViewsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📂</span>
                Minhas Vistas Salvas
                {views.length > 0 && (
                  <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    {views.length}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setShowViewsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : views.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600 mb-2">Nenhuma vista salva ainda</p>
                  <p className="text-sm text-gray-500">
                    Configure seus filtros e clique em "Salvar Vista"
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {views.map(view => (
                    <div
                      key={view.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                        activeViewId === view.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                      onClick={() => loadView(view)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{view.name}</h4>
                            {activeViewId === view.id && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Ativa
                              </span>
                            )}
                          </div>
                          {view.description && (
                            <p className="text-sm text-gray-600 mb-2">{view.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>🕒 {view.createdAt.toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span>
                              {view.density === 'compact' ? '📏 Compacta' : '📐 Detalhada'}
                            </span>
                            <span>•</span>
                            <span>{view.conditions.length} filtro(s)</span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              shareView(view.id, view.name);
                            }}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Compartilhar"
                          >
                            🔗
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              deleteView(view.id, view.name);
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
