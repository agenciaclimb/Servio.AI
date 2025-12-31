import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = process.env.PORT || 4174;
const providersPath = resolve('seo/providers.sample.json');
const providers = JSON.parse(readFileSync(providersPath, 'utf-8'));

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildJsonLd(provider, baseUrl) {
  const url = `${baseUrl}/p/${provider.citySlug}/${provider.serviceSlug}/${provider.slug}`;
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: provider.name,
      description: provider.description,
      url,
      image: provider.image,
      address: {
        '@type': 'PostalAddress',
        addressLocality: provider.city,
        addressRegion: provider.region,
        addressCountry: 'BR',
      },
      geo: provider.geo
        ? {
            '@type': 'GeoCoordinates',
            latitude: provider.geo.lat,
            longitude: provider.geo.lng,
          }
        : undefined,
      sameAs: provider.links || [],
      areaServed: provider.city,
      makesOffer: {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: provider.service,
          areaServed: provider.city,
        },
      },
      service: {
        '@type': 'Service',
        name: provider.service,
        description: provider.description,
        areaServed: provider.city,
      },
    },
    null,
    2
  );
}

function renderProviderPage(provider, baseUrl) {
  const canonical = `${baseUrl}/p/${provider.citySlug}/${provider.serviceSlug}/${provider.slug}`;
  const title = `${provider.service} em ${provider.city} | ${provider.name}`;
  const description = provider.description.slice(0, 155);
  const jsonLd = buildJsonLd(provider, baseUrl);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${esc(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="${esc(provider.image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(provider.image)}" />
  <script type="application/ld+json">${jsonLd}</script>
  <meta name="robots" content="index,follow" />
</head>
<body>
  <header>
    <p aria-label="breadcrumb">${esc(provider.city)} / ${esc(provider.service)}</p>
    <h1>${esc(provider.service)} em ${esc(provider.city)}</h1>
    <h2>${esc(provider.name)}</h2>
  </header>
  <main>
    <section>
      <p>${esc(provider.description)}</p>
      <ul>
        <li><strong>Área atendida:</strong> ${esc(provider.city)}</li>
        <li><strong>Região:</strong> ${esc(provider.region)}</li>
        <li><strong>Experiência:</strong> ${esc(provider.experience || 'Especialista')}</li>
        <li><strong>Atendimento:</strong> ${esc(provider.service)}</li>
      </ul>
    </section>
    <section>
      <h3>Serviço</h3>
      <p>${esc(provider.serviceDetail || 'Serviço especializado com agendamento disponível.')}</p>
    </section>
    <section>
      <h3>Contato</h3>
      <p>E-mail: <a href="mailto:${esc(provider.email)}">${esc(provider.email)}</a></p>
      ${provider.phone ? `<p>Telefone: <a href="tel:${esc(provider.phone)}">${esc(provider.phone)}</a></p>` : ''}
      ${provider.website ? `<p>Site: <a href="${esc(provider.website)}">${esc(provider.website)}</a></p>` : ''}
    </section>
  </main>
</body>
</html>`;
}

function notFound(baseUrl) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Serviço não encontrado | Servio.AI</title>
  <meta name="robots" content="noindex,nofollow" />
  <link rel="canonical" href="${baseUrl}/404" />
</head>
<body>
  <h1>Serviço não encontrado</h1>
  <p>Tente outra cidade ou serviço.</p>
</body>
</html>`;
}

function renderRobotsTxt(baseUrl) {
  return `User-agent: *
Allow: /p/
Sitemap: ${baseUrl}/sitemap.xml
`;
}

function renderSitemap(baseUrl) {
  const urls = providers.map(p => `${baseUrl}/p/${p.citySlug}/${p.serviceSlug}/${p.slug}`);
  const today = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `<url>
  <loc>${esc(u)}</loc>
  <lastmod>${today}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>`
  )
  .join('\n')}
</urlset>`;
}

const server = http.createServer((req, res) => {
  const host = req.headers.host || 'localhost';
  const baseUrl = `https://${host}`;

  if (req.url === '/robots.txt') {
    const body = renderRobotsTxt(baseUrl);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(body);
    return;
  }

  if (req.url === '/sitemap.xml') {
    const body = renderSitemap(baseUrl);
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(body);
    return;
  }

  const match = req.url && req.url.match(/^\/p\/([^/]+)\/([^/]+)\/([^/?#]+)/);
  if (match) {
    const [, citySlug, serviceSlug, slug] = match;
    const provider = providers.find(
      p => p.citySlug === citySlug && p.serviceSlug === serviceSlug && p.slug === slug
    );
    if (!provider) {
      const body = notFound(baseUrl);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(body);
      return;
    }
    const html = renderProviderPage(provider, baseUrl);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[seo-ssr] Listening on :${PORT}`);
});
