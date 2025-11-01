import React, { useState } from 'react';
import { User, PortfolioItem } from '../types';
import { enhanceProviderProfile } from '../services/geminiService';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedData: Partial<User>) => void;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [headline, setHeadline] = useState(user.headline || '');
  const [bio, setBio] = useState(user.bio);
  const [address, setAddress] = useState(user.address || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [specialties, setSpecialties] = useState((user.specialties || []).join(', '));
  const [hasCertificates, setHasCertificates] = useState(user.hasCertificates || false);
  const [hasCriminalRecordCheck, setHasCriminalRecordCheck] = useState(user.hasCriminalRecordCheck || false);
  
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState('');

  // Portfolio State
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(user.portfolio || []);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioDesc, setNewPortfolioDesc] = useState('');
  const [newPortfolioImage, setNewPortfolioImage] = useState<File | null>(null);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
        name, 
        headline, 
        bio,
        address,
        cpf,
        specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
        hasCertificates,
        hasCriminalRecordCheck,
        portfolio,
    });
  };

  const handleEnhanceProfile = async () => {
    setIsEnhancing(true);
    setEnhanceError('');
    try {
        const result = await enhanceProviderProfile({
            name,
            headline,
            bio
        });
        setHeadline(result.suggestedHeadline);
        setBio(result.suggestedBio);
    } catch (err) {
        setEnhanceError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleAddPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioTitle || !newPortfolioImage) {
        setPortfolioError('Título e imagem são obrigatórios.');
        return;
    }
    setPortfolioError('');
    try {
        const imageUrl = await toBase64(newPortfolioImage);
        const newItem: PortfolioItem = {
            id: `port-${Date.now()}`,
            title: newPortfolioTitle,
            description: newPortfolioDesc,
            imageUrl,
        };
        setPortfolio(prev => [...prev, newItem]);
        // Reset form
        setNewPortfolioTitle('');
        setNewPortfolioDesc('');
        setNewPortfolioImage(null);
        (document.getElementById('portfolio-image-upload') as HTMLInputElement).value = '';
    } catch (error) {
        setPortfolioError('Falha ao processar a imagem.');
    }
  };

  const handleRemovePortfolioItem = (id: string) => {
      setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="relative p-8 flex-grow overflow-y-auto">
            <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Editar seu Perfil</h2>
            <p className="text-gray-500 mb-6">Mantenha suas informações atualizadas para atrair mais clientes.</p>

            {user.type === 'prestador' && (
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={handleEnhanceProfile}
                        disabled={isEnhancing}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 disabled:opacity-70 disabled:cursor-wait transition-all duration-300"
                    >
                        {isEnhancing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Otimizando...</span>
                            </>
                        ) : (
                             <>
                                <span>Otimizar Título e Biografia com IA</span>
                                <span className="text-lg">✨</span>
                            </>
                        )}
                    </button>
                    {enhanceError && <p className="text-xs text-red-600 mt-2 text-center">{enhanceError}</p>}
                </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
                    <input type="text" id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="000.000.000-00"/>
                </div>
              </div>
               <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço Completo</label>
                <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Rua, Número, Bairro, Cidade - Estado"/>
              </div>
              
              {user.type === 'prestador' && (
                <>
                <div>
                  <label htmlFor="headline" className="block text-sm font-medium text-gray-700">Título Profissional</label>
                  <input type="text" id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Ex: Eletricista Profissional"/>
                </div>
                <div>
                  <label htmlFor="specialties" className="block text-sm font-medium text-gray-700">Especialidades (separadas por vírgula)</label>
                  <input type="text" id="specialties" value={specialties} onChange={(e) => setSpecialties(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Ex: Instalação, Reparo de curto-circuito, Manutenção"/>
                </div>
                </>
              )}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Sobre você</label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Fale um pouco sobre você ou seus serviços..."
                />
              </div>

             {user.type === 'prestador' && (
                 <>
                    {/* Portfolio Management */}
                    <div className="pt-4 border-t border-gray-200">
                         <h3 className="text-md font-medium text-gray-800">Gerenciar Portfólio</h3>
                        {portfolio.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {portfolio.map(item => (
                                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                        <div className="flex items-center space-x-3">
                                            <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded object-cover" />
                                            <p className="text-sm font-medium text-gray-700 truncate">{item.title}</p>
                                        </div>
                                        <button type="button" onClick={() => handleRemovePortfolioItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}
                         <form onSubmit={handleAddPortfolioItem} className="mt-4 p-4 border border-gray-200 rounded-lg bg-slate-50 space-y-3">
                             <h4 className="text-sm font-semibold">Adicionar novo projeto</h4>
                             <div>
                                 <label htmlFor="portfolio-title" className="sr-only">Título do Projeto</label>
                                 <input type="text" id="portfolio-title" value={newPortfolioTitle} onChange={e => setNewPortfolioTitle(e.target.value)} placeholder="Título do Projeto" className="block w-full text-sm p-2 border-gray-300 rounded-md"/>
                             </div>
                             <div>
                                 <label htmlFor="portfolio-desc" className="sr-only">Descrição do Projeto</label>
                                 <textarea id="portfolio-desc" value={newPortfolioDesc} onChange={e => setNewPortfolioDesc(e.target.value)} placeholder="Breve descrição do projeto" rows={2} className="block w-full text-sm p-2 border-gray-300 rounded-md"/>
                             </div>
                             <div>
                                 <label htmlFor="portfolio-image-upload" className="sr-only">Imagem do Projeto</label>
                                 <input type="file" id="portfolio-image-upload" accept="image/*" onChange={e => setNewPortfolioImage(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                             </div>
                             {portfolioError && <p className="text-xs text-red-600">{portfolioError}</p>}
                             <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">+ Adicionar Projeto</button>
                         </form>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-md font-medium text-gray-800">Verificação de Documentos</h3>
                        <p className="text-sm text-gray-500 mb-3">Aumente a confiança dos clientes (simulação).</p>
                        <div className="space-y-2">
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input id="certificates" name="certificates" type="checkbox" checked={hasCertificates} onChange={(e) => setHasCertificates(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="certificates" className="font-medium text-gray-900">Possuo certificados e diplomas</label>
                                    <p className="text-gray-500">Marque se você pode fornecer comprovantes de suas qualificações.</p>
                                </div>
                            </div>
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input id="criminal" name="criminal" type="checkbox" checked={hasCriminalRecordCheck} onChange={(e) => setHasCriminalRecordCheck(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="criminal" className="font-medium text-gray-900">Verificação de antecedentes</label>
                                    <p className="text-gray-500">Marque se você pode fornecer um atestado de antecedentes criminais.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                 </>
              )}
            </div>
          </div>
          <div className="bg-gray-50 px-8 py-4 rounded-b-2xl text-right flex-shrink-0">
            <button type="button" onClick={onClose} className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;