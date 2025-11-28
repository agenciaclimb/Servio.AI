import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddItemModal from '../../components/AddItemModal';
import * as geminiService from '../../services/geminiService';

vi.mock('../../services/geminiService', () => ({
  identifyItemFromImage: vi.fn(),
}));

describe('AddItemModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL (não disponível em JSDOM)
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  test('renderiza modal no step upload inicial', () => {
    render(<AddItemModal onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByText(/Adicionar Novo Item/i)).toBeInTheDocument();
    expect(screen.getByText(/Carregue uma foto e deixe a IA fazer o trabalho pesado/i)).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão fechar', () => {
    render(<AddItemModal onClose={mockOnClose} onSave={mockOnSave} />);

    const closeButton = screen.getAllByRole('button')[0]; // Primeiro botão é o X
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('exibe erro quando arquivo é maior que 4MB', async () => {
    render(<AddItemModal onClose={mockOnClose} onSave={mockOnSave} />);

    // Cria arquivo mock > 4MB
    const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/muito grande/i)).toBeInTheDocument();
    });
  });

  it('processa imagem e identifica item via IA', async () => {
    const mockIdentifyResult = {
      itemName: 'Ar Condicionado Split',
      category: 'Eletrônico',
      brand: 'Samsung',
      model: '12000 BTUs',
      serialNumber: 'ABC123',
    };

    vi.mocked(geminiService.identifyItemFromImage).mockResolvedValueOnce(mockIdentifyResult);

    render(<AddItemModal onClose={mockOnClose} onSave={mockOnSave} />);

    const file = new File(['image'], 'ac.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    // Loading state
    await waitFor(() => {
      expect(screen.getByText(/Analisando/i)).toBeInTheDocument();
    });

    // Review step com dados identificados
    await waitFor(() => {
      expect(screen.getByDisplayValue('Ar Condicionado Split')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Eletrônico')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Samsung')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('permite editar campos manualmente no step review', async () => {
    const mockIdentifyResult = {
      itemName: 'Geladeira',
      category: 'Eletrodoméstico',
      brand: '',
      model: '',
      serialNumber: '',
    };

    vi.mocked(geminiService.identifyItemFromImage).mockResolvedValueOnce(mockIdentifyResult);

    render(<AddItemModal onClose={mockOnClose} onSave={mockOnSave} />);

    const file = new File(['image'], 'fridge.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Geladeira')).toBeInTheDocument();
    });

    // Edita marca
    const brandInput = screen.getByLabelText(/Marca/i);
    fireEvent.change(brandInput, { target: { value: 'LG' } });

    expect(brandInput).toHaveValue('LG');
  });

  it('chama onSave com dados corretos ao salvar', async () => {
    const mockIdentifyResult = {
      itemName: 'Máquina de Lavar',
      category: 'Eletrodoméstico',
      brand: 'Brastemp',
      model: '11kg',
      serialNumber: 'XYZ789',
    };

    vi.mocked(geminiService.identifyItemFromImage).mockResolvedValueOnce(mockIdentifyResult);

    render(<AddItemModal onClose={mockOnClose} onSave={mockOnSave} />);

    const file = new File(['image'], 'washer.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Máquina de Lavar')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Salvar Item/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Máquina de Lavar',
          category: 'Eletrodoméstico',
          brand: 'Brastemp',
          model: '11kg',
        })
      );
    });
  });

  it('exibe erro quando identificação IA falha', async () => {
    vi.mocked(geminiService.identifyItemFromImage).mockRejectedValueOnce(
      new Error('API indisponível')
    );

    render(<AddItemModal onClose={mockOnClose} onSave={mockOnSave} />);

    const file = new File(['image'], 'item.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/API indisponível/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
