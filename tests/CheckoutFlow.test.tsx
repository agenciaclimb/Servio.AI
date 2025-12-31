import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CheckoutFlow from '../src/components/CheckoutFlow';

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock do window.location.href
delete (window as any).location;
window.location = { href: '', origin: 'http://localhost:3000' } as any;

// Mock do navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CheckoutFlow', () => {
  const mockUserId = 'user123';
  const mockCartItems = [
    {
      productId: 'prod1',
      name: 'Produto Teste 1',
      price: 100,
      quantity: 2,
      image: 'https://example.com/image1.jpg',
    },
    {
      productId: 'prod2',
      name: 'Produto Teste 2',
      price: 50,
      quantity: 1,
    },
  ];

  const mockAddressData = {
    cep: '01310100',
    logradouro: 'Avenida Paulista',
    bairro: 'Bela Vista',
    localidade: 'São Paulo',
    uf: 'SP',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockCartItems }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderCheckoutFlow = () => {
    return render(
      <BrowserRouter>
        <CheckoutFlow userId={mockUserId} />
      </BrowserRouter>
    );
  };

  describe('Step 1 - Cart Review', () => {
    it('deve renderizar o carrinho com items', async () => {
      renderCheckoutFlow();

      await waitFor(() => {
        expect(screen.getByText('Revise seu Carrinho')).toBeInTheDocument();
      });

      expect(screen.getByText('Produto Teste 1')).toBeInTheDocument();
      expect(screen.getByText('Produto Teste 2')).toBeInTheDocument();
      expect(screen.getByText('Quantidade: 2')).toBeInTheDocument();
      expect(screen.getByText('Quantidade: 1')).toBeInTheDocument();
    });

    it('deve calcular o subtotal corretamente', async () => {
      renderCheckoutFlow();

      await waitFor(() => {
        // Subtotal: (100 * 2) + (50 * 1) = 250
        expect(screen.getByText('R$ 250.00')).toBeInTheDocument();
      });
    });

    it('deve calcular impostos (10%)', async () => {
      renderCheckoutFlow();

      await waitFor(() => {
        // Tax: 250 * 0.1 = 25
        expect(screen.getByText('R$ 25.00')).toBeInTheDocument();
      });
    });

    it('deve mostrar erro se carrinho estiver vazio', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      });

      renderCheckoutFlow();

      await waitFor(() => {
        expect(screen.getByText('Revise seu Carrinho')).toBeInTheDocument();
      });

      const continueBtn = screen.getByText('Continuar →');
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/Seu carrinho está vazio/i)).toBeInTheDocument();
      });
    });

    it('deve avançar para step 2 quando carrinho tem items', async () => {
      renderCheckoutFlow();

      await waitFor(() => {
        expect(screen.getByText('Revise seu Carrinho')).toBeInTheDocument();
      });

      const continueBtn = screen.getByText('Continuar →');
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText('Endereço de Entrega')).toBeInTheDocument();
      });
    });

    it('deve renderizar placeholder de imagem quando item não tem imagem', async () => {
      renderCheckoutFlow();

      await waitFor(() => {
        const placeholders = screen.getAllByText('📦');
        expect(placeholders.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Step 2 - Shipping Address', () => {
    beforeEach(async () => {
      renderCheckoutFlow();
      await waitFor(() => {
        expect(screen.getByText('Revise seu Carrinho')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Continuar →'));
      await waitFor(() => {
        expect(screen.getByText('Endereço de Entrega')).toBeInTheDocument();
      });
    });

    it('deve renderizar formulário de endereço', () => {
      expect(screen.getByPlaceholderText(/João da Silva/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/joao@example.com/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/\(11\) 99999-9999/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/12345-678/i)).toBeInTheDocument();
    });

    it('deve validar campos obrigatórios', async () => {
      const continueBtn = screen.getByText('Continuar →');
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/Campo obrigatório/i)).toBeInTheDocument();
      });
    });

    it('deve validar formato de email', async () => {
      fireEvent.change(screen.getByPlaceholderText(/João da Silva/i), {
        target: { value: 'João Silva' },
      });
      fireEvent.change(screen.getByPlaceholderText(/joao@example.com/i), {
        target: { value: 'email-invalido' },
      });
      fireEvent.change(screen.getByPlaceholderText(/\(11\) 99999-9999/i), {
        target: { value: '11999999999' },
      });
      fireEvent.change(screen.getByPlaceholderText(/12345-678/i), {
        target: { value: '01310100' },
      });

      const continueBtn = screen.getByText('Continuar →');
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText(/Email inválido/i)).toBeInTheDocument();
      });
    });

    it('deve buscar endereço via CEP automaticamente', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddressData,
      });

      const cepInput = screen.getByPlaceholderText(/12345-678/i);
      fireEvent.change(cepInput, { target: { value: '01310100' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://viacep.com.br/ws/01310100/json/'
        );
      });
    });

    it('deve limitar CEP a 8 dígitos', () => {
      const cepInput = screen.getByPlaceholderText(/12345-678/i) as HTMLInputElement;
      fireEvent.change(cepInput, { target: { value: '012345678901234' } });

      expect(cepInput.maxLength).toBe(8);
    });

    it('deve permitir voltar para step 1', async () => {
      const backBtn = screen.getByText('← Voltar');
      fireEvent.click(backBtn);

      await waitFor(() => {
        expect(screen.getByText('Revise seu Carrinho')).toBeInTheDocument();
      });
    });

    it('deve preencher formulário e avançar', async () => {
      fireEvent.change(screen.getByPlaceholderText(/João da Silva/i), {
        target: { value: 'João Silva' },
      });
      fireEvent.change(screen.getByPlaceholderText(/joao@example.com/i), {
        target: { value: 'joao@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/\(11\) 99999-9999/i), {
        target: { value: '11999999999' },
      });
      fireEvent.change(screen.getByPlaceholderText(/12345-678/i), {
        target: { value: '01310100' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Rua das Flores/i), {
        target: { value: 'Av Paulista' },
      });
      fireEvent.change(screen.getByPlaceholderText('123'), {
        target: { value: '1000' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Centro/i), {
        target: { value: 'Bela Vista' },
      });
      fireEvent.change(screen.getByPlaceholderText(/São Paulo/i), {
        target: { value: 'São Paulo' },
      });
      fireEvent.change(screen.getByPlaceholderText('SP'), {
        target: { value: 'SP' },
      });

      const continueBtn = screen.getByText('Continuar →');
      fireEvent.click(continueBtn);

      await waitFor(() => {
        expect(screen.getByText('Método de Entrega')).toBeInTheDocument();
      });
    });
  });

  describe('Step 3 - Shipping Method', () => {
    beforeEach(async () => {
      renderCheckoutFlow();

      // Navigate to step 3
      await waitFor(() => screen.getByText('Revise seu Carrinho'));
      fireEvent.click(screen.getByText('Continuar →'));
      await waitFor(() => screen.getByText('Endereço de Entrega'));

      // Fill address
      fireEvent.change(screen.getByPlaceholderText(/João da Silva/i), {
        target: { value: 'João Silva' },
      });
      fireEvent.change(screen.getByPlaceholderText(/joao@example.com/i), {
        target: { value: 'joao@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/\(11\) 99999-9999/i), {
        target: { value: '11999999999' },
      });
      fireEvent.change(screen.getByPlaceholderText(/12345-678/i), {
        target: { value: '01310100' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Rua das Flores/i), {
        target: { value: 'Av Paulista' },
      });
      fireEvent.change(screen.getByPlaceholderText('123'), {
        target: { value: '1000' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Centro/i), {
        target: { value: 'Bela Vista' },
      });
      fireEvent.change(screen.getByPlaceholderText(/São Paulo/i), {
        target: { value: 'São Paulo' },
      });
      fireEvent.change(screen.getByPlaceholderText('SP'), {
        target: { value: 'SP' },
      });

      fireEvent.click(screen.getByText('Continuar →'));
      await waitFor(() => screen.getByText('Método de Entrega'));
    });

    it('deve renderizar opções de entrega', () => {
      expect(screen.getByText('Entrega Padrão')).toBeInTheDocument();
      expect(screen.getByText('Entrega Expressa')).toBeInTheDocument();
      expect(screen.getByText('Entrega no Mesmo Dia')).toBeInTheDocument();
    });

    it('deve mostrar erro se nenhum método for selecionado', async () => {
      fireEvent.click(screen.getByText('Continuar →'));

      await waitFor(() => {
        expect(screen.getByText(/Selecione um método de entrega/i)).toBeInTheDocument();
      });
    });

    it('deve selecionar método de entrega e avançar', async () => {
      const standardShipping = screen.getByText('Entrega Padrão').closest('label')?.querySelector('input');
      if (standardShipping) {
        fireEvent.click(standardShipping);
      }

      fireEvent.click(screen.getByText('Continuar →'));

      await waitFor(() => {
        expect(screen.getByText('Pagamento')).toBeInTheDocument();
      });
    });
  });

  describe('Step 4 - Payment', () => {
    beforeEach(async () => {
      renderCheckoutFlow();

      // Navigate through all steps to payment
      await waitFor(() => screen.getByText('Revise seu Carrinho'));
      fireEvent.click(screen.getByText('Continuar →'));
      await waitFor(() => screen.getByText('Endereço de Entrega'));

      // Fill address
      fireEvent.change(screen.getByPlaceholderText(/João da Silva/i), { target: { value: 'João Silva' } });
      fireEvent.change(screen.getByPlaceholderText(/joao@example.com/i), { target: { value: 'joao@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/\(11\) 99999-9999/i), { target: { value: '11999999999' } });
      fireEvent.change(screen.getByPlaceholderText(/12345-678/i), { target: { value: '01310100' } });
      fireEvent.change(screen.getByPlaceholderText(/Rua das Flores/i), { target: { value: 'Av Paulista' } });
      fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '1000' } });
      fireEvent.change(screen.getByPlaceholderText(/Centro/i), { target: { value: 'Bela Vista' } });
      fireEvent.change(screen.getByPlaceholderText(/São Paulo/i), { target: { value: 'São Paulo' } });
      fireEvent.change(screen.getByPlaceholderText('SP'), { target: { value: 'SP' } });

      fireEvent.click(screen.getByText('Continuar →'));
      await waitFor(() => screen.getByText('Método de Entrega'));

      const standardShipping = screen.getByText('Entrega Padrão').closest('label')?.querySelector('input');
      if (standardShipping) {
        fireEvent.click(standardShipping);
      }
      fireEvent.click(screen.getByText('Continuar →'));
      await waitFor(() => screen.getByRole('heading', { name: /Pagamento/i, level: 2 }));
    });

    it('deve renderizar informações de pagamento', () => {
      expect(screen.getByText(/Pagamento Seguro/i)).toBeInTheDocument();
      expect(screen.getByText(/Cartão de Crédito/i)).toBeInTheDocument();
      expect(screen.getByText(/PIX/i)).toBeInTheDocument();
    });

    it('deve exibir resumo do pedido', () => {
      expect(screen.getByText('Resumo do Pedido')).toBeInTheDocument();
      expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument();
      expect(screen.getByText(/Impostos:/i)).toBeInTheDocument();
      expect(screen.getByText(/Frete:/i)).toBeInTheDocument();
      expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    });

    it('deve processar pagamento com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });

      fireEvent.click(screen.getByText('Finalizar Pedido'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/ecommerce/checkout',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining(mockUserId),
          })
        );
      });

      await waitFor(() => {
        expect(window.location.href).toBe('https://checkout.stripe.com/test');
      });
    });

    it('deve mostrar erro se pagamento falhar', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      fireEvent.click(screen.getByText('Finalizar Pedido'));

      await waitFor(() => {
        expect(screen.getByText(/Falha ao processar pagamento/i)).toBeInTheDocument();
      });
    });

    it('deve mostrar loading durante processamento', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({ url: 'test' }) }),
              100
            )
          )
      );

      fireEvent.click(screen.getByText('Finalizar Pedido'));

      await waitFor(() => {
        expect(screen.getByText(/Processando/i)).toBeInTheDocument();
      });
    });

    it('deve mostrar erro se URL de pagamento não for retornada', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: null }),
      });

      fireEvent.click(screen.getByText('Finalizar Pedido'));

      await waitFor(() => {
        expect(screen.getByText(/URL de pagamento não encontrada/i)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Bar', () => {
    it('deve renderizar barra de progresso com todos os steps', () => {
      renderCheckoutFlow();

      expect(screen.getByText('Carrinho')).toBeInTheDocument();
      expect(screen.getByText('Endereço')).toBeInTheDocument();
      expect(screen.getByText('Entrega')).toBeInTheDocument();
      expect(screen.getByText('Pagamento')).toBeInTheDocument();
      expect(screen.getByText('Confirmação')).toBeInTheDocument();
    });

    it('deve destacar step atual', () => {
      renderCheckoutFlow();

      const progressSteps = document.querySelectorAll('.progress-step');
      expect(progressSteps[0]).toHaveClass('current');
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erro ao carregar carrinho', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderCheckoutFlow();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching cart:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('deve tratar erro ao buscar endereço por CEP', async () => {
      renderCheckoutFlow();

      await waitFor(() => screen.getByText('Revise seu Carrinho'));
      fireEvent.click(screen.getByText('Continuar →'));
      await waitFor(() => screen.getByText('Endereço de Entrega'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      fireEvent.change(screen.getByPlaceholderText(/12345-678/i), {
        target: { value: '01310100' },
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
