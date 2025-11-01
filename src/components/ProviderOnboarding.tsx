import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ExtractedDocumentInfo } from '../../types';
import { auth } from '../../firebaseConfig'; // Import auth for token
import { extractInfoFromDocument } from '../../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface ProviderOnboardingProps {
  user: User;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const ProviderOnboarding: React.FC<ProviderOnboardingProps> = ({ user }) => {
  const [step, setStep] = useState<'welcome' | 'upload' | 'loading' | 'review' | 'pending' | 'rejected'>('welcome');
  const [error, setError] = useState<string | null>(null);
  const [documentImage, setDocumentImage] = useState<string | null>(null); // base64 data URL
  const [extractedData, setExtractedData] = useState<ExtractedDocumentInfo>({ fullName: '', cpf: '' });
  const navigate = useNavigate();

  // Initial state based on user's verification status
  React.useEffect(() => {
    if (user.verificationStatus === 'pendente') {
      setStep('pending');
    } else if (user.verificationStatus === 'recusado') {
      setStep('rejected');
    }
  }, [user.verificationStatus]);

  const handleFileChange = useCallback(async (file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
        setError('O arquivo é muito grande. Use uma imagem com menos de 4MB.');
        return;
    }

    setStep('loading');
    setError(null);
    const dataUrl = URL.createObjectURL(file);
    setDocumentImage(dataUrl);

    try {
      const base64Image = await toBase64(file);
      const result = await extractInfoFromDocument(base64Image, file.type);
      setExtractedData(result);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
      setStep('upload');
    }
  }, []);

  const handleVerificationSubmit = async () => {
    if (!documentImage) return;
    setStep('loading');
    try {
      const updatedProfile = {
        name: extractedData.fullName,
        cpf: extractedData.cpf,
        verificationStatus: 'pendente',
      };

      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/users/${user.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json',
                   'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) throw new Error('Falha ao enviar dados para verificação.');

      alert('Documentos enviados com sucesso! Sua conta está em análise.');
      navigate('/dashboard'); // Redirect to dashboard to see the pending status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao enviar.');
      setStep('review');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Bem-vindo(a) à SERVIO.AI, {user.name}!</h2>
            <p className="mt-2 text-gray-600">Para garantir a segurança de todos, precisamos verificar sua identidade. O processo é rápido e simples.</p>
            <button onClick={() => setStep('upload')} className="mt-6 px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Começar Verificação
            </button>
          </div>
        );
      case 'upload':
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Envie seu Documento</h2>
            <p className="mt-2 text-gray-500 text-sm">Por favor, envie uma foto nítida da frente do seu RG ou CNH.</p>
            <div className="mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"><span>Carregar um arquivo</span><input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} /></label></div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF até 4MB</p>
                </div>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        );
      case 'loading':
        return <LoadingSpinner />;
      case 'review':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-800 text-center">Confirme seus Dados</h2>
            <p className="mt-2 text-gray-500 text-sm text-center">Nossa IA extraiu estas informações. Por favor, verifique se estão corretas.</p>
            {documentImage && <img src={documentImage} alt="Documento" className="mt-4 max-h-48 mx-auto rounded-lg" />}
            <div className="mt-6 space-y-4">
              <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                  <input type="text" id="fullName" value={extractedData.fullName} onChange={e => setExtractedData({...extractedData, fullName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                  <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
                  <input type="text" id="cpf" value={extractedData.cpf} onChange={e => setExtractedData({...extractedData, cpf: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
            <button onClick={handleVerificationSubmit} className="mt-6 w-full px-8 py-3 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Enviar para Análise
            </button>
          </div>
        );
       case 'pending':
        return (
             <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">Análise em Andamento</h2>
                <p className="mt-2 text-gray-600">Recebemos seus documentos! Nossa equipe irá analisá-los em breve. Você será notificado assim que o processo for concluído (geralmente em até 24h).</p>
            </div>
        )
       case 'rejected':
        return (
             <div className="text-center">
                <h2 className="text-2xl font-bold text-red-700">Verificação Recusada</h2>
                <p className="mt-2 text-gray-600">Houve um problema ao verificar seus documentos. Isso pode acontecer se a imagem estiver ilegível ou se os dados não puderem ser confirmados.</p>
                 <button onClick={() => setStep('upload')} className="mt-6 px-8 py-3 text-lg font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                    Tentar Novamente
                </button>
            </div>
        )
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
      {renderContent()}
    </div>
  );
};

export default ProviderOnboarding;
