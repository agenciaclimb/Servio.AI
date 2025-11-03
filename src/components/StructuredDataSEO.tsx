import React from 'react';

// Allow any Schema.org type to be rendered (FAQPage, HowTo, WebSite, Organization, etc.)
type SchemaType = string;

interface StructuredDataSEOProps {
  schemaType: SchemaType;
  data: Record<string, any>;
}

const StructuredDataSEO: React.FC<StructuredDataSEOProps> = ({ schemaType, data }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default StructuredDataSEO;
