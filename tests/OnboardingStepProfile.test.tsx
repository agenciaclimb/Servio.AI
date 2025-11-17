import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import OnboardingStepProfile from '../doc/OnboardingStepProfile';

describe('OnboardingStepProfile', () => {
  it('deve renderizar o título e o campo de input corretamente', () => {
    render(<OnboardingStepProfile specialties={[]} onUpdate={vi.fn()} />);

    expect(screen.getByText('Especialidades e Portfólio')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Eletricista, Encanador/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Adicionar/i })).toBeInTheDocument();
  });

  it('deve permitir ao usuário adicionar uma nova especialidade', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn();
    render(<OnboardingStepProfile specialties={[]} onUpdate={handleUpdate} />);

    const input = screen.getByPlaceholderText(/Ex: Eletricista, Encanador/i);
    const addButton = screen.getByRole('button', { name: /Adicionar/i });

    await user.type(input, 'Pintor');
    await user.click(addButton);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    expect(handleUpdate).toHaveBeenCalledWith('specialties', ['Pintor']);
  });

  it('deve limpar o input após adicionar uma especialidade', async () => {
    const user = userEvent.setup();
    render(<OnboardingStepProfile specialties={[]} onUpdate={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Ex: Eletricista, Encanador/i) as HTMLInputElement;
    await user.type(input, 'Jardineiro');
    await user.click(screen.getByRole('button', { name: /Adicionar/i }));

    expect(input.value).toBe('');
  });

  it('deve permitir remover uma especialidade existente', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn();
    const initialSpecialties = ['Encanador', 'Eletricista'];
    render(<OnboardingStepProfile specialties={initialSpecialties} onUpdate={handleUpdate} />);

    // Encontra o botão de remover associado a 'Encanador'
    const encanadorTag = screen.getByText('Encanador');
    const removeButton = encanadorTag.querySelector('button');
    expect(removeButton).not.toBeNull();

    await user.click(removeButton!);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    expect(handleUpdate).toHaveBeenCalledWith('specialties', ['Eletricista']);
  });

  it('não deve adicionar uma especialidade duplicada ou vazia', async () => {
    const user = userEvent.setup();
    const handleUpdate = vi.fn();
    render(<OnboardingStepProfile specialties={['Pintor']} onUpdate={handleUpdate} />);

    const input = screen.getByPlaceholderText(/Ex: Eletricista, Encanador/i);
    const addButton = screen.getByRole('button', { name: /Adicionar/i });

    // Tenta adicionar especialidade vazia
    await user.click(addButton);
    expect(handleUpdate).not.toHaveBeenCalled();

    // Tenta adicionar especialidade duplicada
    await user.type(input, 'Pintor');
    await user.click(addButton);
    expect(handleUpdate).not.toHaveBeenCalled();
  });
});