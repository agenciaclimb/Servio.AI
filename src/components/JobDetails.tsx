import React from 'react';
import { Job, User, Proposal, Message } from '../../types';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Chat from './Chat';

interface JobDetailsProps {
  job: Job;
  proposals: Proposal[];
  messages: Message[];
  currentUser: User;
  authToken?: string | null;
  onBack: () => void;
  onAcceptProposal: (proposalId: string) => void;
  onSendMessage: (text: string) => void;
  onPay: (job: Job, amount: number) => void;
  onCompleteJob: (jobId: string) => void;
  onOpenDispute: (jobId: string) => void;
  onOpenReview: (jobId: string) => void;
  onSetOnTheWay: (jobId: string) => void;
  aiSuggestion?: { date: string; time: string } | null;
  onConfirmSchedule: () => void;
  onDataRefresh?: () => Promise<void>;
}

const MediaItem: React.FC<{ media: { name: string, path: string } }> = ({ media }) => {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storage = getStorage();
    const fileRef = ref(storage, media.path);
    getDownloadURL(fileRef)
      .then(setUrl)
      .catch(error => console.error("Error getting download URL:", error));
  }, [media.path]);

  if (!url) return <div className="w-24 h-24 bg-gray-200 rounded-md animate-pulse"></div>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 bg-gray-100 rounded-md overflow-hidden"><img src={url} alt={media.name} className="w-full h-full object-cover" /></a>
  );
};

const JobDetails: React.FC<JobDetailsProps> = ({ job, proposals, messages, currentUser, authToken, onBack, onAcceptProposal, onSendMessage, onPay, onCompleteJob, onOpenDispute, onOpenReview, onSetOnTheWay, aiSuggestion, onConfirmSchedule }) => {

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'em_progresso': return 'bg-blue-100 text-blue-800';
      case 'a_caminho': return 'bg-teal-100 text-teal-800';
      case 'ativo': return 'bg-yellow-100 text-yellow-800';
      case 'em_disputa': return 'bg-red-100 text-red-800';
      case 'agendado': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isClientView = currentUser.type === 'cliente';
  const acceptedProposal = proposals.find(p => p.status === 'aceita');

  const generateICSFile = () => {
    const startDate = new Date(job.scheduledDate!);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

    const toUTC = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Servio.AI//EN',
      'BEGIN:VEVENT',
      `UID:${job.id}@servio.ai`,
      `DTSTAMP:${toUTC(new Date())}`,
      `DTSTART:${toUTC(startDate)}`,
      `DTEND:${toUTC(endDate)}`,
      `SUMMARY:Serviço Agendado: ${job.category}`,
      `DESCRIPTION:Serviço agendado através da plataforma SERVIO.AI. Descrição: ${job.description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `servico-${job.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <button onClick={onBack} className="text-sm font-medium text-blue-600 hover:text-blue-500 mb-4">
          &larr; Voltar para o Dashboard
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.category}</h1>
            <p className="text-gray-500 mt-1">{job.description}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(job.status)}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>
      </header>

      {isClientView && job.status === 'em_progresso' && acceptedProposal && (
        <div className="mb-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <h3 className="font-bold text-blue-800">Pronto para Pagar?</h3>
          <p className="text-sm text-blue-700 mt-1">O pagamento ficará retido com segurança e será liberado para o prestador apenas quando você confirmar a conclusão do serviço.</p>
          <button onClick={() => onPay(job, acceptedProposal.price)} className="mt-3 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
            Pagar com Segurança (R$ {acceptedProposal.price.toFixed(2)})
          </button>
        </div>
      )}

      {job.status === 'agendado' && (
        <div className="mb-8 bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
          <h3 className="font-bold text-purple-800">Serviço Agendado!</h3>
          <p className="text-sm text-purple-700 mt-1">
            Agendado para: {new Date(job.scheduledDate!).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
          {isClientView && (
            <button onClick={generateICSFile} className="mt-3 px-4 py-2 text-sm bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700">
              Adicionar à Agenda
            </button>
          )}
          {!isClientView && (
            <button onClick={() => onSetOnTheWay(job.id)} className="mt-3 px-6 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700">
              Estou a Caminho
            </button>
          )}
        </div>
      )}

      {isClientView && job.status === 'em_progresso' && !acceptedProposal && ( // Assuming payment is done, but we need a better check
        <div className="mb-8 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <h3 className="font-bold text-green-800">O serviço foi concluído?</h3>
          <p className="text-sm text-green-700 mt-1">Ao confirmar, o pagamento será liberado para o prestador. Esta ação não pode ser desfeita.</p>
          <button onClick={() => onCompleteJob(job.id)} className="mt-3 px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
            Sim, confirmar conclusão
          </button>
        </div>
      )}

      {isClientView && job.status === 'concluido' && !job.review && (
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg text-center">
          <h3 className="font-bold text-yellow-800">Serviço Concluído!</h3>
          <p className="text-sm text-yellow-700 mt-1">Sua opinião é muito importante. Por favor, avalie o serviço prestado.</p>
          <button onClick={() => onOpenReview(job.id)} className="mt-3 px-6 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600">
            Deixar Avaliação
          </button>
        </div>
      )}

      {job.review && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-800">Sua Avaliação</h3>
          <div className="flex items-center my-2">
            {'★'.repeat(job.review.rating).padEnd(5, '☆')}
          </div>
          <p className="text-sm text-gray-600 italic">"{job.review.comment}"</p>
        </div>
      )}

      {job.media && job.media.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Mídia Anexada</h3>
          <div className="flex flex-wrap gap-4">
            {job.media.map((media, index) => (
              <MediaItem key={index} media={media} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Proposals/Bids */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Propostas Recebidas</h2>
          <div className="space-y-4">
            {proposals.length > 0 ? proposals.map(p => (
              <div key={p.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-700">{p.providerId}</p>
                  <p className="font-bold text-lg text-blue-600">R$ {p.price.toFixed(2)}</p>
                </div>
                <p className="text-sm text-gray-600 mt-2 italic">"{p.message}"</p>
                {isClientView && job.status === 'ativo' && (
                  <button 
                    onClick={() => onAcceptProposal(p.id)}
                    className="mt-3 w-full text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md py-2"
                  >
                    Aceitar Proposta
                  </button>
                )}
                 {p.status === 'aceita' && (
                    <div className="mt-3 text-center text-sm font-bold text-green-700 bg-green-100 p-2 rounded-md">
                        Proposta Aceita
                    </div>
                )}
              </div>
            )) : (
              <p className="text-center text-gray-500 py-4">Nenhuma proposta recebida ainda.</p>
            )}
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 h-[70vh]">
          <Chat messages={messages} currentUser={currentUser} authToken={authToken} onSendMessage={onSendMessage} aiSuggestion={aiSuggestion} onConfirmSchedule={onConfirmSchedule} />
        </div>
      </div>

      {/* Job Info Footer */}
      <footer className="mt-8 text-xs text-gray-400 text-center">
        <p>Job ID: {job.id} | Criado em: {new Date(job.createdAt).toLocaleDateString()}</p>
        {job.status === 'em_progresso' && (
          <button onClick={() => onOpenDispute(job.id)} className="mt-2 text-red-500 hover:text-red-700 hover:underline">
            Relatar um Problema / Abrir Disputa
          </button>
        )}
        {job.providerId && <p>Prestador: {job.providerId}</p>}
      </footer>
    </div>
  );
};

export default JobDetails;