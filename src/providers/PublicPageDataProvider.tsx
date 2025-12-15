import { createContext, useContext, ReactNode } from 'react';

/**
 * Dados estruturados de uma página pública de prestador
 */
export interface PublicPageData {
  // Identificação
  slug: string;
  city: string;
  citySlug: string;
  service: string;
  serviceSlug: string;

  // Conteúdo principal
  name: string;
  description: string;
  bio?: string;

  // SEO
  seo: {
    title: string;
    description: string;
    canonical: string;
    ogImage?: string;
  };

  // Schema.org
  schema: {
    type: 'LocalBusiness';
    name: string;
    description: string;
    address?: {
      streetAddress?: string;
      addressLocality: string;
      addressRegion: string;
      postalCode?: string;
      addressCountry: string;
    };
    geo?: {
      latitude: number;
      longitude: number;
    };
    telephone?: string;
    email?: string;
    url: string;
    // SEO: suporte a rich results
    aggregateRating?: {
      ratingValue: number;
      reviewCount: number;
    };
  };

  // Dados adicionais
  contact?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  links?: {
    website?: string;
    instagram?: string;
    facebook?: string;
  };

  // JSON-LD extra: Service por serviço específico
  serviceSchema?: {
    type: 'Service';
    serviceType: string;
    areaServed: string;
    provider: {
      '@type': 'LocalBusiness';
      name: string;
    };
  };
}

const PublicPageDataContext = createContext<PublicPageData | null>(null);

interface PublicPageDataProviderProps {
  data: PublicPageData;
  children: ReactNode;
}

/**
 * Provider de dados para páginas públicas de prestadores.
 * 
 * Fornece dados estruturados para:
 * - Conteúdo da página
 * - SEO (title, meta, canonical)
 * - Schema.org JSON-LD
 * 
 * @example
 * ```tsx
 * <PublicPageDataProvider data={pageData}>
 *   <PublicProviderPage />
 * </PublicPageDataProvider>
 * ```
 */
export function PublicPageDataProvider({ data, children }: PublicPageDataProviderProps) {
  return (
    <PublicPageDataContext.Provider value={data}>
      {children}
    </PublicPageDataContext.Provider>
  );
}

/**
 * Hook para acessar dados da página pública.
 * 
 * ⚠️ DEVE ser usado dentro de um PublicPageDataProvider.
 * 
 * @throws {Error} Se usado fora do provider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const data = usePublicPageData();
 *   return <h1>{data.name}</h1>;
 * }
 * ```
 */
export function usePublicPageData(): PublicPageData {
  const ctx = useContext(PublicPageDataContext);
  
  if (!ctx) {
    throw new Error(
      '[PublicPageDataProvider] Nenhum provedor de dados registrado. ' +
      'Certifique-se de envolver seu componente com <PublicPageDataProvider>.'
    );
  }
  
  return ctx;
}
