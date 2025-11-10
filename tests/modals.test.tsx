import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DisputeModal from '../components/DisputeModal';
import ReviewModal from '../components/ReviewModal';
import ServiceCatalogModal from '../ServiceCatalogModal';
import { Job, User, Dispute } from '../types';

// Mocks e utilidades globais dos testes
// JSDOM não implementa scrollIntoView; mockamos para evitar erro nos efeitos passivos
// @ts-expect-error JSDOM não implementa scrollIntoView; mock para evitar warnings em efeitos
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Simplifica a interação com rating: mock do StarRatingInput que seta rating=4 ao clicar
vi.mock('../components/StarRatingInput', () => ({
  __esModule: true,
  default: ({ setRating }: { setRating: (n: number) => void }) => (
    <button onClick={() => setRating(4)}>Set Rating 4</button>
  ),
}));

// Minimal mock data
const mockJob: Job = {
  id: 'job-1',
  clientId: 'client@example.com',
  providerId: 'provider@example.com',
  category: 'Instalação',
  description: 'Instalar chuveiro elétrico',
  status: 'em_andamento',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  urgent: false,
  auction: false,
};

const mockUserClient: User = {
  email: 'client@example.com',
  name: 'Cliente Teste',
  type: 'cliente',
  verificationStatus: 'verificado',
  memberSince: new Date().toISOString()
};

const mockUserProvider: User = {
  email: 'provider@example.com',
  name: 'Provedor Teste',
  type: 'prestador',
  verificationStatus: 'verificado',
  memberSince: new Date().toISOString(),
  serviceCatalog: []
};

const mockDispute: Dispute = {
  id: 'disp-1',
  jobId: mockJob.id,
  status: 'aberta',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    { id: 'm1', senderId: 'client@example.com', text: 'Problema encontrado', createdAt: new Date().toISOString() },
    { id: 'm2', senderId: 'provider@example.com', text: 'Estou verificando', createdAt: new Date().toISOString() }
  ],
  resolution: null
};

describe('Modals Suite', () => {
  describe('DisputeModal', () => {
    it('renderiza mensagens existentes e envia nova mensagem', () => {
      const onClose = vi.fn();
      const onSendMessage = vi.fn();
      render(
        <DisputeModal
          user={mockUserClient}
          job={mockJob}
          dispute={mockDispute}
          otherParty={mockUserProvider}
          onClose={onClose}
          onSendMessage={onSendMessage}
        />
      );

      // Mensagens iniciais
      expect(screen.getByText('Problema encontrado')).toBeInTheDocument();
      expect(screen.getByText('Estou verificando')).toBeInTheDocument();

      // Enviar nova mensagem
      const input = screen.getByPlaceholderText(/Digite sua mensagem/i);
      fireEvent.change(input, { target: { value: 'Nova atualização' } });
      fireEvent.submit(input.closest('form')!);

      expect(onSendMessage).toHaveBeenCalledWith('Nova atualização');
    });

    it('não envia mensagem vazia', () => {
      const onSendMessage = vi.fn();
      render(
        <DisputeModal
          user={mockUserClient}
          job={mockJob}
          dispute={mockDispute}
          otherParty={mockUserProvider}
          onClose={() => {}}
          onSendMessage={onSendMessage}
        />
      );

      const form = screen.getByRole('dialog').querySelector('form')!;
      fireEvent.submit(form);
      expect(onSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('ReviewModal', () => {
    it('bloqueia submit sem rating e exibe erro', () => {
      const onSubmit = vi.fn();
      render(<ReviewModal job={mockJob} onClose={() => {}} onSubmit={onSubmit} />);

      // O botão fica desabilitado com rating=0, então submetemos o formulário diretamente
      const dialog = screen.getByRole('dialog');
      const form = dialog.querySelector('form')!;
      fireEvent.submit(form);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/Por favor, selecione uma avaliação/i)).toBeInTheDocument();
    });

    it('envia avaliação com rating e comentário', () => {
      const onSubmit = vi.fn();
      render(<ReviewModal job={mockJob} onClose={() => {}} onSubmit={onSubmit} />);

      // Seleciona rating=4 via mock do StarRatingInput
      fireEvent.click(screen.getByText('Set Rating 4'));

      const textarea = screen.getByPlaceholderText(/Profissional excelente/i);
      fireEvent.change(textarea, { target: { value: 'Serviço impecável.' } });

      const submitBtn = screen.getByRole('button', { name: /Liberar Pagamento/i });
      fireEvent.click(submitBtn);

      expect(onSubmit).toHaveBeenCalledWith({ rating: 4, comment: 'Serviço impecável.' });
    });
  });

  describe('ServiceCatalogModal', () => {
    it('adiciona e remove serviço do catálogo', () => {
      const onSave = vi.fn();
      render(<ServiceCatalogModal user={mockUserProvider} onClose={() => {}} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText(/Nome do Serviço/i);
      fireEvent.change(nameInput, { target: { value: 'Instalação de Torneira' } });

      const addBtn = screen.getByRole('button', { name: /Adicionar à Lista/i });
      fireEvent.click(addBtn);

      expect(screen.getByText(/Instalação de Torneira/)).toBeInTheDocument();

      const removeBtn = screen.getByText('×');
      fireEvent.click(removeBtn);
      expect(screen.queryByText(/Instalação de Torneira/)).not.toBeInTheDocument();

      // Salvar (catálogo vazio)
      const saveBtn = screen.getByRole('button', { name: /Salvar Catálogo/i });
      fireEvent.click(saveBtn);
      expect(onSave).toHaveBeenCalledWith([]);
    });
  });
});
