import React from 'react';

type SchemaType = 'LocalBusiness' | 'Service' | 'Person';

interface StructuredDataSEOProps {
  schemaType: SchemaType;
  data: Record<string, unknown>;
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
