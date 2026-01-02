import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationSettings } from '../../src/hooks/useNotificationSettings';

describe('useNotificationSettings', () => {
  it('inicializa com 5 configurações padrão', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    expect(result.current.settings).toHaveLength(5);
  });

  it('job_updates está habilitado por padrão', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    const jobUpdates = result.current.settings.find(s => s.id === 'job_updates');
    expect(jobUpdates?.enabled).toBe(true);
  });

  it('schedule_updates está desabilitado por padrão', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    const scheduleUpdates = result.current.settings.find(s => s.id === 'schedule_updates');
    expect(scheduleUpdates?.enabled).toBe(false);
  });

  it('job_updates tem todos os canais habilitados', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    const jobUpdates = result.current.settings.find(s => s.id === 'job_updates');
    expect(jobUpdates?.channels).toEqual({
      email: true,
      sms: true,
      push: true,
    });
  });

  it('proposal_updates tem push desabilitado', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    const proposalUpdates = result.current.settings.find(s => s.id === 'proposal_updates');
    expect(proposalUpdates?.channels.push).toBe(false);
  });

  it('updateSetting atualiza configuração específica', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.updateSetting('job_updates', { enabled: false });
    });
    
    const jobUpdates = result.current.settings.find(s => s.id === 'job_updates');
    expect(jobUpdates?.enabled).toBe(false);
  });

  it('updateSetting não afeta outras configurações', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.updateSetting('job_updates', { enabled: false });
    });
    
    const proposalUpdates = result.current.settings.find(s => s.id === 'proposal_updates');
    expect(proposalUpdates?.enabled).toBe(true);
  });

  it('toggleChannel alterna canal email', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    const initialEmail = result.current.settings.find(s => s.id === 'job_updates')?.channels.email;
    
    act(() => {
      result.current.toggleChannel('job_updates', 'email');
    });
    
    const newEmail = result.current.settings.find(s => s.id === 'job_updates')?.channels.email;
    expect(newEmail).toBe(!initialEmail);
  });

  it('toggleChannel alterna canal sms', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.toggleChannel('payment_updates', 'sms');
    });
    
    const smsChannel = result.current.settings.find(s => s.id === 'payment_updates')?.channels.sms;
    expect(smsChannel).toBe(true); // Era false, agora true
  });

  it('toggleChannel alterna canal push', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.toggleChannel('proposal_updates', 'push');
    });
    
    const pushChannel = result.current.settings.find(s => s.id === 'proposal_updates')?.channels.push;
    expect(pushChannel).toBe(true); // Era false, agora true
  });

  it('toggleChannel não afeta outros canais', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    const initialSms = result.current.settings.find(s => s.id === 'job_updates')?.channels.sms;
    
    act(() => {
      result.current.toggleChannel('job_updates', 'email');
    });
    
    const smsAfter = result.current.settings.find(s => s.id === 'job_updates')?.channels.sms;
    expect(smsAfter).toBe(initialSms);
  });

  it('toggleChannel não afeta outras configurações', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.toggleChannel('job_updates', 'email');
    });
    
    const proposalEmail = result.current.settings.find(s => s.id === 'proposal_updates')?.channels.email;
    expect(proposalEmail).toBe(true);
  });

  it('updateSetting pode atualizar múltiplos campos', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.updateSetting('message_updates', {
        enabled: false,
        channels: { email: false, sms: false, push: false },
      });
    });
    
    const messageUpdates = result.current.settings.find(s => s.id === 'message_updates');
    expect(messageUpdates?.enabled).toBe(false);
    expect(messageUpdates?.channels).toEqual({
      email: false,
      sms: false,
      push: false,
    });
  });

  it('permite múltiplas alternâncias consecutivas', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.toggleChannel('job_updates', 'email');
      result.current.toggleChannel('job_updates', 'email');
    });
    
    const emailChannel = result.current.settings.find(s => s.id === 'job_updates')?.channels.email;
    expect(emailChannel).toBe(true); // Volta ao estado original
  });

  it('updateSetting com id inexistente não quebra', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.updateSetting('invalid_id', { enabled: false });
    });
    
    expect(result.current.settings).toHaveLength(5);
  });

  it('toggleChannel com id inexistente não quebra', () => {
    const { result } = renderHook(() => useNotificationSettings());
    
    act(() => {
      result.current.toggleChannel('invalid_id', 'email');
    });
    
    expect(result.current.settings).toHaveLength(5);
  });
});
