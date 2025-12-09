import React, { useState, useEffect } from 'react';
import './OrderTracking.css';

interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface OrderTrackingProps {
  orderId?: string;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId: propOrderId }) => {
  const [orderId, setOrderId] = useState(propOrderId || '');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  useEffect(() => {
    if (propOrderId) {
      fetchOrder(propOrderId);
    }
  }, [propOrderId]);

  const fetchOrder = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ecommerce/orders/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pedido não encontrado');
        }
        throw new Error('Falha ao buscar pedido');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId.trim()) {
      setError('Digite o número do pedido');
      return;
    }

    fetchOrder(orderId);
  };

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'processing':
        return { label: 'Processando', color: '#f59e0b', icon: '⏳' };
      case 'shipped':
        return { label: 'Enviado', color: '#2563eb', icon: '🚚' };
      case 'delivered':
        return { label: 'Entregue', color: '#16a34a', icon: '✓' };
      case 'cancelled':
        return { label: 'Cancelado', color: '#dc2626', icon: '✗' };
      default:
        return { label: 'Desconhecido', color: '#666', icon: '?' };
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { status: 'processing', label: 'Pedido Recebido', date: order?.createdAt },
      { status: 'shipped', label: 'Em Transporte', date: order?.shippedAt },
      { status: 'delivered', label: 'Entregue', date: order?.deliveredAt },
    ];

    return steps;
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;

    switch (order.status) {
      case 'processing':
        return 0;
      case 'shipped':
        return 1;
      case 'delivered':
        return 2;
      default:
        return 0;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleContactSeller = () => {
    setShowContactForm(true);
  };

  const handleRequestReturn = () => {
    setShowReturnForm(true);
  };

  const downloadInvoice = () => {
    // Simulate PDF download
    alert('Download da nota fiscal iniciado...');
    // In real app: window.open(`/api/ecommerce/orders/${order?.id}/invoice.pdf`);
  };

  if (loading) {
    return (
      <div className="order-tracking-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Buscando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order && !error) {
    return (
      <div className="order-tracking-container">
        <div className="search-section">
          <h1>Rastrear Pedido</h1>
          <p>Digite o número do seu pedido ou email para acompanhar o status</p>

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-inputs">
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="Número do pedido (ex: ORD-12345)"
                className="search-input"
              />
              <span className="search-divider">ou</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Seu email"
                className="search-input"
              />
            </div>
            <button type="submit" className="search-btn">
              🔍 Buscar Pedido
            </button>
          </form>

          {error && <div className="error-message">❌ {error}</div>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-tracking-container">
        <div className="error-section">
          <div className="error-icon">❌</div>
          <h2>{error}</h2>
          <p>Verifique o número do pedido e tente novamente</p>
          <button
            onClick={() => {
              setOrder(null);
              setError(null);
            }}
            className="back-btn"
          >
            ← Voltar para busca
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order!.status);
  const currentStep = getCurrentStepIndex();
  const steps = getStatusSteps();

  return (
    <div className="order-tracking-container">
      <div className="tracking-header">
        <button onClick={() => setOrder(null)} className="back-link">
          ← Buscar outro pedido
        </button>
        <h1>Pedido #{order!.id}</h1>
        <div className="order-status-badge" style={{ backgroundColor: statusInfo.color }}>
          {statusInfo.icon} {statusInfo.label}
        </div>
      </div>

      <div className="tracking-content">
        <div className="tracking-main">
          {/* Status Timeline */}
          <div className="status-timeline">
            <h2>Status do Pedido</h2>
            <div className="timeline">
              {steps.map((step, index) => (
                <div
                  key={step.status}
                  className={`timeline-step ${index <= currentStep ? 'completed' : ''} ${
                    index === currentStep ? 'current' : ''
                  }`}
                >
                  <div className="timeline-marker">{index < currentStep ? '✓' : index + 1}</div>
                  <div className="timeline-content">
                    <h3>{step.label}</h3>
                    {step.date && <p className="timeline-date">{formatDate(step.date)}</p>}
                  </div>
                  {index < steps.length - 1 && <div className="timeline-line" />}
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Information */}
          {order!.trackingNumber && (
            <div className="tracking-info-box">
              <h3>Informações de Rastreamento</h3>
              <div className="tracking-details">
                <div className="tracking-detail">
                  <span className="detail-label">Código de rastreamento:</span>
                  <span className="detail-value tracking-code">{order!.trackingNumber}</span>
                </div>
                {order!.trackingUrl && (
                  <a
                    href={order!.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tracking-link"
                  >
                    🔗 Rastrear nos Correios
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="order-items-section">
            <h2>Itens do Pedido</h2>
            <div className="order-items">
              {order!.items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="image-placeholder">📦</div>
                    )}
                  </div>
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p>Quantidade: {item.quantity}</p>
                    <p className="item-price">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact and Return Options */}
          <div className="order-actions">
            <button onClick={handleContactSeller} className="action-btn">
              💬 Contatar Vendedor
            </button>
            {order!.status === 'delivered' && (
              <button onClick={handleRequestReturn} className="action-btn">
                ↩️ Solicitar Devolução
              </button>
            )}
            <button onClick={downloadInvoice} className="action-btn">
              📄 Baixar Nota Fiscal
            </button>
          </div>

          {/* Contact Form */}
          {showContactForm && (
            <div className="form-modal">
              <div className="form-modal-content">
                <h3>Contatar Vendedor</h3>
                <form className="contact-form">
                  <textarea
                    placeholder="Digite sua mensagem..."
                    rows={5}
                    className="form-textarea"
                  />
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="cancel-btn"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="submit-btn">
                      Enviar Mensagem
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Return Form */}
          {showReturnForm && (
            <div className="form-modal">
              <div className="form-modal-content">
                <h3>Solicitar Devolução</h3>
                <form className="return-form">
                  <label>
                    Motivo da devolução:
                    <select className="form-select">
                      <option value="">Selecione...</option>
                      <option value="defect">Produto com defeito</option>
                      <option value="wrong">Produto errado</option>
                      <option value="damaged">Produto danificado</option>
                      <option value="other">Outro motivo</option>
                    </select>
                  </label>
                  <label>
                    Detalhes:
                    <textarea
                      placeholder="Descreva o problema..."
                      rows={4}
                      className="form-textarea"
                    />
                  </label>
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setShowReturnForm(false)}
                      className="cancel-btn"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="submit-btn">
                      Solicitar Devolução
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="tracking-sidebar">
          <div className="summary-box">
            <h3>Resumo do Pedido</h3>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>R$ {order!.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Frete:</span>
              <span>R$ {(order!.total - order!.subtotal).toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>R$ {order!.total.toFixed(2)}</span>
            </div>

            <div className="payment-status">
              <span>Pagamento:</span>
              <span className={`payment-badge ${order!.paymentStatus}`}>
                {order!.paymentStatus === 'paid'
                  ? '✓ Pago'
                  : order!.paymentStatus === 'refunded'
                    ? '↩️ Reembolsado'
                    : '⏳ Pendente'}
              </span>
            </div>

            <div className="order-date">
              <span>Data do pedido:</span>
              <span>{formatDate(order!.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
