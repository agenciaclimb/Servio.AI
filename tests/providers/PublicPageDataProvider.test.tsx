import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import {
  PublicPageDataProvider,
  usePublicPageData,
  PublicPageData,
} from '../../src/providers/PublicPageDataProvider';
import { ReactNode } from 'react';

const mockPageData: PublicPageData = {
  slug: 'joao-silva-eletricista',
  city: 'São Paulo',
  citySlug: 'sao-paulo',
  service: 'Eletricista',
  serviceSlug: 'eletricista',
  name: 'João Silva',
  description: 'Eletricista profissional com 10 anos de experiência',
  bio: 'Especializado em instalações residenciais e comerciais',
  seo: {
    title: 'João Silva - Eletricista em São Paulo | Servio.AI',
    description: 'Eletricista profissional com 10 anos de experiência',
    canonical: 'https://servio.ai/prestador/joao-silva-eletricista',
    ogImage: 'https://servio.ai/images/joao.jpg',
  },
  schema: {
    type: 'LocalBusiness',
    name: 'João Silva - Eletricista',
    description: 'Eletricista profissional',
    address: {
      streetAddress: 'Rua das Flores, 123',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      postalCode: '01310-100',
      addressCountry: 'BR',
    },
    geo: {
      latitude: -23.5505,
      longitude: -46.6333,
    },
    telephone: '+5511999999999',
    email: 'joao@email.com',
    url: 'https://servio.ai/prestador/joao-silva-eletricista',
    aggregateRating: {
      ratingValue: 4.8,
      reviewCount: 127,
    },
  },
  contact: {
    phone: '+5511999999999',
    email: 'joao@email.com',
    whatsapp: '+5511999999999',
  },
  links: {
    website: 'https://joaoeletricista.com.br',
    instagram: '@joaoeletricista',
    facebook: 'joaoeletricista',
  },
  serviceSchema: {
    type: 'Service',
    serviceType: 'Instalações Elétricas',
    areaServed: 'São Paulo, SP',
    provider: {
      '@type': 'LocalBusiness',
      name: 'João Silva - Eletricista',
    },
  },
};

const wrapper =
  (data: PublicPageData = mockPageData) =>
  ({ children }: { children: ReactNode }) => (
    <PublicPageDataProvider data={data}>{children}</PublicPageDataProvider>
  );

describe('PublicPageDataProvider', () => {
  describe('Provider component', () => {
    it('renders children correctly', () => {
      render(
        <PublicPageDataProvider data={mockPageData}>
          <div data-testid="child">Child Content</div>
        </PublicPageDataProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <PublicPageDataProvider data={mockPageData}>
          <div data-testid="child1">First Child</div>
          <div data-testid="child2">Second Child</div>
        </PublicPageDataProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('usePublicPageData hook', () => {
    it('returns page data from context', () => {
      const { result } = renderHook(() => usePublicPageData(), {
        wrapper: wrapper(),
      });

      expect(result.current).toBe(mockPageData);
    });

    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => usePublicPageData());
      }).toThrow('[PublicPageDataProvider] Nenhum provedor de dados registrado');
    });

    it('provides access to slug', () => {
      const { result } = renderHook(() => usePublicPageData(), {
        wrapper: wrapper(),
      });

      expect(result.current.slug).toBe('joao-silva-eletricista');
    });

    it('provides access to SEO data', () => {
      const { result } = renderHook(() => usePublicPageData(), {
        wrapper: wrapper(),
      });

      expect(result.current.seo.title).toBe('João Silva - Eletricista em São Paulo | Servio.AI');
      expect(result.current.seo.canonical).toBe(
        'https://servio.ai/prestador/joao-silva-eletricista'
      );
    });

    it('provides access to schema data', () => {
      const { result } = renderHook(() => usePublicPageData(), {
        wrapper: wrapper(),
      });

      expect(result.current.schema.type).toBe('LocalBusiness');
      expect(result.current.schema.aggregateRating?.ratingValue).toBe(4.8);
    });

    it('provides access to contact info', () => {
      const { result } = renderHook(() => usePublicPageData(), {
        wrapper: wrapper(),
      });

      expect(result.current.contact?.email).toBe('joao@email.com');
      expect(result.current.contact?.whatsapp).toBe('+5511999999999');
    });

    it('provides access to social links', () => {
      const { result } = renderHook(() => usePublicPageData(), {
        wrapper: wrapper(),
      });

      expect(result.current.links?.instagram).toBe('@joaoeletricista');
      expect(result.current.links?.website).toBe('https://joaoeletricista.com.br');
    });

    it('handles minimal data without optional fields', () => {
      const minimalData: PublicPageData = {
        slug: 'minimal',
        city: 'City',
        citySlug: 'city',
        service: 'Service',
        serviceSlug: 'service',
        name: 'Provider',
        description: 'Description',
        seo: {
          title: 'Title',
          description: 'Desc',
          canonical: 'https://example.com',
        },
        schema: {
          type: 'LocalBusiness',
          name: 'Provider',
          description: 'Description',
          url: 'https://example.com',
        },
      };

      const { result } = renderHook(() => usePublicPageData(), {
        wrapper: wrapper(minimalData),
      });

      expect(result.current.slug).toBe('minimal');
      expect(result.current.bio).toBeUndefined();
      expect(result.current.contact).toBeUndefined();
      expect(result.current.links).toBeUndefined();
      expect(result.current.serviceSchema).toBeUndefined();
    });
  });
});
