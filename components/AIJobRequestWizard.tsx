

import React, { useState, useEffect } from 'react';
import { enhanceJobRequest } from '../services/geminiService';
// FIX: Import JobData from types.ts instead of App.tsx
import { EnhancedJobRequest, ServiceType, JobData, JobMode } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface AIJobRequestWizardProps {
  onClose: () => void;
  onSubmit: (jobData: JobData) => void;
  initialPrompt?: string;
  initialData?: JobData;
}

const serviceTypeDetails: { [key in ServiceType]: { name: string, description: string, icon: string } } = {
    'personalizado': { name: 'Personalizado', description: 'Ideal para jobs complexos que precisam de um orçamento sob medida.', icon: '📝' },
    'tabelado': { name: 'Tabelado', description: 'Para serviços simples com um preço fixo e escopo bem definido.', icon: '💰' },
    'diagnostico': { name: 'Diagnóstico', description: 'Quando o profissional precisa visitar o local para avaliar o problema.', icon: '🔍' },
};

const urgencyOptions: { id: 'hoje' | 'amanha' | '3dias' | '1semana', label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'amanha', label: 'Amanhã' },
    { id: '3dias', label: 'Em 3 dias' },
    { id: '1semana', label: 'Em 1 semana' },
];

const auctionDurations: { hours: number, label: string }[] = [
    { hours: 24, label: '24 Horas' },
    { hours: 48, label: '48 Horas' },
    { hours: 72, label: '72 Horas' },
];

