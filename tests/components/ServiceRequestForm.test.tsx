import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import ServiceRequestForm from '../../components/ServiceRequestForm';

// Wrapper to provide state so we exercise interaction realistically
const StatefulWrapper: React.FC<{ onSubmit: (e: React.FormEvent) => void; isLoading?: boolean; submitText?: string; }> = ({ onSubmit, isLoading = false, submitText = 'Publicar Pedido' }) => {
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  return (
    <ServiceRequestForm
      description={description}
      setDescription={setDescription}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      onSubmit={onSubmit}
      isLoading={isLoading}
      submitButtonText={submitText}
    />
  );
};

describe('ServiceRequestForm', () => {
  it('starts with disabled submit', () => {
    const submit = vi.fn();
    render(<StatefulWrapper onSubmit={submit} />);
    const submitBtn = screen.getByRole('button', { name: /Publicar Pedido/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit after description and category selected then calls onSubmit', () => {
    const submit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<StatefulWrapper onSubmit={submit} />);
    const textarea = screen.getByLabelText(/Descreva o serviço/i);
    fireEvent.change(textarea, { target: { value: 'Preciso de um pintor experiente.' } });
    // pick a category button by its text
    const categoryBtn = screen.getByRole('button', { name: /Limpeza/i });
    fireEvent.click(categoryBtn);
    const submitBtn = screen.getByRole('button', { name: /Publicar Pedido/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('shows loading state and disables submit when isLoading true', () => {
    const submit = vi.fn((e: React.FormEvent) => e.preventDefault());
    // Pre-fill state before setting loading: simulate user fill then loading
    const WrapperWithPreFill: React.FC = () => {
      const [description, setDescription] = useState('Algo já preenchido');
      const [selectedCategory, setSelectedCategory] = useState('limpeza');
      return (
        <ServiceRequestForm
          description={description}
          setDescription={setDescription}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onSubmit={submit}
          isLoading={true}
          submitButtonText={'Publicar Pedido'}
        />
      );
    };
    render(<WrapperWithPreFill />);
    const loadingBtn = screen.getByRole('button', { name: /Publicando/i });
    expect(loadingBtn).toBeDisabled();
    // Ensure spinner svg is present
    expect(loadingBtn.querySelector('svg')).toBeTruthy();
    fireEvent.click(loadingBtn);
    expect(submit).not.toHaveBeenCalled();
  });
});
