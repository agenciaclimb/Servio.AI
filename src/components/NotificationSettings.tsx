import React from 'react';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

// Definição de tipos para as configurações de notificação
type NotificationSetting = {
  id:
    | 'job_updates'
    | 'proposal_updates'
    | 'payment_updates'
    | 'message_updates'
    | 'follow_up_reminders';
  label: string;
  description: string;
  icon: string;
};

// Configurações de notificação disponíveis
const NOTIFICATION_SETTINGS_CONFIG: NotificationSetting[] = [
  {
    id: 'job_updates',
    label: 'Atualizações de Trabalhos',
    description: 'Notificações sobre status de trabalhos',
    icon: '🛠️',
  },
  {
    id: 'proposal_updates',
    label: 'Atualizações de Propostas',
    description: 'Quando você recebe ou tem uma proposta atualizada',
    icon: '💼',
  },
  {
    id: 'payment_updates',
    label: 'Atualizações de Pagamentos',
    description: 'Confirmações de pagamento, estornos e lembretes',
    icon: '💳',
  },
  {
    id: 'message_updates',
    label: 'Novas Mensagens',
    description: 'Notificações para novas mensagens no chat',
    icon: '💬',
  },
  {
    id: 'follow_up_reminders',
    label: 'Lembretes de Follow-up',
    description: 'Quando você precisa fazer follow-up com prospects',
    icon: '⏰',
  },
];

const NotificationSettings: React.FC<{ prospectorId?: string }> = () => {
  const { settings, updateSetting } = useNotificationSettings();


  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Configurações de Notificação
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Gerencie como você recebe notificações da plataforma.</p>
        </div>
        <div className="mt-5 space-y-6">
          {NOTIFICATION_SETTINGS_CONFIG.map(setting => (
            <div key={setting.id} className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-500 text-white sm:h-10 sm:w-10">
                <span className="text-2xl">{setting.icon}</span>
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-600">{setting.description}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.find(s => s.id === setting.id)?.enabled ?? true}
                    onChange={e => updateSetting(setting.id, { enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
