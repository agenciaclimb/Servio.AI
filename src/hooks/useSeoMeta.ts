import { useEffect } from 'react';
import { usePublicPageData } from '../providers/PublicPageDataProvider';

/**
 * Hook para injetar metadados SEO dinamicamente no <head>.
 *
 * Atualiza:
 * - <title>
 * - <meta name="description">
 * - <link rel="canonical">
 * - OpenGraph (og:title, og:description, og:url, og:image)
 * - Twitter Cards
 * - Schema.org JSON-LD
 *
 * @example
 * ```tsx
 * function PublicProviderPage() {
 *   useSeoMeta(); // Injeta SEO automaticamente
 *   const data = usePublicPageData();
 *   return <h1>{data.name}</h1>;
 * }
 * ```
 */
export function useSeoMeta() {
  const data = usePublicPageData();

  useEffect(() => {
    // Title
    document.title = data.seo.title;

    // Meta description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = data.seo.description;

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = data.seo.canonical;

    // OpenGraph
    const ogTags = [
      { property: 'og:type', content: 'profile' },
      { property: 'og:title', content: data.seo.title },
      { property: 'og:description', content: data.seo.description },
      { property: 'og:url', content: data.seo.canonical },
      ...(data.seo.ogImage ? [{ property: 'og:image', content: data.seo.ogImage }] : []),
    ];

    ogTags.forEach(({ property, content }) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Twitter Cards
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: data.seo.title },
      { name: 'twitter:description', content: data.seo.description },
      ...(data.seo.ogImage ? [{ name: 'twitter:image', content: data.seo.ogImage }] : []),
    ];

    twitterTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Schema.org JSON-LD
    let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': data.schema.type,
      name: data.schema.name,
      description: data.schema.description,
      url: data.schema.url,
      ...(data.schema.address && {
        address: {
          '@type': 'PostalAddress',
          ...data.schema.address,
        },
      }),
      ...(data.schema.geo && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: data.schema.geo.latitude,
          longitude: data.schema.geo.longitude,
        },
      }),
      ...(data.schema.telephone && { telephone: data.schema.telephone }),
      ...(data.schema.email && { email: data.schema.email }),
    };

    script.textContent = JSON.stringify(schemaData);

    // Cleanup: Remover metadados ao desmontar
    return () => {
      document.title = 'Servio.AI - Marketplace de Serviços';
      metaDescription?.setAttribute('content', '');
      canonical?.setAttribute('href', window.location.origin);
      script?.remove();
    };
  }, [data]);
}
