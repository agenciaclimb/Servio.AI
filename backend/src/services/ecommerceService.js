/**
 * E-commerce Service
 * Handles product catalog, shopping cart, checkout, and order management
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Mock products fallback data
 */
const MOCK_PRODUCTS = [
  {
    id: 'prod_001',
    name: 'Consultoria de SEO',
    description: 'Serviço completo de otimização para mecanismos de busca',
    price: 1500,
    category: 'consultoria',
    rating: 4.8,
    stock: 20,
    status: 'active',
    images: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_002',
    name: 'Design de Website',
    description: 'Criação e design responsivo de website profissional',
    price: 2500,
    category: 'design',
    rating: 4.6,
    stock: 15,
    status: 'active',
    images: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_003',
    name: 'Gestão de Redes Sociais',
    description: 'Gerenciamento profissional de redes sociais da sua empresa',
    price: 1200,
    category: 'marketing',
    rating: 4.7,
    stock: 25,
    status: 'active',
    images: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_004',
    name: 'Desenvolvimento em React',
    description: 'Desenvolvimento de aplicação React moderna e escalável',
    price: 3500,
    category: 'desenvolvimento',
    rating: 4.9,
    stock: 10,
    status: 'active',
    images: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_005',
    name: 'Análise de Concorrentes',
    description: 'Análise estratégica completa dos seus concorrentes',
    price: 800,
    category: 'consultoria',
    rating: 4.5,
    stock: 30,
    status: 'active',
    images: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_006',
    name: 'Treinamento de Equipe',
    description: 'Treinamento técnico e comportamental para sua equipe',
    price: 2000,
    category: 'treinamento',
    rating: 4.7,
    stock: 12,
    status: 'active',
    images: [],
    createdAt: new Date().toISOString(),
  },
];

/**
 * Get products with filters
 */
async function getProducts(db, filters = {}) {
  try {
    const { category, minPrice, maxPrice, status = 'active', limit = 50 } = filters;

    let query = db.collection('products').where('status', '==', status);

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.limit(limit).get();
    const products = [];

    snapshot.forEach(doc => {
      const product = { id: doc.id, ...doc.data() };

      // Filter by price range in memory (Firestore doesn't support range on non-indexed fields)
      if (minPrice && product.price < minPrice) return;
      if (maxPrice && product.price > maxPrice) return;

      products.push(product);
    });

    // If no products found in Firestore, return mock products as fallback
    if (products.length === 0) {
      console.warn('[E-commerce] No products found in Firestore, using mock data fallback');
      let mockProducts = MOCK_PRODUCTS.filter(p => p.status === status);
      
      if (category) {
        mockProducts = mockProducts.filter(p => p.category === category);
      }
      
      if (minPrice || maxPrice) {
        mockProducts = mockProducts.filter(p => {
          if (minPrice && p.price < minPrice) return false;
          if (maxPrice && p.price > maxPrice) return false;
          return true;
        });
      }

      return mockProducts.slice(0, limit);
    }

    return products;
  } catch (error) {
    console.error('[E-commerce] Error getting products from Firestore:', error.message);
    console.warn('[E-commerce] Falling back to mock products');
    // Return mock products on error
    let mockProducts = MOCK_PRODUCTS.filter(p => p.status === (filters.status || 'active'));
    
    if (filters.category) {
      mockProducts = mockProducts.filter(p => p.category === filters.category);
    }
    
    if (filters.minPrice || filters.maxPrice) {
      mockProducts = mockProducts.filter(p => {
        if (filters.minPrice && p.price < filters.minPrice) return false;
        if (filters.maxPrice && p.price > filters.maxPrice) return false;
        return true;
      });
    }

    return mockProducts.slice(0, filters.limit || 50);
  }
}

/**
 * Get product by ID
 */
