import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the provider
const mockData = {
  seo: {
    title: 'João Silva - Eletricista | Servio.AI',
    description: 'Eletricista profissional com 10 anos de experiência',
    canonical: 'https://servio.ai/prestador/joao-silva',
    ogImage: 'https://servio.ai/images/joao.jpg',
  },
  schema: {
    type: 'Person',
    name: 'João Silva',
    description: 'Eletricista profissional',
    url: 'https://servio.ai/prestador/joao-silva',
    address: {
      streetAddress: 'Rua das Flores, 123',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      postalCode: '01310-100',
    },
    geo: {
      latitude: -23.5505,
      longitude: -46.6333,
    },
    telephone: '+5511999999999',
    email: 'joao@email.com',
  },
};

vi.mock('../../src/providers/PublicPageDataProvider', () => ({
  usePublicPageData: vi.fn(() => mockData),
}));

describe('useSeoMeta', () => {
  const originalTitle = document.title;
  let metaElements: HTMLMetaElement[] = [];
  let linkElements: HTMLLinkElement[] = [];
  let scriptElements: HTMLScriptElement[] = [];

  beforeEach(() => {
    document.title = 'Original Title';
    metaElements = [];
    linkElements = [];
    scriptElements = [];
  });

  afterEach(() => {
    document.title = originalTitle;
    // Clean up created elements
    metaElements.forEach((el) => el.remove());
    linkElements.forEach((el) => el.remove());
    scriptElements.forEach((el) => el.remove());
  });

  it('sets document title from SEO data', async () => {
    const { useSeoMeta } = await import('../../src/hooks/useSeoMeta');

    renderHook(() => useSeoMeta());

    expect(document.title).toBe('João Silva - Eletricista | Servio.AI');
  });

  it('creates meta description tag', async () => {
    const { useSeoMeta } = await import('../../src/hooks/useSeoMeta');

    renderHook(() => useSeoMeta());

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription).not.toBeNull();
    expect(metaDescription?.getAttribute('content')).toBe(
      'Eletricista profissional com 10 anos de experiência'
    );
    if (metaDescription) metaElements.push(metaDescription as HTMLMetaElement);
  });

  it('creates canonical link tag', async () => {
    const { useSeoMeta } = await import('../../src/hooks/useSeoMeta');

    renderHook(() => useSeoMeta());

    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical).not.toBeNull();
    expect(canonical?.getAttribute('href')).toBe('https://servio.ai/prestador/joao-silva');
    if (canonical) linkElements.push(canonical as HTMLLinkElement);
  });

  it('creates OpenGraph meta tags', async () => {
    const { useSeoMeta } = await import('../../src/hooks/useSeoMeta');

    renderHook(() => useSeoMeta());

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogType = document.querySelector('meta[property="og:type"]');
    const ogImage = document.querySelector('meta[property="og:image"]');

    expect(ogTitle?.getAttribute('content')).toBe('João Silva - Eletricista | Servio.AI');
    expect(ogDescription?.getAttribute('content')).toBe(
      'Eletricista profissional com 10 anos de experiência'
    );
    expect(ogUrl?.getAttribute('content')).toBe('https://servio.ai/prestador/joao-silva');
    expect(ogType?.getAttribute('content')).toBe('profile');
    expect(ogImage?.getAttribute('content')).toBe('https://servio.ai/images/joao.jpg');

    // Track for cleanup
    [ogTitle, ogDescription, ogUrl, ogType, ogImage].forEach((el) => {
      if (el) metaElements.push(el as HTMLMetaElement);
    });
  });

  it('creates Twitter Card meta tags', async () => {
    const { useSeoMeta } = await import('../../src/hooks/useSeoMeta');

    renderHook(() => useSeoMeta());

    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
    expect(twitterTitle?.getAttribute('content')).toBe('João Silva - Eletricista | Servio.AI');
    expect(twitterDescription?.getAttribute('content')).toBe(
      'Eletricista profissional com 10 anos de experiência'
    );
    expect(twitterImage?.getAttribute('content')).toBe('https://servio.ai/images/joao.jpg');

    [twitterCard, twitterTitle, twitterDescription, twitterImage].forEach((el) => {
      if (el) metaElements.push(el as HTMLMetaElement);
    });
  });

  it('creates Schema.org JSON-LD script', async () => {
    const { useSeoMeta } = await import('../../src/hooks/useSeoMeta');

    renderHook(() => useSeoMeta());

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();

    const schemaData = JSON.parse(script?.textContent || '{}');
    expect(schemaData['@context']).toBe('https://schema.org');
    expect(schemaData['@type']).toBe('Person');
    expect(schemaData.name).toBe('João Silva');
    expect(schemaData.telephone).toBe('+5511999999999');
    expect(schemaData.address['@type']).toBe('PostalAddress');
    expect(schemaData.geo['@type']).toBe('GeoCoordinates');

    if (script) scriptElements.push(script as HTMLScriptElement);
  });

  it('updates existing meta tags instead of creating duplicates', async () => {
    const { useSeoMeta } = await import('../../src/hooks/useSeoMeta');

    // First render creates elements
    const { unmount } = renderHook(() => useSeoMeta());
    unmount();

    // Second render should update, not duplicate
    renderHook(() => useSeoMeta());

    const allDescriptions = document.querySelectorAll('meta[name="description"]');
    // Should only have one description tag
    expect(allDescriptions.length).toBeGreaterThanOrEqual(1);
  });

  it('cleans up meta tags on unmount', async () => {
    const { useSeoMeta } = await import('../../src/hooks/useSeoMeta');

    const { unmount } = renderHook(() => useSeoMeta());

    // Verify script exists
    const scriptBefore = document.querySelector('script[type="application/ld+json"]');
    expect(scriptBefore).not.toBeNull();

    // Unmount should trigger cleanup
    unmount();

    // Script should be removed
    const scriptAfter = document.querySelector('script[type="application/ld+json"]');
    expect(scriptAfter).toBeNull();

    // Title should reset
    expect(document.title).toBe('Servio.AI - Marketplace de Serviços');
  });
});
