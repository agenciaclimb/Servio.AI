import { test, expect } from '@playwright/test';

/**
 * QA 360 - SEO & ACCESSIBILITY
 *
 * Cobertura:
 * 1. Sitemap.xml acessível e válido
 * 2. Robots.txt acessível
 * 3. Estrutura de headings (h1 único por página)
 * 4. Imagens têm alt text
 * 5. Links têm labels descritivos
 * 6. Formulários têm labels associados
 * 7. Navegação por teclado funciona (Tab, Enter)
 * 8. Meta tags OG presentes
 * 9. JSON-LD structured data válido
 * 10. Contraste de cores acessível (WCAG AA)
 *
 * Critérios de aceite:
 * - Sitemap lista todas as páginas principais
 * - Todas as imagens têm alt
 * - Navegação 100% acessível por teclado
 * - Lighthouse accessibility score >90
 */

test.describe('QA 360 - SEO & Accessibility', () => {
  test('1. Sitemap.xml acessível e válido', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');

    expect(response?.status()).toBe(200);

    const content = await page.content();
    expect(content).toContain('<urlset');
    expect(content).toContain('<url>');
    expect(content).toContain('<loc>');

    console.log('✅ Sitemap.xml válido');
  });

  test('2. Robots.txt acessível', async ({ page }) => {
    const response = await page.goto('/robots.txt');

    expect(response?.status()).toBe(200);

    const content = await page.content();
    expect(content).toContain('User-agent');
    expect(content).toContain('Sitemap');

    console.log('✅ Robots.txt acessível');
  });

  test('3. Estrutura de headings - h1 único por página', async ({ page }) => {
    await page.goto('/');

    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    const h1Text = await page.locator('h1').textContent();
    expect(h1Text).toBeTruthy();

    console.log(`✅ H1 único: "${h1Text}"`);
  });

  test('4. Imagens têm alt text', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    console.log(`✅ ${images.length} imagens com alt text`);
  });

  test('5. Links têm labels descritivos', async ({ page }) => {
    await page.goto('/');

    const links = await page.locator('a[href]').all();

    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      // Link deve ter texto visível OU aria-label
      expect(text || ariaLabel).toBeTruthy();

      // Evitar textos genéricos
      if (text) {
        expect(text.toLowerCase()).not.toBe('clique aqui');
        expect(text.toLowerCase()).not.toBe('saiba mais');
      }
    }

    console.log(`✅ ${links.length} links com labels descritivos`);
  });

  test('6. Formulários têm labels associados', async ({ page }) => {
    await page.goto('/');

    const inputs = await page.locator('input[type="text"], input[type="email"], textarea').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');

      if (id) {
        // Verificar se existe label com for=id
        const label = page.locator(`label[for="${id}"]`);
        const labelExists = (await label.count()) > 0;

        expect(labelExists || ariaLabel || ariaLabelledby).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledby).toBeTruthy();
      }
    }

    console.log(`✅ ${inputs.length} inputs com labels`);
  });

  test('7. Navegação por teclado funciona', async ({ page }) => {
    await page.goto('/');

    // Pressionar Tab múltiplas vezes
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Verificar se algum elemento está focado
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);

    console.log(`✅ Navegação por teclado funcional (focado: ${focusedElement})`);
  });

  test('8. Meta tags OG presentes', async ({ page }) => {
    await page.goto('/');

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page
      .locator('meta[property="og:description"]')
      .getAttribute('content');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

    expect(ogTitle).toBeTruthy();
    expect(ogDescription).toBeTruthy();
    expect(ogImage).toBeTruthy();

    console.log('✅ Meta tags OG completas');
  });

  test('9. JSON-LD structured data válido', async ({ page }) => {
    await page.goto('/');

    const structuredData = await page.locator('script[type="application/ld+json"]').textContent();

    expect(structuredData).toBeTruthy();

    const json = JSON.parse(structuredData || '{}');
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@type']).toBeTruthy();

    console.log(`✅ JSON-LD válido (type: ${json['@type']})`);
  });

  test('10. Contraste de cores - Botões principais', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button').first();
    await button.waitFor({ state: 'visible' });

    const contrast = await button.evaluate(el => {
      const style = window.getComputedStyle(el);
      const bgColor = style.backgroundColor;
      const color = style.color;

      // Função simplificada de cálculo de contraste
      const getLuminance = (rgb: string) => {
        const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      };

      const bgLuminance = getLuminance(bgColor);
      const fgLuminance = getLuminance(color);

      const ratio =
        (Math.max(bgLuminance, fgLuminance) + 0.05) / (Math.min(bgLuminance, fgLuminance) + 0.05);

      return ratio;
    });

    // WCAG AA requer contraste mínimo de 4.5:1 para texto normal
    expect(contrast).toBeGreaterThan(4.5);

    console.log(`✅ Contraste de botão: ${contrast.toFixed(2)}:1`);
  });
});
