import React from 'react';
import { Job, JobStatus } from '../../types';

interface JobTimelineProps {
  job: Job;
}

const STEPS: { status: JobStatus; label: string; icon: string }[] = [
  { status: 'agendado', label: 'Agendado', icon: '📅' },
  { status: 'a_caminho', label: 'A Caminho', icon: '🚚' },
  { status: 'em_progresso', label: 'Em Progresso', icon: '🛠️' },
  { status: 'pagamento_pendente', label: 'Pagamento', icon: '💳' },
  { status: 'concluido', label: 'Finalizado', icon: '✅' },
];

const JobTimeline: React.FC<JobTimelineProps> = ({ job }) => {
  // Find the index of the current status in our defined flow
  let currentStepIndex = STEPS.findIndex(step => step.status === job.status);

  // If the job status is 'proposta_aceita', it's before the timeline starts, so consider it at step -1
  if (job.status === 'proposta_aceita') {
      currentStepIndex = -1;
  }
  
  // If the status isn't in our main flow (e.g., 'ativo', 'cancelado'), don't show the timeline.
  if (currentStepIndex === -1 && job.status !== 'proposta_aceita') {
    return null; 
  }

  // The active step is the one matching the job's status
  const activeIndex = currentStepIndex;

  return (
    <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Linha do Tempo do Serviço</h4>
        <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isActive = index === activeIndex;

            return (
            <React.Fragment key={step.status}>
                {index > 0 && (
                <div
                    className={`flex-1 h-1 transition-colors duration-500 ${
                    isCompleted || isActive ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                ></div>
                )}
                <div className="flex flex-col items-center text-center">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${isActive ? 'bg-blue-500 border-blue-500 text-white shadow-lg' : ''}
                        ${isCompleted ? 'bg-blue-500 border-blue-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-white border-gray-300' : ''}`}
                    >
                        {isCompleted ? (
                             <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        ): (
                            <span className={`${isActive ? 'text-white' : 'text-gray-500'}`}>{step.icon}</span>
                        )}
                       
                    </div>
                    <p className={`mt-2 text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {step.label}
                    </p>
                </div>
            </React.Fragment>
            );
        })}
        </div>
    </div>
  );
};

export default JobTimeline;