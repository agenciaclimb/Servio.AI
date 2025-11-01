import React from 'react';

interface NotificationPermissionBannerProps {
  onAllow: () => void;
  onDismiss: () => void;
}

const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({ onAllow, onDismiss }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50 flex items-center justify-center space-x-4">
      <p className="text-sm">
        🔔 Ative as notificações para receber atualizações importantes sobre seus serviços em tempo real!
      </p>
      <div className="flex space-x-2">
        <button
          onClick={onDismiss}
          className="px-3 py-1 text-xs font-medium text-gray-300 rounded-md hover:bg-gray-700"
        >
          Agora não
        </button>
        <button
          onClick={onAllow}
          className="px-4 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Ativar
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;