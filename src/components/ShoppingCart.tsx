import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ShoppingCart.css';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stock?: number;
  addedAt: string;
}

interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

interface ShoppingCartProps {
  userId: string;
  onCheckout?: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ userId, onCheckout }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals>({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ecommerce/cart/${userId}`);

      if (!response.ok) {
        // Em staging sem backend, mostrar carrinho vazio
        console.warn('[ShoppingCart] Backend não disponível, usando carrinho vazio');
        setCartItems([]);
        calculateTotals([]);
        return;
      }

      const data = await response.json();
      setCartItems(data.items || []);
      calculateTotals(data.items || []);
    } catch (err) {
      // Fallback: carrinho vazio em vez de erro
      console.warn('[ShoppingCart] Erro ao carregar carrinho, usando vazio:', err);
      setCartItems([]);
      calculateTotals([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal >= 100 ? 0 : 10; // Free shipping over R$100
    const discount = couponApplied ? subtotal * 0.1 : 0; // 10% discount with coupon
    const total = subtotal + tax + shipping - discount;

    setTotals({
      subtotal,
      tax,
      shipping,
      discount,
      total,
    });
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      return removeItem(productId);
    }

    setUpdatingItems(prev => new Set(prev).add(productId));

    try {
      const response = await fetch('/api/ecommerce/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId,
          quantity: newQuantity,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao atualizar quantidade');
      }

      // Update local state
      const updatedItems = cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      calculateTotals(updatedItems);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar quantidade');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const removeItem = async (productId: string) => {
    if (!confirm('Deseja remover este item do carrinho?')) {
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(productId));

    try {
      const response = await fetch(`/api/ecommerce/cart/${userId}/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover item');
      }

      const updatedItems = cartItems.filter(item => item.productId !== productId);
      setCartItems(updatedItems);
      calculateTotals(updatedItems);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover item');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const applyCoupon = () => {
    setCouponError('');

    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    // Simulate coupon validation (in real app, validate with API)
    const validCoupons = ['DESCONTO10', 'PRIMEIRACOMPRA', 'BEMVINDO'];

    if (validCoupons.includes(couponCode.toUpperCase())) {
      setCouponApplied(true);
      calculateTotals(cartItems);
      alert('Cupom aplicado com sucesso! 10% de desconto');
    } else {
      setCouponError('Cupom inválido');
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponCode('');
    calculateTotals(cartItems);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Seu carrinho está vazio');
      return;
    }

    if (onCheckout) {
      onCheckout();
    } else {
      navigate('/checkout');
    }
  };

  const getEstimatedDelivery = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7); // 7 days delivery

    return deliveryDate.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="shopping-cart-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando carrinho...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shopping-cart-container">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchCart} className="retry-btn">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="shopping-cart-container">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Seu carrinho está vazio</h2>
          <p>Adicione produtos ao carrinho para continuar comprando</p>
          <button onClick={() => navigate('/products')} className="continue-shopping-btn">
            Continuar comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-cart-container">
      <div className="cart-header">
        <h1>Carrinho de Compras</h1>
        <p className="cart-items-count">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
        </p>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          <div className="cart-items-header">
            <span className="header-product">Produto</span>
            <span className="header-price">Preço</span>
            <span className="header-quantity">Quantidade</span>
            <span className="header-total">Total</span>
            <span className="header-action"></span>
          </div>

          {cartItems.map(item => {
            const isUpdating = updatingItems.has(item.productId);

            return (
              <div key={item.productId} className={`cart-item ${isUpdating ? 'updating' : ''}`}>
                <div className="item-product">
                  <div className="item-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={e => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.png';
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">📦</div>
                    )}
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    {item.stock !== undefined && item.stock <= 5 && (
                      <p className="stock-warning">⚠️ Apenas {item.stock} em estoque</p>
                    )}
                  </div>
                </div>

                <div className="item-price">R$ {item.price.toFixed(2)}</div>

                <div className="item-quantity">
                  <button
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={isUpdating}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => {
                      const newQty = Number.parseInt(e.target.value, 10) || 1;
                      updateQuantity(item.productId, newQty);
                    }}
                    className="quantity-input"
                    min="1"
                    max={item.stock}
                    disabled={isUpdating}
                    aria-label="Quantidade do produto"
                  />
                  <button
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={
                      isUpdating || (item.stock !== undefined && item.quantity >= item.stock)
                    }
                  >
                    +
                  </button>
                </div>

                <div className="item-total">R$ {(item.price * item.quantity).toFixed(2)}</div>

                <div className="item-action">
                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item.productId)}
                    disabled={isUpdating}
                    title="Remover item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <h2>Resumo do Pedido</h2>

          <div className="summary-section">
            <div className="summary-row">
              <span>
                Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})
              </span>
              <span>R$ {totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Impostos (10%)</span>
              <span>R$ {totals.tax.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Frete</span>
              <span className={totals.shipping === 0 ? 'free-shipping' : ''}>
                {totals.shipping === 0 ? 'GRÁTIS' : `R$ ${totals.shipping.toFixed(2)}`}
              </span>
            </div>
            {totals.discount > 0 && (
              <div className="summary-row discount-row">
                <span>Desconto</span>
                <span>− R$ {totals.discount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {totals.subtotal < 100 && (
            <div className="shipping-notice">
              <p>💡 Frete grátis em compras acima de R$ 100,00</p>
              <p className="remaining-amount">
                Faltam R$ {(100 - totals.subtotal).toFixed(2)} para frete grátis!
              </p>
            </div>
          )}

          <div className="coupon-section">
            <h3>Cupom de Desconto</h3>
            {couponApplied ? (
              <div className="coupon-applied">
                <div className="coupon-info">
                  <span>✓ Cupom "{couponCode}" aplicado</span>
                  <button onClick={removeCoupon} className="remove-coupon-btn">
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div className="coupon-input-group">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Digite o código"
                  className="coupon-input"
                />
                <button onClick={applyCoupon} className="apply-coupon-btn">
                  Aplicar
                </button>
              </div>
            )}
            {couponError && <p className="coupon-error">{couponError}</p>}
          </div>

          <div className="summary-total">
            <span className="total-label">Total</span>
            <span className="total-value">R$ {totals.total.toFixed(2)}</span>
          </div>

          <div className="delivery-estimate">
            <p>📦 Entrega estimada: {getEstimatedDelivery()}</p>
          </div>

          <button onClick={handleCheckout} className="checkout-btn">
            Finalizar Compra
          </button>

          <button onClick={() => navigate('/products')} className="continue-shopping-link">
            ← Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
