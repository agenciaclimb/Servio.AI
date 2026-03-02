import React, { useState, useCallback } from 'react';
import { User, PortfolioItem, ExtractedDocumentInfo } from '../../types';
// import {
//   generateProviderBio,
//   analyzePortfolioImage,
//   validateCertification
// } from '../../services/geminiService';
import { auth } from '../../firebaseConfig';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractInfoFromDocument } from '../../services/geminiService';

// Temporary types until proper types are defined
interface Certification {
  id: string;
  name: string;
  title?: string;
  issuer: string;
  date?: string;
  issueDate?: string;
  expiryDate?: string;
  verified: boolean;
}

interface ProviderTeam {
  id: string;
  name: string;
  role: string;
}

interface ProviderOnboardingWizardProps {
  user: User;
  onComplete: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

interface OnboardingData {
  // Step 1: Verificação (já existe no user)
  documentVerified: boolean;

  // Step 2: Perfil Profissional
  providerType: 'autonomo' | 'empresa';
  companyName?: string;
  category: string;
  yearsOfExperience: number;
  certifications: Certification[];
  serviceAreas: string[];
  teamSize?: number;
  teams?: ProviderTeam[];

  // Step 3: Bio e Diferencial
  bio: string;
  headline: string;
  specialties: string[];
  differentials: string[];
  aiGeneratedBio: boolean;

  // Step 4: Portfólio
  portfolio: PortfolioItem[];