const AIJobRequestWizard: React.FC<AIJobRequestWizardProps> = ({ onClose, onSubmit, initialPrompt, initialData }) => {
  const [step, setStep] = useState<'initial' | 'loading' | 'review'>(initialPrompt ? 'loading' : 'initial');
  const [initialRequest, setInitialRequest] = useState(initialPrompt || '');
  const [address, setAddress] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [enhancedRequest, setEnhancedRequest] = useState<EnhancedJobRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [finalDescription, setFinalDescription] = useState('');
  const [finalCategory, setFinalCategory] = useState('');
  const [finalServiceType, setFinalServiceType] = useState<ServiceType>('personalizado');
  const [finalUrgency, setFinalUrgency] = useState<'hoje' | 'amanha' | '3dias' | '1semana'>('3dias');
  const [finalFixedPrice, setFinalFixedPrice] = useState('');
  const [finalVisitFee, setFinalVisitFee] = useState('');
  const [targetProviderId, setTargetProviderId] = useState<string | undefined>(initialData?.targetProviderId);
  const [jobMode, setJobMode] = useState<JobMode>('normal');
  const [auctionDuration, setAuctionDuration] = useState<number>(24);

  const handleAnalyze = async (prompt: string, address?: string, fileCount?: number) => {
    if (prompt.trim().length < 10) {
      setError('Por favor, descreva um pouco mais o que você precisa.');
      setStep('initial');
      return;
    }
    setStep('loading');
    setError(null);
    try {
      const result = await enhanceJobRequest(prompt, address, fileCount);
      setEnhancedRequest(result);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
      setStep('initial');
    }
  };

  useEffect(() => {
    if (initialPrompt) {
        handleAnalyze(initialPrompt);
    } else if (initialData) {
        // Pre-populate state from initialData (e.g., after login) and go to review step
        setFinalDescription(initialData.description);
        setFinalCategory(initialData.category);
        setFinalServiceType(initialData.serviceType);
        setFinalUrgency(initialData.urgency);
        setAddress(initialData.address || '');
        // Note: we can't restore File objects, but we can show their names. The user would need to re-select.
        setFiles(initialData.media ? initialData.media.map(m => new File([], m.name)) : []);
        setFinalFixedPrice(initialData.fixedPrice?.toString() || '');
        setFinalVisitFee(initialData.visitFee?.toString() || '');
        setTargetProviderId(initialData.targetProviderId);
        setStep('review');
    }
  }, [initialPrompt, initialData]);


  useEffect(() => {
    if (enhancedRequest) {
      setFinalDescription(enhancedRequest.enhancedDescription);
      setFinalCategory(enhancedRequest.suggestedCategory);
      setFinalServiceType(enhancedRequest.suggestedServiceType);
    }
  }, [enhancedRequest]);

  const handleFinalSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const media = files.map(file => ({
          name: file.name,
          type: file.type.startsWith('video') ? 'video' : 'image' as 'image' | 'video'
      }));

      onSubmit({
        description: finalDescription,
        category: finalCategory,
        serviceType: finalServiceType,
        urgency: finalUrgency,
        address,
        media,
        fixedPrice: finalServiceType === 'tabelado' && finalFixedPrice ? parseFloat(finalFixedPrice) : undefined,
        visitFee: finalServiceType === 'diagnostico' && finalVisitFee ? parseFloat(finalVisitFee) : undefined,
        targetProviderId: targetProviderId,
        jobMode: jobMode,
        auctionDurationHours: jobMode === 'leilao' ? auctionDuration : undefined,
      });
  }
  
   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files!)]);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };


  const renderContent = () => {
    switch (step) {
      case 'initial':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Assistente de Criação de Job</h2>
            <p className="text-gray-500 mb-6">Quanto mais detalhes, melhores as propostas. Nossa IA vai te ajudar a organizar tudo.</p>
            <div className="space-y-6">
                <div>
                    <label htmlFor="initial-request" className="block text-sm font-medium text-gray-700 mb-1">1. Descreva sua necessidade*</label>
                    <textarea
                        id="initial-request"
                        rows={4}
                        className="block w-full rounded-lg border-gray-300 shadow-sm"
                        placeholder="Ex: Meu chuveiro queimou e parou de esquentar. Preciso de um eletricista para consertar ou trocar o aparelho."
                        value={initialRequest}
                        onChange={(e) => setInitialRequest(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">2. Endereço do serviço</label>
                    <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm" placeholder="Rua das Flores, 123, Bairro, Cidade - SP"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3. Fotos ou vídeos (opcional)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"><span>Carregar arquivos</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} /></label><p className="pl-1">ou arraste e solte</p></div>
                        <p className="text-xs text-gray-500">PNG, JPG, MP4, PDF até 10MB</p>
                        </div>
                    </div>
                     {files.length > 0 && (
                        <div className="mt-3 text-sm">
                            {files.map(file => (
                                <div key={file.name} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                    <span className="truncate">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(file.name)} className="text-red-500 hover:text-red-700">&times;</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-2 px-8">{error}</p>}
            <div className="px-8 py-4">
            <button
              onClick={() => handleAnalyze(initialRequest, address, files.length)}
              disabled={!initialRequest}
              className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Analisar com IA ✨
            </button>
            </div>
          </div>
        );
      case 'loading':
        return (
            <div className="p-8">
                <LoadingSpinner />
            </div>
        );
      case 'review':
        if (!enhancedRequest && !initialData) return null;
        return (
          <form onSubmit={handleFinalSubmit}>
            <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Revise o seu Pedido</h2>
                <p className="text-gray-500 mb-6">A IA aprimorou sua solicitação. Você pode editar todos os detalhes antes de publicar.</p>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="service-description" className="block text-sm font-medium text-gray-700">Descrição do Serviço</label>
                        <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded-md border border-blue-200">
                          ✏️ **Ação necessária:** Por favor, preencha as informações marcadas com `[...]` abaixo para receber propostas mais precisas.
                        </div>
                        <textarea id="service-description" rows={5} value={finalDescription} onChange={(e) => setFinalDescription(e.target.value)} className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"/>
                    </div>
                    {/* Add address and media upload here again for post-login flow */}
                     <div>
                        <label htmlFor="address-review" className="block text-sm font-medium text-gray-700 mb-1">Endereço do serviço</label>
                        <input type="text" id="address-review" value={address} onChange={e => setAddress(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm" placeholder="Rua das Flores, 123, Bairro, Cidade - SP"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adicionar fotos, vídeos ou projetos</label>
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <div className="flex text-sm text-gray-600"><label htmlFor="file-upload-review" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"><span>Carregar arquivos</span><input id="file-upload-review" name="file-upload-review" type="file" className="sr-only" multiple onChange={handleFileChange} /></label><p className="pl-1">ou arraste e solte</p></div>
                            <p className="text-xs text-gray-500">PNG, JPG, MP4, PDF até 10MB</p>
                            </div>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-3 text-sm space-y-1">
                                {files.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                        <span className="truncate">{file.name}</span>
                                        <button type="button" onClick={() => removeFile(file.name)} className="text-red-500 hover:text-red-700 ml-2 font-bold text-lg leading-none">&times;</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Urgência</h3>
                        <div className="flex flex-wrap gap-3">
                            {urgencyOptions.map(opt => (
                                <button key={opt.id} type="button" onClick={() => setFinalUrgency(opt.id)} className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${finalUrgency === opt.id ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Modalidade do Serviço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <button type="button" onClick={() => setJobMode('normal')} className={`p-4 rounded-lg border-2 text-left flex items-start space-x-3 transition-all ${jobMode === 'normal' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
                                <span className="text-2xl mt-1">💬</span>
                                <div>
                                    <p className="font-semibold text-gray-800">Normal</p>
                                    <p className="text-xs text-gray-500">Receba propostas de múltiplos profissionais.</p>
                                </div>
                            </button>
                             <button type="button" onClick={() => setJobMode('leilao')} className={`p-4 rounded-lg border-2 text-left flex items-start space-x-3 transition-all ${jobMode === 'leilao' ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500' : 'bg-white border-gray-200 hover:border-orange-400'}`}>
                                <span className="text-2xl mt-1">⚖️</span>
                                <div>
                                    <p className="font-semibold text-gray-800">Leilão</p>
                                    <p className="text-xs text-gray-500">Profissionais competem pelo menor preço.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {jobMode === 'leilao' && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <h3 className="text-sm font-medium text-orange-800 mb-2">Duração do Leilão</h3>
                            <div className="flex flex-wrap gap-3">
                                {auctionDurations.map(opt => (
                                    <button key={opt.hours} type="button" onClick={() => setAuctionDuration(opt.hours)} className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${auctionDuration === opt.hours ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-white border-orange-200 hover:border-orange-400'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
            <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                    {jobMode === 'leilao' ? 'Publicar Leilão' : 'Publicar Job'}
                </button>
          </div>
          </form>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl m-4 transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex-grow overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AIJobRequestWizard;