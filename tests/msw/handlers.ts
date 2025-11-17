import { http, HttpResponse } from 'msw';

// Centralized deterministic handlers mirroring backend stubs.
export const handlers = [
  http.post('/api/generate-tip', async ({ request: _request }) => {
    const body = await _request.json().catch(() => ({}));
    return HttpResponse.json({ tip: `Dica simulada para ${(body.user?.name) || 'usuário'}: adicione uma foto.` });
  }),
  http.post('/api/enhance-profile', async ({ request: _request }) => {
    const body = await _request.json().catch(() => ({}));
    return HttpResponse.json({
      suggestedHeadline: `Headline otimizada para ${(body.profile?.name) || 'Prestador'}`,
      suggestedBio: (body.profile?.bio || 'Bio base') + ' — versão otimizada.',
    });
  }),
  http.post('/api/generate-referral', async ({ request: _request }) => {
    const body = await _request.json().catch(() => ({}));
    return HttpResponse.json({ subject: 'Convite SERVIO.AI', body: `Olá ${(body.friendEmail)||'amigo'}, experimente a plataforma.` });
  }),
  http.post('/api/analyze-fraud', async ({ request: _request }) => {
    return HttpResponse.json({ isSuspicious: false, riskScore: 10, reason: 'Sem sinais.' });
  }),
  http.post('/api/enhance-job', async ({ request: _request }) => {
    const body = await _request.json().catch(() => ({}));
    return HttpResponse.json({
      enhancedDescription: body.prompt || 'Descrição base',
      suggestedCategory: 'reparos',
      suggestedServiceType: 'personalizado'
    });
  }),
  http.post('/api/match-providers', async () => HttpResponse.json([])),
  http.post('/api/stripe/create-connect-account', async ({ request: _request }) => {
    const body = await _request.json().catch(() => ({}));
    return HttpResponse.json({ accountId: 'acct_stub_test', stub: true, userId: body.userId });
  }),
];
