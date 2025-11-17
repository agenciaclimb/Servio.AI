import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileModal from '../components/ProfileModal';
import { User } from '../types';

const baseUser: User = {
  email: 'test@example.com',
  name: 'Teste',
  type: 'prestador',
  bio: '',
  location: '',
  memberSince: new Date().toISOString(),
  status: 'ativo',
};

describe('ProfileModal', () => {
  it('submits parsed specialties and calls onSave', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(
      <ProfileModal user={baseUser} onClose={onClose} onSave={onSave} />
    );

    // fill some fields
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), { target: { value: 'Novo Nome' } });
    fireEvent.change(screen.getByLabelText(/Especialidades/i), { target: { value: 'A, B , C' } });

    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    expect(onSave).toHaveBeenCalled();
    const payload = onSave.mock.calls[0][0] as Partial<User>;
    expect(payload.name).toBe('Novo Nome');
    expect(payload.specialties).toEqual(['A','B','C']);
  });
});
