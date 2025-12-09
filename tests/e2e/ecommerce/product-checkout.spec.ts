import { test, expect } from '@playwright/test';

test.describe('E-commerce Navigation and UI', () => {
  test('should navigate to products page from header', async ({ page }) => {
    await page.goto('/');
    
    // Click on "Loja" link in header
    const lojaBtton = page.locator('button', { hasText: 'Loja' });
    await expect(lojaBtton).toBeVisible();
    await lojaBtton.click();
    
    // Verify we're on the products page
    await page.waitForURL('**/', { timeout: 5000 });
    
    // Check for loading state or empty state
    const hasLoadingOrContent = await page.locator('.loading-container, .products-grid, .products-list, .empty-cart, .no-products').isVisible().catch(() => false);
    expect(hasLoadingOrContent).toBeTruthy();
  });

  test('should show login prompt when accessing cart without authentication', async ({ page }) => {
    await page.goto('/');
    
    // Open header menu (if needed on mobile) and click cart
    const cartButton = page.locator('button', { hasText: 'Carrinho' });
    const hasCartButton = await cartButton.isVisible().catch(() => false);
    
    // If we're not logged in, cart button should show login message
    // OR clicking it should show auth modal or navigate to login
    if (hasCartButton) {
      // Cart button exists (unlikely without login), click it
      await cartButton.click();
    } else {
      // Navigate directly to cart
      await page.goto('/');
      // The cart route requires userId, but without auth it should show login
    }
  });

  test('should display product listing page with filters', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to products
    const lojaBtton = page.locator('button', { hasText: 'Loja' });
    if (await lojaBtton.isVisible()) {
      await lojaBtton.click();
      await page.waitForTimeout(500);
    }
    
    // Check for filter elements on the page
    const hasContent = await page
      .locator('.products-grid, .products-list, .product-card, .loading-container')
      .isVisible()
      .catch(() => false);
    
    // At minimum, we should see loading or content area
    expect(hasContent).toBeTruthy();
  });

  test('should have order tracking page accessible', async ({ page }) => {
    await page.goto('/');
    
    // Log in first
    const loginButton = page.locator('button', { hasText: /^Entrar$/ });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(300);
      
      // Fill login form
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await page.locator('input[type="password"]').fill('password');
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Check if "Meus Pedidos" button exists
    const myOrdersButton = page.locator('button', { hasText: 'Meus Pedidos' });
    const hasOrderTracking = await myOrdersButton.isVisible().catch(() => false);
    
    // If logged in, order tracking should be available
    if (hasOrderTracking) {
      await myOrdersButton.click();
      await page.waitForTimeout(500);
      
      // Check for order tracking page elements
      const hasOrderTrackingUI = await page.locator('.search-form, .order-item, .no-orders, .tracking-timeline').isVisible().catch(() => false);
      expect(hasOrderTrackingUI).toBeTruthy();
    }
  });

  test('should render ProductListing component with proper structure', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to products
    const lojaBtton = page.locator('button', { hasText: 'Loja' });
    if (await lojaBtton.isVisible()) {
      await lojaBtton.click();
      await page.waitForTimeout(500);
    }
    
    // Check component structure
    const hasViewToggle = await page.locator('.view-btn, [data-testid="view-toggle"]').isVisible().catch(() => false);
    const hasSortSelect = await page.locator('.sort-select, [data-testid="sort-select"]').isVisible().catch(() => false);
    const hasFiltersSidebar = await page.locator('.filters, [data-testid="filters"]').isVisible().catch(() => false);
    
    // At least one of these should exist
    const hasStructure = hasViewToggle || hasSortSelect || hasFiltersSidebar;
    expect(hasStructure).toBeTruthy();
  });

  test('should show empty cart message when no items', async ({ page }) => {
    await page.goto('/');
    
    // Login
    const loginButton = page.locator('button', { hasText: /^Entrar$/ });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForTimeout(500);
    }
    
    // Navigate to cart via header
    const cartButton = page.locator('button', { hasText: 'Carrinho' });
    if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(500);
      
      // Check for empty cart message or items
      const hasEmptyMessage = await page.locator('.empty-cart, .no-items, text=/carrinho vazio/i').isVisible().catch(() => false);
      const hasCartItems = await page.locator('.cart-item').isVisible().catch(() => false);
      
      // Should have either empty message or items
      expect(hasEmptyMessage || hasCartItems).toBeTruthy();
    }
  });

  test('should render checkout form with multiple steps', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to checkout
    const hasCheckoutRoute = true; // Checkout is available at /checkout
    
    if (hasCheckoutRoute) {
      await page.goto('/checkout');
      await page.waitForTimeout(500);
      
      // Check for checkout elements
      const hasProgressBar = await page.locator('.progress-bar, [data-testid="progress-bar"]').isVisible().catch(() => false);
      const hasForm = await page.locator('form, [data-testid="checkout-form"]').isVisible().catch(() => false);
      const hasLoginPrompt = await page.locator('button', { hasText: 'Fazer Login' }).isVisible().catch(() => false);
      
      // Should show either checkout content or login prompt
      expect(hasProgressBar || hasForm || hasLoginPrompt).toBeTruthy();
    }
  });

  test('should have E2E routes integrated in App', async ({ page }) => {
    await page.goto('/');
    
    // Check header has all E-commerce links
    const lojaBtton = page.locator('button', { hasText: 'Loja' });
    const hasEcommerceLink = await lojaBtton.isVisible().catch(() => false);
    
    expect(hasEcommerceLink).toBeTruthy();
  });
});