async function getProductById(db, productId) {
  try {
    const doc = await db.collection('products').doc(productId).get();

    if (!doc.exists) {
      // Try to find in mock products
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
      if (mockProduct) {
        return mockProduct;
      }
      throw new Error('Product not found');
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('[E-commerce] Error getting product:', error.message);
    // Try to find in mock products as fallback
    const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
    if (mockProduct) {
      console.warn('[E-commerce] Found product in mock data');
      return mockProduct;
    }
    throw error;
  }
}

/**
 * Create new product (admin only)
 */
async function createProduct(db, productData) {
  try {
    const { name, sku, price, description, category, images = [], stock = 0 } = productData;

    // Validation
    if (!name || !sku || !price || price <= 0) {
      throw new Error('Invalid product data: name, sku, and valid price required');
    }

    const product = {
      name,
      sku,
      price,
      description: description || '',
      category: category || 'general',
      images,
      stock,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('products').add(product);

    return { id: docRef.id, ...product };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update product (admin only)
 */
async function updateProduct(db, productId, updates) {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('products').doc(productId).update(updateData);

    return await getProductById(db, productId);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

/**
 * Delete product (soft delete - sets status to 'archived')
 */
async function deleteProduct(db, productId) {
  try {
    await db.collection('products').doc(productId).update({
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: 'Product archived' };
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

/**
 * Add item to cart
 */
async function addToCart(db, userId, { productId, quantity = 1 }) {
  try {
    // Validate product exists and has stock
    const product = await getProductById(db, productId);

    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}`);
    }

    const cartRef = db.collection('carts').doc(userId);
    const cartDoc = await cartRef.get();

    let cart = cartDoc.exists ? cartDoc.data() : { items: [], lastUpdated: null };

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
        addedAt: new Date().toISOString(),
      });
    }

    cart.lastUpdated = new Date().toISOString();

    await cartRef.set(cart);

    return cart;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Update cart item quantity
 */
async function updateCartItem(db, userId, { productId, quantity }) {
  try {
    if (quantity <= 0) {
      return removeFromCart(db, userId, productId);
    }

    const cartRef = db.collection('carts').doc(userId);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      throw new Error('Cart not found');
    }

    const cart = cartDoc.data();
    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex < 0) {
      throw new Error('Item not found in cart');
    }

    // Validate stock
    const product = await getProductById(db, productId);
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}`);
    }

    cart.items[itemIndex].quantity = quantity;
    cart.lastUpdated = new Date().toISOString();

    await cartRef.set(cart);

    return cart;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
async function removeFromCart(db, userId, productId) {
  try {
    const cartRef = db.collection('carts').doc(userId);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      throw new Error('Cart not found');
    }

    const cart = cartDoc.data();
    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.lastUpdated = new Date().toISOString();

    await cartRef.set(cart);

    return cart;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

/**
 * Get user's cart
 */
async function getCart(db, userId) {
  try {
    const cartDoc = await db.collection('carts').doc(userId).get();

    if (!cartDoc.exists) {
      return { items: [], lastUpdated: null };
    }

    return cartDoc.data();
  } catch (error) {
    console.error('Error getting cart:', error);
    throw error;
  }
}

/**
 * Calculate cart totals
 */
function calculateTotals(cart, taxRate = 0.1) {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * taxRate;
  const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal + tax + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Create Stripe checkout session
 */
async function createCheckoutSession(db, userId, { successUrl, cancelUrl }) {
  try {
    const cart = await getCart(db, userId);

    if (!cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const totals = calculateTotals(cart);

    // Create Stripe line items
    const lineItems = cart.items.map(item => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as line item if applicable
    if (totals.shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Frete',
          },
          unit_amount: Math.round(totals.shipping * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        cartSnapshot: JSON.stringify(cart.items),
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Handle successful payment (called by Stripe webhook)
 */
async function handlePaymentSuccess(db, sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const userId = session.metadata.userId;
    const cartItems = JSON.parse(session.metadata.cartSnapshot);

    // Create order
    const order = {
      userId,
      items: cartItems,
      subtotal: session.amount_subtotal / 100,
      total: session.amount_total / 100,
      status: 'processing',
      paymentStatus: 'paid',
      stripeSessionId: sessionId,
      createdAt: new Date().toISOString(),
    };

    const orderRef = await db.collection('orders').add(order);

    // Clear cart
    await db.collection('carts').doc(userId).delete();

    // Update inventory (reduce stock)
    for (const item of cartItems) {
      const productRef = db.collection('products').doc(item.productId);
      const product = await productRef.get();

      if (product.exists) {
        const newStock = product.data().stock - item.quantity;
        await productRef.update({ stock: Math.max(0, newStock) });
      }
    }

    return { orderId: orderRef.id, ...order };
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
async function getOrder(db, orderId) {
  try {
    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
      throw new Error('Order not found');
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
}

/**
 * List user's orders
 */
async function listOrders(db, userId, { limit = 20 } = {}) {
  try {
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    return orders;
  } catch (error) {
    console.error('Error listing orders:', error);
    throw error;
  }
}

/**
 * Update order status (admin only)
 */
async function updateOrderStatus(db, orderId, status, trackingInfo = {}) {
  try {
    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (trackingInfo.trackingNumber) {
      updateData.trackingNumber = trackingInfo.trackingNumber;
      updateData.trackingUrl = trackingInfo.trackingUrl || '';
    }

    if (status === 'shipped') {
      updateData.shippedAt = new Date().toISOString();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date().toISOString();
    }

    await db.collection('orders').doc(orderId).update(updateData);

    return await getOrder(db, orderId);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addToCart,
  updateCartItem,
  removeFromCart,
  getCart,
  calculateTotals,
  createCheckoutSession,
  handlePaymentSuccess,
  getOrder,
  listOrders,
  updateOrderStatus,
};
