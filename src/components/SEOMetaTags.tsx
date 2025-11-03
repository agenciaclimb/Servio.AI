import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOMetaTagsProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
}

/**
 * Componente para injetar meta tags SEO (Open Graph, Twitter Cards, Canonical)
 */
const SEOMetaTags: React.FC<SEOMetaTagsProps> = ({
  title = 'SERVIO.AI - Encontre o profissional perfeito com IA',
  description = 'Descreva sua necessidade e nossa IA conecta você aos melhores profissionais. Pagamento seguro, profissionais verificados.',
  canonical,
  ogImage = '/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
}) => {
  const hostname = typeof window !== 'undefined' ? window.location.origin : 'https://servio.ai';
  const fullCanonical = canonical ? `${hostname}${canonical}` : hostname;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={`${hostname}${ogImage}`} />
      <meta property="og:site_name" content="SERVIO.AI" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${hostname}${ogImage}`} />
    </Helmet>
  );
};

export default SEOMetaTags;
