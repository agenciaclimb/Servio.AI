import { describe, it, expect, beforeEach, vi } from 'vitest';

async function loadService() {
  // Ensure env is set before service instantiation
  process.env.GMAIL_USER = 'contato@servio-ai.com';
  process.env.GMAIL_PASS = 'ccuqydkjrhpudddx'; // Use actual app password for real test
  process.env.GMAIL_APP_PASSWORD = process.env.GMAIL_PASS; // Support both names
  process.env.MOCK_EMAIL = 'true'; // Use mock for unit tests
  const mod = await import('../src/gmailService.js');
  // CommonJS default export
  return mod.default || mod;
}

describe('gmailService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('verifies SMTP connection', async () => {
    const gmailService = await loadService();
    const ok = await gmailService.verify();
    expect(ok).toBe(true);
  });

  it('sends a basic email with default from', async () => {
    const gmailService = await loadService();
    await gmailService.sendEmail({ to: 'to@example.com', subject: 'Hello', text: 'Hi' });
    const args = gmailService._mockHistory[0];
    expect(args.to).toBe('to@example.com');
    expect(args.subject).toBe('Hello');
    expect(args.text).toBe('Hi');
    expect(args.from).toBe(`Servio.AI <${process.env.GMAIL_USER}>`);
  });

  it('sendProspectorInvite composes expected subject and link', async () => {
    const gmailService = await loadService();
    const link = 'https://servio-ai.com/register?ref=ABC123';
    await gmailService.sendProspectorInvite('João', 'joao@example.com', link);
    const { to, subject, html } = gmailService._mockHistory[0];
    expect(to).toBe('joao@example.com');
    expect(subject).toContain('Prospector');
    expect(html).toContain(link);
  });

  it('sendFollowUpReminder composes expected subject', async () => {
    const gmailService = await loadService();
    await gmailService.sendFollowUpReminder('Maria', 'maria@example.com', 'Carlos', 3);
    const { to, subject, html } = gmailService._mockHistory[0];
    expect(to).toBe('maria@example.com');
    expect(subject).toContain('Follow-up');
    expect(html).toContain('Carlos');
  });

  it('sendConversionNotification formats commission value', async () => {
    const gmailService = await loadService();
    await gmailService.sendConversionNotification('Ana', 'ana@example.com', 'Pedro', 'Eletricista', 450);
    const { to, subject, html, text } = gmailService._mockHistory[0];
    expect(to).toBe('ana@example.com');
    expect(subject).toContain('Conversão');
    // Ensure 2 decimal places appear in either html or text template
    expect(html.includes('R$ 450.00') || text.includes('R$ 450.00')).toBe(true);
  });
});
