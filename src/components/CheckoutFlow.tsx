import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckoutFlow.css';

interface CheckoutFlowProps {
  userId: string;
  cartItems?: CartItem[];
  cartTotal?: number;
}

type Step = 1 | 2 | 3 | 4 | 5;

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
}

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotals, setCartTotals] = useState({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  });

  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  // Shipping method state
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const shippingMethods: ShippingMethod[] = [
    { id: 'standard', name: 'Entrega Padrão', price: 10, deliveryTime: '7-10 dias úteis' },
    { id: 'express', name: 'Entrega Expressa', price: 25, deliveryTime: '3-5 dias úteis' },
    { id: 'same-day', name: 'Entrega no Mesmo Dia', price: 50, deliveryTime: 'Hoje' },
  ];

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/ecommerce/cart/${userId}`);
      if (!response.ok) throw new Error('Falha ao carregar carrinho');
      
      const data = await response.json();
      setCartItems(data.items || []);
      
      const subtotal = (data.items || []).reduce(
        (sum: number, item: CartItem) => sum + item.price * item.quantity,
        0
      );
      const tax = subtotal * 0.10;
      const shipping = selectedShipping
        ? shippingMethods.find((m) => m.id === selectedShipping)?.price || 0
        : 0;
      
      setCartTotals({
        subtotal,
        tax,
        shipping,
        total: subtotal + tax + shipping,
      });
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const fetchAddressByZipCode = async (zipCode: string) => {
    if (zipCode.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setShippingAddress((prev) => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      }
    } catch (err) {
      console.error('Error fetching address:', err);
    }
  };

  const validateStep = (): boolean => {
    setError(null);

    switch (currentStep) {
      case 1:
        if (cartItems.length === 0) {
          setError('Seu carrinho está vazio');
          return false;
        }
        return true;

      case 2: {
        const requiredFields: (keyof ShippingAddress)[] = [
          'fullName',
          'email',
          'phone',
          'zipCode',
          'street',
          'number',
          'neighborhood',
          'city',
          'state',
        ];
        
        for (const field of requiredFields) {
          if (!shippingAddress[field]) {
            setError(`Campo obrigatório: ${getFieldLabel(field)}`);
            return false;
          }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(shippingAddress.email)) {
          setError('Email inválido');
          return false;
        }

        return true;
      }

      case 3:
        if (!selectedShipping) {
          setError('Selecione um método de entrega');
          return false;
        }
        return true;

      case 4:
        return true;

      default:
        return true;
    }
  };

  const getFieldLabel = (field: keyof ShippingAddress): string => {
    const labels: Record<keyof ShippingAddress, string> = {
      fullName: 'Nome completo',
      email: 'Email',
      phone: 'Telefone',
      zipCode: 'CEP',
      street: 'Rua',
      number: 'Número',
      complement: 'Complemento',
      neighborhood: 'Bairro',
      city: 'Cidade',
      state: 'Estado',
    };
    return labels[field];
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === 4) {
        processPayment();
      } else {
        setCurrentStep((prev) => (prev + 1) as Step);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ecommerce/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout/cancel`,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar pagamento');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de pagamento não encontrada');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { number: 1, label: 'Carrinho' },
      { number: 2, label: 'Endereço' },
      { number: 3, label: 'Entrega' },
      { number: 4, label: 'Pagamento' },
      { number: 5, label: 'Confirmação' },
    ];

    return (
      <div className="progress-bar">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div
              className={`progress-step ${
                currentStep >= step.number ? 'active' : ''
              } ${currentStep === step.number ? 'current' : ''}`}
            >
              <div className="step-circle">{step.number}</div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`progress-line ${
                  currentStep > step.number ? 'active' : ''
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Revise seu Carrinho</h2>
      <div className="cart-review">
        {cartItems.map((item) => (
          <div key={item.productId} className="review-item">
            <div className="review-item-image">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="image-placeholder">📦</div>
              )}
            </div>
            <div className="review-item-details">
              <h3>{item.name}</h3>
              <p>Quantidade: {item.quantity}</p>
              <p className="review-item-price">
                R$ {(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary-box">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>R$ {cartTotals.subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Impostos:</span>
          <span>R$ {cartTotals.tax.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>Endereço de Entrega</h2>
      <form className="address-form">
        <div className="form-row">
          <div className="form-group full-width">
            <label>Nome Completo *</label>
            <input
              type="text"
              value={shippingAddress.fullName}
              onChange={(e) => handleAddressChange('fullName', e.target.value)}
              placeholder="João da Silva"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={shippingAddress.email}
              onChange={(e) => handleAddressChange('email', e.target.value)}
              placeholder="joao@example.com"
            />
          </div>
          <div className="form-group">
            <label>Telefone *</label>
            <input
              type="tel"
              value={shippingAddress.phone}
              onChange={(e) => handleAddressChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group small">
            <label>CEP *</label>
            <input
              type="text"
              value={shippingAddress.zipCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                handleAddressChange('zipCode', value);
                if (value.length === 8) {
                  fetchAddressByZipCode(value);
                }
              }}
              placeholder="12345-678"
              maxLength={8}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Rua *</label>
            <input
              type="text"
              value={shippingAddress.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              placeholder="Rua das Flores"
            />
          </div>
          <div className="form-group small">
            <label>Número *</label>
            <input
              type="text"
              value={shippingAddress.number}
              onChange={(e) => handleAddressChange('number', e.target.value)}
              placeholder="123"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Complemento</label>
            <input
              type="text"
              value={shippingAddress.complement}
              onChange={(e) => handleAddressChange('complement', e.target.value)}
              placeholder="Apto 45"
            />
          </div>
          <div className="form-group">
            <label>Bairro *</label>
            <input
              type="text"
              value={shippingAddress.neighborhood}
              onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
              placeholder="Centro"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cidade *</label>
            <input
              type="text"
              value={shippingAddress.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="São Paulo"
            />
          </div>
          <div className="form-group small">
            <label>Estado *</label>
            <input
              type="text"
              value={shippingAddress.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Método de Entrega</h2>
      <div className="shipping-methods">
        {shippingMethods.map((method) => (
          <label key={method.id} className="shipping-method">
            <input
              type="radio"
              name="shipping"
              value={method.id}
              checked={selectedShipping === method.id}
              onChange={(e) => setSelectedShipping(e.target.value)}
            />
            <div className="method-info">
              <h3>{method.name}</h3>
              <p>{method.deliveryTime}</p>
              <p className="method-price">
                {method.price === 0 ? 'GRÁTIS' : `R$ ${method.price.toFixed(2)}`}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h2>Pagamento</h2>
      <div className="payment-info">
        <div className="info-box">
          <h3>🔒 Pagamento Seguro</h3>
          <p>
            Ao clicar em "Finalizar Pedido", você será redirecionado para uma
            página segura do Stripe para completar o pagamento.
          </p>
          <p>Aceitamos:</p>
          <div className="payment-methods">
            <span>💳 Cartão de Crédito</span>
            <span>💳 Cartão de Débito</span>
            <span>🏦 PIX</span>
          </div>
        </div>

        <div className="order-summary">
          <h3>Resumo do Pedido</h3>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>R$ {cartTotals.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Impostos:</span>
            <span>R$ {cartTotals.tax.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Frete:</span>
            <span>R$ {cartTotals.shipping.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>R$ {cartTotals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="step-content success">
      <div className="success-icon">✓</div>
      <h2>Pedido Confirmado!</h2>
      <p>Seu pedido foi realizado com sucesso.</p>
      <div className="success-actions">
        <button onClick={() => navigate('/orders')} className="track-order-btn">
          Ver Meus Pedidos
        </button>
        <button onClick={() => navigate('/products')} className="continue-btn">
          Continuar Comprando
        </button>
      </div>
    </div>
  );

  return (
    <div className="checkout-flow-container">
      {renderProgressBar()}

      <div className="checkout-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {error && <div className="error-message">❌ {error}</div>}

        {currentStep < 5 && (
          <div className="checkout-actions">
            {currentStep > 1 && (
              <button onClick={handleBack} className="back-btn" disabled={loading}>
                ← Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              className="next-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Processando...
                </>
              ) : currentStep === 4 ? (
                'Finalizar Pedido'
              ) : (
                'Continuar →'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutFlow;
