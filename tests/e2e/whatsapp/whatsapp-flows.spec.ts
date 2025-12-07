import { expect, request } from '@playwright/test';
import { test } from '../fixtures/roles.fixture';

// E2E "semi-integrado" para WhatsApp: UI + mock de webhook HTTP

const WHATSAPP_WEBHOOK_URL =
  process.env.E2E_WHATSAPP_WEBHOOK_URL || 'http://localhost:8081/api/whatsapp/webhook-test';

// Mensagens de exemplo baseadas nos guias WHATSAPP_*.md

const sampleTextMessage = {
  provider: 'whatsapp',
  type: 'text',
  from: '5511999999999',
  to: '5511888888888',
  messageId: 'wamid.E2E_TEXT',
  text: 'Quero contratar um eletricista amanhã às 10h',
};

const sampleMediaMessage = {
  provider: 'whatsapp',
  type: 'image',
  from: '5511999999999',
  to: '5511888888888',
  messageId: 'wamid.E2E_IMAGE',
  mediaUrl: 'https://example.com/e2e-image.jpg',
  caption: 'Foto do problema na instalação elétrica',
};

const sampleIntentPayload = {
  provider: 'whatsapp',
  type: 'text',
  from: '5511999999999',
  to: '5511888888888',
  messageId: 'wamid.E2E_INTENT',
  text: 'Quero abrir uma disputa do último serviço',
};

// Fluxos focados em:
// - aceitar webhook HTTP
// - registrar mensagem/evento
// - (opcionalmente) refletir algo na UI

test.describe('[E2E] WhatsApp - Webhook e fluxos básicos', () => {
  test('backend aceita webhook de mensagem de texto', async () => {
    const context = await request.newContext();
    const response = await context.post(WHATSAPP_WEBHOOK_URL, {
      data: sampleTextMessage,
    });

    expect(response.ok()).toBeTruthy();
  });

  test('backend aceita webhook de mídia (imagem)', async () => {
    const context = await request.newContext();
    const response = await context.post(WHATSAPP_WEBHOOK_URL, {
      data: sampleMediaMessage,
    });

    expect(response.ok()).toBeTruthy();
  });

  test('backend aceita webhook com texto de disputa (intenção)', async () => {
    const context = await request.newContext();
    const response = await context.post(WHATSAPP_WEBHOOK_URL, {
      data: sampleIntentPayload,
    });

    expect(response.ok()).toBeTruthy();
  });
});
