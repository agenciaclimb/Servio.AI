/**
 * E-commerce Routes
 * API endpoints for product catalog, cart, checkout, and orders
 */

const express = require('express');
const ecommerceService = require('../services/ecommerceService');

function createEcommerceRoutes(db) {
  const router = express.Router();

  // ============= PRODUCTS =============

  /**
   * GET /api/ecommerce/products
   * List products with filters
   */
  router.get('/products', async (req, res) => {
    try {
      const { category, minPrice, maxPrice, status, limit } = req.query;
      
      const filters = {};
      if (category) filters.category = category;
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit, 10);
      
      const products = await ecommerceService.getProducts(db, filters);
      
      res.json({ success: true, products });
    } catch (error) {
      console.error('Error in GET /products:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/ecommerce/products/:id
   * Get single product
   */
  router.get('/products/:id', async (req, res) => {
    try {
      const product = await ecommerceService.getProductById(db, req.params.id);
      res.json({ success: true, product });
    } catch (error) {
      console.error('Error in GET /products/:id:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/ecommerce/products
   * Create product (admin only)
   */
  router.post('/products', async (req, res) => {
    try {
      // TODO: Add admin authentication middleware
      const product = await ecommerceService.createProduct(db, req.body);
      res.status(201).json({ success: true, product });
    } catch (error) {
      console.error('Error in POST /products:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /api/ecommerce/products/:id
   * Update product (admin only)
   */
  router.put('/products/:id', async (req, res) => {
    try {
      // TODO: Add admin authentication middleware
      const product = await ecommerceService.updateProduct(db, req.params.id, req.body);
      res.json({ success: true, product });
    } catch (error) {
      console.error('Error in PUT /products/:id:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/ecommerce/products/:id
   * Delete product (admin only)
   */
  router.delete('/products/:id', async (req, res) => {
    try {
      // TODO: Add admin authentication middleware
      const result = await ecommerceService.deleteProduct(db, req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Error in DELETE /products/:id:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // ============= CART =============

  /**
   * POST /api/ecommerce/cart/add
   * Add item to cart
   */
  router.post('/cart/add', async (req, res) => {
    try {
      const { userId, productId, quantity } = req.body;
      
      if (!userId || !productId) {
        return res.status(400).json({ success: false, error: 'userId and productId required' });
      }
      
      const cart = await ecommerceService.addToCart(db, userId, { productId, quantity });
      res.json({ success: true, cart });
    } catch (error) {
      console.error('Error in POST /cart/add:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /api/ecommerce/cart/update
   * Update cart item quantity
   */
  router.put('/cart/update', async (req, res) => {
    try {
      const { userId, productId, quantity } = req.body;
      
      if (!userId || !productId || quantity === undefined) {
        return res.status(400).json({ success: false, error: 'userId, productId, and quantity required' });
      }
      
      const cart = await ecommerceService.updateCartItem(db, userId, { productId, quantity });
      res.json({ success: true, cart });
    } catch (error) {
      console.error('Error in PUT /cart/update:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/ecommerce/cart/:userId/:productId
   * Remove item from cart
   */
  router.delete('/cart/:userId/:productId', async (req, res) => {
    try {
      const { userId, productId } = req.params;
      
      const cart = await ecommerceService.removeFromCart(db, userId, productId);
      res.json({ success: true, cart });
    } catch (error) {
      console.error('Error in DELETE /cart:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/ecommerce/cart/:userId
   * Get user's cart
   */
  router.get('/cart/:userId', async (req, res) => {
    try {
      const cart = await ecommerceService.getCart(db, req.params.userId);
      const totals = ecommerceService.calculateTotals(cart);
      
      res.json({ success: true, cart, totals });
    } catch (error) {
      console.error('Error in GET /cart:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============= CHECKOUT =============

  /**
   * POST /api/ecommerce/checkout
   * Create Stripe checkout session
   */
  router.post('/checkout', async (req, res) => {
    try {
      const { userId, successUrl, cancelUrl } = req.body;
      
      if (!userId || !successUrl || !cancelUrl) {
        return res.status(400).json({ success: false, error: 'userId, successUrl, and cancelUrl required' });
      }
      
      const session = await ecommerceService.createCheckoutSession(db, userId, { successUrl, cancelUrl });
      res.json({ success: true, ...session });
    } catch (error) {
      console.error('Error in POST /checkout:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/ecommerce/webhooks/stripe
   * Stripe webhook handler for payment events
   */
  router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const event = req.body;
      
      // Handle checkout.session.completed event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await ecommerceService.handlePaymentSuccess(db, session.id);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Error in Stripe webhook:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // ============= ORDERS =============

  /**
   * GET /api/ecommerce/orders/:id
   * Get order details
   */
  router.get('/orders/:id', async (req, res) => {
    try {
      const order = await ecommerceService.getOrder(db, req.params.id);
      res.json({ success: true, order });
    } catch (error) {
      console.error('Error in GET /orders/:id:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/ecommerce/orders
   * List user's orders
   */
  router.get('/orders', async (req, res) => {
    try {
      const { userId, limit } = req.query;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId required' });
      }
      
      const orders = await ecommerceService.listOrders(db, userId, { limit: limit ? parseInt(limit, 10) : 20 });
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Error in GET /orders:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PUT /api/ecommerce/orders/:id/status
   * Update order status (admin only)
   */
  router.put('/orders/:id/status', async (req, res) => {
    try {
      // TODO: Add admin authentication middleware
      const { status, trackingNumber, trackingUrl } = req.body;
      
      if (!status) {
        return res.status(400).json({ success: false, error: 'status required' });
      }
      
      const order = await ecommerceService.updateOrderStatus(db, req.params.id, status, { trackingNumber, trackingUrl });
      res.json({ success: true, order });
    } catch (error) {
      console.error('Error in PUT /orders/:id/status:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return router;
}

module.exports = createEcommerceRoutes;
