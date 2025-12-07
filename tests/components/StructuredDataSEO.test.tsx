import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StructuredDataSEO from '../../components/StructuredDataSEO';

describe('StructuredDataSEO', () => {
  it('renders JSON-LD script with provided schema', () => {
    const data = {
      name: 'Servio AI',
      url: 'https://servio.ai',
      telephone: '+55 11 99999-9999',
    };

    const { container } = render(<StructuredDataSEO schemaType="LocalBusiness" data={data} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();

    const json = script!.innerHTML ? JSON.parse(script!.innerHTML) : {};
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@type']).toBe('LocalBusiness');
    expect(json.name).toBe('Servio AI');
    expect(json.url).toBe('https://servio.ai');
    expect(json.telephone).toBe('+55 11 99999-9999');
  });
});