  // Step 5: Pagamentos (Stripe)
  stripeConnected: boolean;
}

const INITIAL_DATA: OnboardingData = {
  documentVerified: false,
  providerType: 'autonomo',
  category: '',
  yearsOfExperience: 0,
  certifications: [],
  serviceAreas: [],
  bio: '',
  headline: '',
  specialties: [],
  differentials: [],
  aiGeneratedBio: false,
  portfolio: [],
  stripeConnected: false,
};

const ProviderOnboardingWizard: React.FC<ProviderOnboardingWizardProps> = ({
  user,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    user.verificationStatus === 'verificado' ? 2 : 1
  );
  const [data, setData] = useState<OnboardingData>({
    ...INITIAL_DATA,
    documentVerified: user.verificationStatus === 'verificado',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados temporários para cada step
  const [documentImage, setDocumentImage] = useState<string | null>(user.documentImage || null);
  const [extractedDocData, setExtractedDocData] = useState({
    fullName: user.name,
    cpf: user.cpf || '',
    cnpj: '',
  });
  const [bioInput, setBioInput] = useState('');
  const [generatingBio, setGeneratingBio] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => (prev + 1) as WizardStep);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as WizardStep);
      setError(null);
    }
  };

  // ============================================================================
  // STEP 1: Verificação de Identidade
  // ============================================================================

  const handleDocumentUpload = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      setError('Arquivo muito grande. Use uma imagem com menos de 4MB.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const dataUrl = URL.createObjectURL(file);
      setDocumentImage(dataUrl);

      // Extrair informações com IA
      const extracted = await extractInfoFromDocument(base64, file.type);
      setExtractedDocData({
        fullName: extracted.fullName || user.name,
        cpf: extracted.cpf || '',
        cnpj: (extracted as ExtractedDocumentInfo & { cnpj?: string }).cnpj || '',
      });

      updateData({ documentVerified: false }); // Aguarda revisão
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!documentImage) {
      setError('Por favor, envie um documento');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const baseUrl = import.meta.env.VITE_BACKEND_API_URL || '';

      const updatedData: Partial<User> = {
        name: extractedDocData.fullName,
        verificationStatus: 'pendente',
      };

      if (data.providerType === 'autonomo') {
        updatedData.cpf = extractedDocData.cpf;
      } else {
        (updatedData as Partial<User> & { cnpj?: string }).cnpj = extractedDocData.cnpj;
      }

      const response = await fetch(`${baseUrl}/users/${user.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Falha ao enviar dados');

      updateData({ documentVerified: true });
      handleNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar verificação');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // STEP 2: Perfil Profissional
  // ============================================================================

  const handleAddCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      verified: false,
    };
    updateData({ certifications: [...data.certifications, newCert] });
  };

  const handleUpdateCertification = (id: string, updates: Partial<Certification>) => {
    updateData({
      certifications: data.certifications.map(cert =>
        cert.id === id ? { ...cert, ...updates } : cert
      ),
    });
  };

  const handleRemoveCertification = (id: string) => {
    updateData({
      certifications: data.certifications.filter(cert => cert.id !== id),
    });
  };

  const handleCertificationImageUpload = async (id: string, file: File) => {
    try {
      setLoading(true);
      await fileToBase64(file);
      // TODO: Implement validateCertification service
      const result = {
        valid: true,
        confidence: 0.8,
        extractedData: {
          name: file.name.replace(/\.[^/.]+$/, ''),
          issuer: 'Emissor não identificado',
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: undefined,
        },
      };

      handleUpdateCertification(id, {
        name: result.extractedData.name || '',
        issuer: result.extractedData.issuer || '',
        issueDate: result.extractedData.issueDate,
        expiryDate: result.extractedData.expiryDate,
        verified: result.valid && result.confidence > 0.7,
      });
    } catch (err) {
      setError('Erro ao validar certificado');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // STEP 3: Bio e Diferencial com IA
  // ============================================================================

  const handleGenerateBio = async () => {
    if (!data.category) {
      setError('Selecione uma categoria primeiro');
      return;
    }

    setGeneratingBio(true);
    setError(null);

    try {
      // TODO: Implement generateProviderBio service
      const result = {
        bio: `${user.name} - Profissional em ${data.category} com ${data.yearsOfExperience} anos de experiência.`,
        headline: `${data.category} - ${data.yearsOfExperience}+ anos`,
      };

      updateData({
        bio: result.bio,
        headline: result.headline,
        aiGeneratedBio: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar bio');
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleAddSpecialty = (specialty: string) => {
    if (specialty && !data.specialties.includes(specialty)) {
      updateData({ specialties: [...data.specialties, specialty] });
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    updateData({ specialties: data.specialties.filter(s => s !== specialty) });
  };

  const handleAddDifferential = (diff: string) => {
    if (diff && !data.differentials.includes(diff)) {
      updateData({ differentials: [...data.differentials, diff] });
    }
  };

  const handleRemoveDifferential = (diff: string) => {
    updateData({ differentials: data.differentials.filter(d => d !== diff) });
  };

  // ============================================================================
  // STEP 4: Portfólio
  // ============================================================================

  const handlePortfolioUpload = async (files: FileList) => {
    if (files.length === 0) return;
    if (data.portfolio.length + files.length > 10) {
      setError('Máximo de 10 imagens no portfólio');
      return;
    }

    setUploadingPortfolio(true);
    setError(null);

    try {
      const newItems: PortfolioItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await fileToBase64(file);
        const dataUrl = URL.createObjectURL(file);

        // TODO: Implement analyzePortfolioImage service
        const analysis = {
          suggestedTitle: file.name.replace(/\.[^/.]+$/, ''),
          suggestedDescription: `Imagem de portfólio - ${data.category}`,
        };

        newItems.push({
          id: Date.now().toString() + i,
          imageUrl: dataUrl,
          title: analysis.suggestedTitle,
          description: analysis.suggestedDescription,
        });
      }

      updateData({ portfolio: [...data.portfolio, ...newItems] });
    } catch (err) {
      setError('Erro ao processar imagens');
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleUpdatePortfolioItem = (id: string, updates: Partial<PortfolioItem>) => {
    updateData({
      portfolio: data.portfolio.map(item => (item.id === id ? { ...item, ...updates } : item)),
    });
  };

  const handleRemovePortfolioItem = (id: string) => {
    updateData({ portfolio: data.portfolio.filter(item => item.id !== id) });
  };

  // ============================================================================
  // STEP 5: Pagamentos (Stripe)
  // ============================================================================

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const baseUrl = (import.meta.env.VITE_BACKEND_API_URL || '').replace(/\/$/, '');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1) Cria conta Connect (Express) e persiste stripeAccountId no usuário (email como ID)
      const accountRes = await fetch(`${baseUrl}/api/stripe/create-connect-account`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user.email }),
      });
      if (!accountRes.ok) {
        throw new Error('Falha ao criar conta Stripe Connect');
      }

      // 2) Gera Account Link para onboarding
      const linkRes = await fetch(`${baseUrl}/api/stripe/create-account-link`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user.email }),
      });
      if (!linkRes.ok) {
        throw new Error('Falha ao gerar link de onboarding Stripe');
      }

      const { url } = await linkRes.json();
      if (!url) throw new Error('Link de onboarding inválido');

      window.location.href = url; // Redireciona para Stripe
    } catch (err) {
      setError('Erro ao conectar com Stripe');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // STEP 6: Preview e Finalização
  // ============================================================================

  const handleFinish = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const baseUrl = import.meta.env.VITE_BACKEND_API_URL || '';

      const updatedUser: Partial<User> & {
        providerType?: string;
        cnpj?: string;
        companyName?: string;
        yearsOfExperience?: number;
        certifications?: Array<{ name: string; year: number }>;
        serviceAreas?: string[];
        teamSize?: number;
        teams?: Array<{ role: string; count: number }>;
        differentials?: string[];
        aiGeneratedBio?: boolean;
      } = {
        providerType: data.providerType,
        companyName: data.companyName,
        cnpj: data.providerType === 'empresa' ? extractedDocData.cnpj : undefined,
        cpf: data.providerType === 'autonomo' ? extractedDocData.cpf : undefined,
        headline: data.headline,
        bio: data.bio,
        specialties: data.specialties,
        yearsOfExperience: data.yearsOfExperience,
        certifications: data.certifications as unknown as
          | Array<{ name: string; year: number }>
          | undefined,
        serviceAreas: data.serviceAreas,
        teamSize: data.teamSize,
        teams: data.teams as unknown as Array<{ role: string; count: number }> | undefined,
        differentials: data.differentials,
        portfolio: data.portfolio,
        aiGeneratedBio: data.aiGeneratedBio,
      };

      await fetch(`${baseUrl}/users/${user.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });

      onComplete();
    } catch (err) {
      setError('Erro ao salvar perfil');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Verificação de Identidade</h2>
        <p className="mt-2 text-gray-600">
          Precisamos verificar sua identidade para garantir a segurança da plataforma.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Você é:</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              checked={data.providerType === 'autonomo'}
              onChange={() => updateData({ providerType: 'autonomo' })}
              className="w-4 h-4"
            />
            <span className="text-gray-700">
              <strong>Autônomo / Pessoa Física</strong> - Profissional individual
            </span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              checked={data.providerType === 'empresa'}
              onChange={() => updateData({ providerType: 'empresa' })}
              className="w-4 h-4"
            />
            <span className="text-gray-700">
              <strong>Empresa / Pessoa Jurídica</strong> - Tenho CNPJ e equipes
            </span>
          </label>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Envie foto do seu{' '}
          <strong>
            {data.providerType === 'autonomo' ? 'RG ou CNH' : 'Contrato Social ou CNPJ'}
          </strong>
        </p>
        <label
          htmlFor="document-upload"
          className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
        >
          Escolher Arquivo
        </label>
        <input
          id="document-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleDocumentUpload(e.target.files[0])}
        />
      </div>

      {documentImage && (
        <div className="space-y-4">
          <img src={documentImage} alt="Documento" className="max-h-48 mx-auto rounded-lg border" />

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo {data.providerType === 'empresa' && '(Responsável Legal)'}
            </label>
            <input
              id="fullName"
              type="text"
              value={extractedDocData.fullName}
              onChange={e => setExtractedDocData(prev => ({ ...prev, fullName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {data.providerType === 'autonomo' ? (
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                value={extractedDocData.cpf}
                onChange={e => setExtractedDocData(prev => ({ ...prev, cpf: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="000.000.000-00"
              />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  id="cnpj"
                  type="text"
                  value={extractedDocData.cnpj}
                  onChange={e => setExtractedDocData(prev => ({ ...prev, cnpj: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome Fantasia da Empresa
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={data.companyName || ''}
                  onChange={e => updateData({ companyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Silva & Cia Eletricistas"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSubmitVerification}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar para Análise'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Perfil Profissional</h2>
        <p className="mt-2 text-gray-600">Conte-nos sobre sua experiência e qualificações</p>
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria Principal *
        </label>
        <select
          value={data.category}
          onChange={e => updateData({ category: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          <option value="Eletricista">Eletricista</option>
          <option value="Encanador">Encanador</option>
          <option value="Pintor">Pintor</option>
          <option value="Pedreiro">Pedreiro</option>
          <option value="Marceneiro">Marceneiro</option>
          <option value="Serralheiro">Serralheiro</option>
          <option value="Jardineiro">Jardineiro</option>
          <option value="Limpeza">Limpeza</option>
          <option value="Dedetização">Dedetização</option>
          <option value="Chaveiro">Chaveiro</option>
          <option value="Ar Condicionado">Ar Condicionado</option>
          <option value="Marido de Aluguel">Marido de Aluguel</option>
        </select>
      </div>

      {/* Anos de Experiência */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Anos de Experiência: <strong>{data.yearsOfExperience}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={data.yearsOfExperience}
          onChange={e => updateData({ yearsOfExperience: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Tamanho da Equipe (só para empresas) */}
      {data.providerType === 'empresa' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho da Equipe</label>
          <input
            type="number"
            min="1"
            value={data.teamSize || 1}
            onChange={e => updateData({ teamSize: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Número de profissionais"
          />
        </div>
      )}

      {/* Áreas de Atendimento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Áreas de Atendimento</label>
        <input
          type="text"
          placeholder="Ex: São Paulo, Zona Sul, Pinheiros..."
          className="w-full px-3 py-2 border rounded-lg"
          onKeyPress={e => {
            if (e.key === 'Enter') {
              const input = e.currentTarget;
              if (input.value.trim()) {
                updateData({ serviceAreas: [...data.serviceAreas, input.value.trim()] });
                input.value = '';
              }
            }
          }}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {data.serviceAreas.map((area, idx) => (
            <span
              key={idx}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {area}
              <button
                onClick={() =>
                  updateData({ serviceAreas: data.serviceAreas.filter((_, i) => i !== idx) })
                }
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Certificações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certificações e Cursos
        </label>
        <button
          onClick={handleAddCertification}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 text-gray-600 hover:text-blue-600"
        >
          + Adicionar Certificação
        </button>

        <div className="mt-4 space-y-3">
          {data.certifications.map(cert => (
            <div key={cert.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <input
                  type="text"
                  value={cert.name}
                  onChange={e => handleUpdateCertification(cert.id, { name: e.target.value })}
                  placeholder="Nome do certificado"
                  className="flex-1 px-2 py-1 border rounded"
                />
                <button
                  onClick={() => handleRemoveCertification(cert.id)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  🗑️
                </button>
              </div>
              <input
                type="text"
                value={cert.issuer || ''}
                onChange={e => handleUpdateCertification(cert.id, { issuer: e.target.value })}
                placeholder="Instituição emissora"
                className="w-full px-2 py-1 border rounded mb-2"
              />
              <label className="block text-xs text-gray-600 cursor-pointer hover:text-blue-600">
                📎 Upload do certificado (IA validará)
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e =>
                    e.target.files?.[0] &&
                    handleCertificationImageUpload(cert.id, e.target.files[0])
                  }
                />
              </label>
              {cert.verified && (
                <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  ✓ Verificado por IA
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleNext}
          disabled={!data.category}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Apresentação Profissional</h2>
        <p className="mt-2 text-gray-600">Use a IA para criar uma bio otimizada para SEO</p>
      </div>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título Profissional (aparece em destaque)
        </label>
        <input
          type="text"
          value={data.headline || ''}
          onChange={e => updateData({ headline: e.target.value })}
          placeholder="Ex: Eletricista Certificado com 10 anos de experiência"
          className="w-full px-3 py-2 border rounded-lg"
          maxLength={60}
        />
        <p className="text-xs text-gray-500 mt-1">{(data.headline || '').length}/60 caracteres</p>
      </div>

      {/* Input para IA */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conte-nos mais sobre você (opcional - ajuda a IA)
        </label>
        <textarea
          value={bioInput}
          onChange={e => setBioInput(e.target.value)}
          placeholder="Ex: Trabalho principalmente com instalações residenciais, tenho especialização em sistemas smart home..."
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>

      <button
        onClick={handleGenerateBio}
        disabled={generatingBio || !data.category}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {generatingBio ? (
          <>
            <span className="animate-spin">⚙️</span>
            Gerando com IA...
          </>
        ) : (
          <>✨ Gerar Bio com IA</>
        )}
      </button>

      {/* Bio gerada */}
      {data.bio && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sua Bio Profissional{' '}
            {data.aiGeneratedBio && (
              <span className="text-purple-600 text-xs">✨ Gerada por IA</span>
            )}
          </label>
          <textarea
            value={data.bio}
            onChange={e => updateData({ bio: e.target.value, aiGeneratedBio: false })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={6}
          />
        </div>
      )}

      {/* Especialidades */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades</label>
        <input
          type="text"
          placeholder="Digite e pressione Enter"
          className="w-full px-3 py-2 border rounded-lg"
          onKeyPress={e => {
            if (e.key === 'Enter') {
              const input = e.currentTarget;
              if (input.value.trim()) {
                handleAddSpecialty(input.value.trim());
                input.value = '';
              }
            }
          }}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {data.specialties.map((spec, idx) => (
            <span
              key={idx}
              className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {spec}
              <button
                onClick={() => handleRemoveSpecialty(spec)}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Diferenciais */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Seus Diferenciais</label>
        <input
          type="text"
          placeholder="Ex: Garantia de 1 ano, Atendimento 24h..."
          className="w-full px-3 py-2 border rounded-lg"
          onKeyPress={e => {
            if (e.key === 'Enter') {
              const input = e.currentTarget;
              if (input.value.trim()) {
                handleAddDifferential(input.value.trim());
                input.value = '';
              }
            }
          }}
        />
        <div className="space-y-2 mt-2">
          {data.differentials.map((diff, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded">
              <span className="text-green-600">✓</span>
              <span className="flex-1 text-gray-700">{diff}</span>
              <button
                onClick={() => handleRemoveDifferential(diff)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleNext}
          disabled={!data.bio || !data.headline}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Portfólio de Trabalhos</h2>
        <p className="mt-2 text-gray-600">Mostre seus melhores trabalhos (máx. 10 fotos)</p>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          A IA analisará suas fotos e sugerirá títulos e descrições
        </p>
        <label className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
          {uploadingPortfolio ? 'Analisando...' : '+ Adicionar Fotos'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploadingPortfolio || data.portfolio.length >= 10}
            onChange={e => e.target.files && handlePortfolioUpload(e.target.files)}
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">{data.portfolio.length}/10 fotos</p>
      </div>

      {/* Portfolio Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.portfolio.map(item => (
          <div key={item.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <input
                type="text"
                value={item.title}
                onChange={e => handleUpdatePortfolioItem(item.id, { title: e.target.value })}
                placeholder="Título do trabalho"
                className="w-full px-2 py-1 border rounded mb-2 font-semibold"
              />
              <textarea
                value={item.description || ''}
                onChange={e => handleUpdatePortfolioItem(item.id, { description: e.target.value })}
                placeholder="Descrição do trabalho"
                className="w-full px-2 py-1 border rounded text-sm"
                rows={2}
              />
              <button
                onClick={() => handleRemovePortfolioItem(item.id)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                🗑️ Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Próximo
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Configurar Pagamentos</h2>
        <p className="mt-2 text-gray-600">
          Conecte sua conta para receber pagamentos com segurança
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 rounded-full p-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-2">Stripe Connect</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Receba pagamentos direto na sua conta</li>
              <li>✓ Transferências automáticas</li>
              <li>✓ Segurança e proteção contra fraudes</li>
              <li>✓ Suporte a PIX, cartão e boleto</li>
            </ul>
          </div>
        </div>
      </div>

      {user.stripeAccountId ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <span className="text-green-600 text-lg">✓</span>
          <p className="text-green-800 font-semibold mt-2">Conta Stripe Conectada!</p>
          <p className="text-sm text-green-600 mt-1">
            ID: {user.stripeAccountId.substring(0, 20)}...
          </p>
        </div>
      ) : (
        <button
          onClick={handleConnectStripe}
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold text-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⚙️</span>
              Conectando...
            </>
          ) : (
            <>🔗 Conectar com Stripe</>
          )}
        </button>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <strong>Importante:</strong> Você será redirecionado para o Stripe para completar o
          cadastro. Precisará fornecer dados bancários e documentos para verificação.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleNext}
          disabled={!user.stripeAccountId}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Revisar e Publicar</h2>
        <p className="mt-2 text-gray-600">Confira seu perfil antes de publicar</p>
      </div>

      {/* Preview Card */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="-mt-16 mb-4">
            <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-blue-600">
              {(data.providerType === 'empresa' && data.companyName
                ? data.companyName
                : user.name
              ).charAt(0)}
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-800">
            {data.providerType === 'empresa' && data.companyName ? data.companyName : user.name}
          </h3>
          <p className="text-lg text-gray-600 mt-1">{data.headline}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {data.category}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              {data.yearsOfExperience} anos de experiência
            </span>
            {data.providerType === 'empresa' && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                Equipe de {data.teamSize} profissionais
              </span>
            )}
          </div>

          {/* Bio */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-2">Sobre</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{data.bio}</p>
          </div>

          {/* Especialidades */}
          {data.specialties.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-2">Especialidades</h4>
              <div className="flex flex-wrap gap-2">
                {data.specialties.map((spec, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Diferenciais */}
          {data.differentials.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-2">Diferenciais</h4>
              <div className="space-y-2">
                {data.differentials.map((diff, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>{diff}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Preview */}
          {data.portfolio.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">Portfólio</h4>
              <div className="grid grid-cols-3 gap-2">
                {data.portfolio.slice(0, 6).map(item => (
                  <img
                    key={item.id}
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
              {data.portfolio.length > 6 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  +{data.portfolio.length - 6} fotos
                </p>
              )}
            </div>
          )}

          {/* Certificações */}
          {data.certifications.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-2">Certificações</h4>
              <div className="space-y-2">
                {data.certifications.map(cert => (
                  <div key={cert.id} className="flex items-center gap-2 text-sm">
                    <span className="text-blue-600">📜</span>
                    <span className="text-gray-700">{cert.name}</span>
                    {cert.verified && <span className="text-green-600 text-xs">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Áreas de Atendimento */}
          {data.serviceAreas.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-2">Áreas de Atendimento</h4>
              <p className="text-sm text-gray-600">{data.serviceAreas.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Atenção:</strong> Seu perfil será analisado pela nossa equipe. A verificação
          pode levar até 24 horas. Você receberá um email quando for aprovado.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleFinish}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 font-semibold"
        >
          {loading ? 'Publicando...' : '🚀 Publicar Perfil'}
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Etapa {currentStep} de 6</span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 6) * 100)}% completo
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4, 5, 6].map(step => (
            <div
              key={step}
              className={`flex flex-col items-center ${
                step <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step <= currentStep ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white'
                }`}
              >
                {step < currentStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{step}</span>
                )}
              </div>
              <span className="text-xs mt-1 hidden sm:block">
                {step === 1 && 'Verificação'}
                {step === 2 && 'Perfil'}
                {step === 3 && 'Bio'}
                {step === 4 && 'Portfólio'}
                {step === 5 && 'Pagamento'}
                {step === 6 && 'Preview'}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {loading ? <LoadingSpinner /> : renderStepContent()}
        </div>
      </div>
    </div>
  );
};

// Helper function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data URL prefix
    };
    reader.onerror = reject;
  });
};

export default ProviderOnboardingWizard;
