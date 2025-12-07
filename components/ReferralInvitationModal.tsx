import React from 'react';
import { getModalOverlayProps, getModalContentProps } from './utils/a11yHelpers';

interface ReferralInvitationModalProps {
  email: { subject: string; body: string };
  onClose: () => void;
}

const ReferralInvitationModal: React.FC<ReferralInvitationModalProps> = ({ email, onClose }) => {
  return (
    <div
      {...getModalOverlayProps(onClose)}
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
    >
      <div
        {...getModalContentProps()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl m-4 transform transition-all max-h-[90vh] flex flex-col"
      >
        <header className="relative p-6 border-b border-gray-200 bg-slate-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">Convite Enviado!</h2>
          <p className="text-sm text-gray-600 mt-1">
            A IA gerou a seguinte mensagem para seu colega:
          </p>
        </header>

        <main className="flex-grow overflow-y-auto p-6">
          <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm font-mono text-gray-800 space-y-2">
            <p>
              <span className="font-semibold">Assunto:</span> {email.subject}
            </p>
          </div>

          <div className="mt-4 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {email.body}
          </div>
        </main>

        <footer className="p-4 bg-gray-50 border-t border-gray-200 text-right rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ReferralInvitationModal;
