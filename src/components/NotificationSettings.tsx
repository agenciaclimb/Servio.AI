/**
 * Notification Settings Component
 * 
 * Allows prospectors to:
 * - Enable/disable push notifications
 * - Configure which notification types to receive
 * - View recent notifications
 * - Test notification delivery
 */

import React, { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  getNotificationPreferences,
  updateNotificationPreferences,
  getUnreadNotifications,
  markNotificationAsRead,
  setupForegroundMessageListener,
  type NotificationPreferences,
  type PushNotification,
} from '../services/notificationService';

interface NotificationSettingsProps {
  prospectorId: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ prospectorId }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadData();
    checkPermissionStatus();

    // Setup foreground message listener
    const unsubscribe = setupForegroundMessageListener((_payload) => {
      // Refresh notifications when new one arrives
      loadNotifications();
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectorId]);

  async function loadData() {
    setLoading(true);
    try {
      const [prefs, notifs] = await Promise.all([
        getNotificationPreferences(prospectorId),
        getUnreadNotifications(prospectorId),
      ]);

      setPreferences(
        prefs || {
          prospectorId,
          enabled: false,
          clickNotifications: true,
          conversionNotifications: true,
          commissionNotifications: true,
          followUpReminders: true,
          email: '',
          lastUpdated: new Date(),
        }
      );

      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      const notifs = await getUnreadNotifications(prospectorId);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  function checkPermissionStatus() {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }

  async function handleEnableNotifications() {
    try {
      const token = await requestNotificationPermission(prospectorId);
      if (token) {
        await updateNotificationPreferences(prospectorId, {
          enabled: true,
          fcmToken: token,
        });
        await loadData();
        checkPermissionStatus();
        alert('Notificações ativadas com sucesso! ✅');
      } else {
        alert('Não foi possível ativar notificações. Verifique as permissões do navegador.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Erro ao ativar notificações.');
    }
  }

  async function handleUpdatePreferences(updates: Partial<NotificationPreferences>) {
    if (!preferences) return;

    setSaving(true);
    try {
      await updateNotificationPreferences(prospectorId, updates);
      setPreferences({ ...preferences, ...updates });
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Erro ao salvar preferências.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const browserSupportsNotifications = 'Notification' in window;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔔 Configurações de Notificações</h2>
        <p className="text-gray-600">Gerencie como você recebe alertas sobre suas indicações</p>
      </div>

      {/* Browser Support Check */}
      {!browserSupportsNotifications && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Seu navegador não suporta notificações push. Use Chrome, Firefox, Edge ou Safari para receber notificações.
          </p>
        </div>
      )}

      {/* Permission Status */}
      {browserSupportsNotifications && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Status das Notificações</h3>
              <p className="text-sm text-gray-600 mt-1">
                {permissionStatus === 'granted'
                  ? '✅ Notificações ativadas'
                  : permissionStatus === 'denied'
                  ? '❌ Notificações bloqueadas pelo navegador'
                  : '⏸️ Notificações não configuradas'}
              </p>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                onClick={handleEnableNotifications}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Ativar Notificações
              </button>
            )}
          </div>

          {permissionStatus === 'denied' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <p className="font-medium">Como desbloquear notificações:</p>
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Clique no ícone de cadeado/informações ao lado da URL</li>
                <li>Encontre "Notificações" nas permissões</li>
                <li>Altere para "Permitir"</li>
                <li>Recarregue a página</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Notification Preferences */}
      {preferences && permissionStatus === 'granted' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Notificação</h3>
          
          <div className="space-y-4">
            {/* Master Toggle */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <p className="font-medium text-gray-900">Notificações Push</p>
                <p className="text-sm text-gray-600">Ativar/desativar todas as notificações</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enabled}
                  onChange={(e) => handleUpdatePreferences({ enabled: e.target.checked })}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Individual Toggles */}
            <NotificationToggle
              label="Cliques no Link"
              description="Quando alguém clica no seu link de indicação"
              icon="🎯"
              checked={preferences.clickNotifications}
              disabled={!preferences.enabled || saving}
              onChange={(checked) => handleUpdatePreferences({ clickNotifications: checked })}
            />

            <NotificationToggle
              label="Conversões"
              description="Quando um prospect se cadastra através do seu link"
              icon="🎉"
              checked={preferences.conversionNotifications}
              disabled={!preferences.enabled || saving}
              onChange={(checked) => handleUpdatePreferences({ conversionNotifications: checked })}
            />

            <NotificationToggle
              label="Comissões"
              description="Quando você ganha uma comissão"
              icon="💰"
              checked={preferences.commissionNotifications}
              disabled={!preferences.enabled || saving}
              onChange={(checked) => handleUpdatePreferences({ commissionNotifications: checked })}
            />

            <NotificationToggle
              label="Lembretes de Follow-up"
              description="Quando você precisa fazer follow-up com prospects"
              icon="📞"
              checked={preferences.followUpReminders}
              disabled={!preferences.enabled || saving}
              onChange={(checked) => handleUpdatePreferences({ followUpReminders: checked })}
            />
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notificações Recentes ({notifications.length})
          </h3>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {notification.sentAt.toLocaleString('pt-BR')}
                  </p>
                </div>

                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="ml-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Marcar como lida
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Dicas sobre Notificações</h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Notificações funcionam mesmo quando a aba está fechada</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Você será notificado em tempo real sobre cliques e conversões</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Desative tipos específicos se receber muitas notificações</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Clique na notificação para abrir o dashboard automaticamente</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Helper component for notification toggles
const NotificationToggle: React.FC<{
  label: string;
  description: string;
  icon: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, icon, checked, disabled, onChange }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
    </label>
  </div>
);

export default NotificationSettings;
