import { useState, useCallback } from 'react';

export interface NotificationSetting {
  id:
    | 'job_updates'
    | 'proposal_updates'
    | 'payment_updates'
    | 'message_updates'
    | 'schedule_updates';
  enabled: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'job_updates',
      enabled: true,
      channels: { email: true, sms: true, push: true },
    },
    {
      id: 'proposal_updates',
      enabled: true,
      channels: { email: true, sms: true, push: false },
    },
    {
      id: 'payment_updates',
      enabled: true,
      channels: { email: true, sms: false, push: true },
    },
    {
      id: 'message_updates',
      enabled: true,
      channels: { email: true, sms: true, push: true },
    },
    {
      id: 'schedule_updates',
      enabled: false,
      channels: { email: true, sms: false, push: false },
    },
  ]);

  const updateSetting = useCallback((id: string, updates: Partial<NotificationSetting>) => {
    setSettings(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const toggleChannel = useCallback(
    (id: string, channel: keyof NotificationSetting['channels']) => {
      setSettings(prev =>
        prev.map(s =>
          s.id === id
            ? {
                ...s,
                channels: { ...s.channels, [channel]: !s.channels[channel] },
              }
            : s
        )
      );
    },
    []
  );

  return { settings, updateSetting, toggleChannel };
}
