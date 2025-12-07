import React, { useState, useEffect } from 'react';
import { enhanceJobRequest } from '../services/geminiService';
import { EnhancedJobRequest, ServiceType, JobData, JobMode } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { auth } from '../firebaseConfig';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';
import { formatErrorForToast } from '../services/errorMessages';

interface AIJobRequestWizardProps {
  onClose: () => void;
  onSubmit: (jobData: JobData) => void;
  initialPrompt?: string;
  initialData?: JobData;
}

// Removed unused serviceTypeDetails mapping (lint unused-var). If needed for future UI tooltips, reintroduce.

const urgencyOptions: { id: 'hoje' | 'amanha' | '3dias' | '1semana'; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'amanha', label: 'Amanhã' },
  { id: '3dias', label: 'Em 3 dias' },
  { id: '1semana', label: 'Em 1 semana' },
];

const auctionDurations: { hours: number; label: string }[] = [
  { hours: 24, label: '24 Horas' },
  { hours: 48, label: '48 Horas' },
  { hours: 72, label: '72 Horas' },
];

const AIJobRequestWizard: React.FC<AIJobRequestWizardProps> = ({
  onClose,
  onSubmit,
  initialPrompt,
  initialData,
}) => {
  const [step, setStep] = useState<'initial' | 'loading' | 'review'>(() => {
    // Se temos initialData, ir direto para review; se tem initialPrompt, ir para loading
    if (initialData && (initialData.description || initialData.category)) return 'review';
    if (initialPrompt) return 'loading';
    return 'initial';
  });
  const [initialRequest, setInitialRequest] = useState(
    initialPrompt || initialData?.description || ''
  );
  const [address, setAddress] = useState(initialData?.address || '');
  const [files, setFiles] = useState<File[]>([]);
  const [enhancedRequest, setEnhancedRequest] = useState<EnhancedJobRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [finalDescription, setFinalDescription] = useState(initialData?.description || '');
  const [finalCategory, setFinalCategory] = useState(initialData?.category || '');
  const [finalServiceType, setFinalServiceType] = useState<ServiceType>(
    initialData?.serviceType || 'personalizado'
  );
  const [finalUrgency, setFinalUrgency] = useState<'hoje' | 'amanha' | '3dias' | '1semana'>(
    initialData?.urgency || '3dias'
  );
  const [finalFixedPrice, _setFinalFixedPrice] = useState(
    initialData?.fixedPrice?.toString() || ''
  );
  const [finalVisitFee, _setFinalVisitFee] = useState(initialData?.visitFee?.toString() || '');
  const [targetProviderId, _setTargetProviderId] = useState<string | undefined>(
    initialData?.targetProviderId
  );
  const [jobMode, setJobMode] = useState<JobMode>(initialData?.jobMode || 'normal');
  const [auctionDuration, setAuctionDuration] = useState<number>(
    initialData?.auctionDurationHours || 24
  );
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
      // Populate form fields immediately
      setFinalDescription(result.enhancedDescription || prompt);
      setFinalCategory(result.suggestedCategory || 'geral');
      setFinalServiceType(result.suggestedServiceType || 'personalizado');
      setStep('review');
    } catch (err) {
      // Even on error, allow user to proceed with heuristic fallback
      console.warn('[Wizard] AI error, using fallback:', err);
      setEnhancedRequest({
        enhancedDescription: prompt,
        suggestedCategory: 'geral',
        suggestedServiceType: 'personalizado',
      });
      setFinalDescription(prompt);
      setFinalCategory('geral');
      setFinalServiceType('personalizado');
      setStep('review');
      setError('A IA não está disponível no momento, mas você pode continuar com sua descrição.');
    }
  };

  // Removed redundant useEffect - fields are now set directly in handleAnalyze

  useEffect(() => {
    if (step === 'loading' && initialPrompt) {
      handleAnalyze(initialPrompt);
    }
  }, [step, initialPrompt]);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    const uploadedMedia: { name: string; path: string; type: 'image' | 'video' }[] = [];
    const tempJobId = `temp-${Date.now()}`; // Use a temporary ID for the folder path

    // Upload files one by one
    for (const file of files) {
      try {
        // 1. Get signed URL from our backend
        const token = await auth.currentUser?.getIdToken();
        const backendBase =
          (import.meta.env?.VITE_BACKEND_API_URL as string | undefined) ||
          (window?.location?.origin ?? '');
        const urlResponse = await fetch(`${backendBase.replace(/\/$/, '')}/generate-upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileName: file.name, contentType: file.type, jobId: tempJobId }),
        });
        if (!urlResponse.ok) throw new Error('Could not get upload URL.');
        const { signedUrl, filePath } = await urlResponse.json();

        // 2. Upload file directly to Google Cloud Storage
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!uploadResponse.ok) throw new Error(`Failed to upload ${file.name}.`);

        uploadedMedia.push({
          name: file.name,
          path: filePath,
          type: file.type.startsWith('video') ? 'video' : 'image',
        });
      } catch (error) {
        console.error(error);
        // Graceful degradation: skip media on failure but allow the job request to continue
        const errorMsg = formatErrorForToast(error, 'job');
        setError(
          `Não foi possível enviar o arquivo ${file.name}: ${errorMsg}. O pedido continuará sem este anexo.`
        );
      }
    }

    onSubmit({
      description: finalDescription,
      category: finalCategory,
      serviceType: finalServiceType,
      urgency: finalUrgency,
      address,
      media: uploadedMedia,
      fixedPrice:
        finalServiceType === 'tabelado' && finalFixedPrice
          ? parseFloat(finalFixedPrice)
          : undefined,
      visitFee:
        finalServiceType === 'diagnostico' && finalVisitFee ? parseFloat(finalVisitFee) : undefined,
      targetProviderId: targetProviderId,
      jobMode: jobMode,
      auctionDurationHours: jobMode === 'leilao' ? auctionDuration : undefined,
    });
  };

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
            <p className="text-gray-600 mb-6">
              Quanto mais detalhes, melhores as propostas. Nossa IA vai te ajudar a organizar tudo.
            </p>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="initial-request"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  1. Descreva sua necessidade*
                </label>
                <textarea
                  id="initial-request"
                  rows={4}
                  className="block w-full rounded-lg border-gray-300 shadow-sm text-gray-900 placeholder-gray-400"
                  placeholder="Ex: Meu chuveiro queimou e parou de esquentar. Preciso de um eletricista para consertar ou trocar o aparelho."
                  value={initialRequest}
                  onChange={e => setInitialRequest(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  2. Endereço do serviço
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm text-gray-900 placeholder-gray-400"
                  placeholder="Rua das Flores, 123, Bairro, Cidade - SP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  3. Fotos ou vídeos (opcional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-500"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Carregar arquivos</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-600">PNG, JPG, MP4, PDF até 10MB</p>
                  </div>
                </div>
                {files.length > 0 && (
                  <div className="mt-3 text-sm">
                    {files.map(file => (
                      <div
                        key={file.name}
                        className="flex justify-between items-center bg-gray-100 p-2 rounded-md"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(file.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          &times;
                        </button>
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
                data-testid="wizard-analyze-button"
              >
                Analisar com IA ✨
              </button>
            </div>
          </div>
        );
      case 'loading':
        return (
          <div className="p-8 text-center">
            <LoadingSpinner />
            <div className="mt-6 space-y-3">
              <p className="text-lg font-semibold text-gray-800">
                ✨ Analisando sua solicitação...
              </p>
              <p className="text-sm text-gray-600">
                Nossa IA está organizando os detalhes e sugerindo melhorias para você receber
                propostas mais precisas.
              </p>
              <div className="mt-4 flex justify-center items-center space-x-2">
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          </div>
        );
      case 'review':
        if (!enhancedRequest && !initialData) return null;
        return (
          <form onSubmit={handleFinalSubmit}>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Revise o seu Pedido</h2>
              <p className="text-gray-600 mb-6">
                A IA aprimorou sua solicitação. Você pode editar todos os detalhes antes de
                publicar.
              </p>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="service-description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Descrição do Serviço*
                  </label>
                  {finalDescription.includes('[...]') && (
                    <div className="mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded-md border border-blue-200">
                      ✏️ **Ação necessária:** Por favor, preencha as informações marcadas com
                      `[...]` abaixo para receber propostas mais precisas.
                    </div>
                  )}
                  <textarea
                    id="service-description"
                    rows={5}
                    value={finalDescription}
                    onChange={e => setFinalDescription(e.target.value)}
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 text-gray-900 placeholder-gray-400"
                    placeholder="Descreva o serviço que você precisa em detalhes..."
                    required
                  />
                </div>
                {/* Add address and media upload here again for post-login flow */}
                <div>
                  <label
                    htmlFor="address-review"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Endereço do serviço
                  </label>
                  <input
                    type="text"
                    id="address-review"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm text-gray-900 placeholder-gray-400"
                    placeholder="Rua das Flores, 123, Bairro, Cidade - SP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adicionar fotos, vídeos ou projetos
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-500"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload-review"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                        >
                          <span>Carregar arquivos</span>
                          <input
                            id="file-upload-review"
                            name="file-upload-review"
                            type="file"
                            className="sr-only"
                            multiple
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-600">PNG, JPG, MP4, PDF até 10MB</p>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-3 text-sm space-y-1">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex justify-between items-center bg-gray-100 p-2 rounded-md"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(file.name)}
                            className="text-red-500 hover:text-red-700 ml-2 font-bold text-lg leading-none"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Urgência</h3>
                  <div className="flex flex-wrap gap-3">
                    {urgencyOptions.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFinalUrgency(opt.id)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${finalUrgency === opt.id ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-gray-200 hover:border-blue-400'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Modalidade do Serviço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setJobMode('normal')}
                      className={`p-4 rounded-lg border-2 text-left flex items-start space-x-3 transition-all ${jobMode === 'normal' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'}`}
                    >
                      <span className="text-2xl mt-1">💬</span>
                      <div>
                        <p className="font-semibold text-gray-800">Normal</p>
                        <p className="text-xs text-gray-600">
                          Receba propostas de múltiplos profissionais.
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobMode('leilao')}
                      className={`p-4 rounded-lg border-2 text-left flex items-start space-x-3 transition-all ${jobMode === 'leilao' ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500' : 'bg-white border-gray-200 hover:border-orange-400'}`}
                    >
                      <span className="text-2xl mt-1">⚖️</span>
                      <div>
                        <p className="font-semibold text-gray-800">Leilão</p>
                        <p className="text-xs text-gray-600">
                          Profissionais competem pelo menor preço.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {jobMode === 'leilao' && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-800 mb-2">Duração do Leilão</h3>
                    <div className="flex flex-wrap gap-3">
                      {auctionDurations.map(opt => (
                        <button
                          key={opt.hours}
                          type="button"
                          onClick={() => setAuctionDuration(opt.hours)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${auctionDuration === opt.hours ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-white border-orange-200 hover:border-orange-400'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                data-testid="wizard-publish-button"
              >
                {jobMode === 'leilao' ? 'Publicar Leilão' : 'Publicar Job'}
              </button>
            </div>
          </form>
        );
    }
  };

  return (
    <div
      {...getModalOverlayProps(onClose)}
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
      data-testid="wizard-modal"
    >
      <div
        {...getModalContentProps()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl m-4 transform transition-all max-h-[90vh] flex flex-col"
      >
        <div className="relative flex-grow overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-600 z-10"
            data-testid="wizard-close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AIJobRequestWizard;
