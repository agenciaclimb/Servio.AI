/**
 * Email Service using Gmail SMTP
 *
 * Uses Nodemailer + Gmail SMTP for sending transactional and marketing emails.
 *
 * Setup:
 * 1. Enable 2-Step Verification in your Google Account
 * 2. Generate App Password: https://myaccount.google.com/apppasswords
 * 3. Add to .env: GMAIL_USER=your-email@gmail.com
 * 4. Add to .env: GMAIL_APP_PASSWORD=your-16-char-password
 *
 * Limits:
 * - Gmail Free: 500 emails/day
 * - Google Workspace: 2,000 emails/day
 */

const nodemailer = require('nodemailer');

class GmailService {
  constructor() {
    // Support both GMAIL_PASS and GMAIL_APP_PASSWORD env vars
    const password = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
    const isMocked = process.env.MOCK_EMAIL === 'true';

    if (isMocked) {
      // Mock mode for testing
      this.transporter = {
        verify: async () => true,
        sendMail: async options => ({
          messageId: `<mock-${Date.now()}@servio-ai.com>`,
          response: '250 Message sent',
        }),
      };
      this._mockHistory = [];
      this._origSendMail = this.transporter.sendMail;
      this.transporter.sendMail = async options => {
        this._mockHistory.push(options);
        return this._origSendMail(options);
      };
    } else {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.GMAIL_USER,
          pass: password,
        },
      });
    }

    this.defaultFrom = `Servio.AI <${process.env.GMAIL_USER}>`;
  }

  /**
   * Verify SMTP connection
   */
  async verify() {
    try {
      await this.transporter.verify();
      console.log('[Gmail] SMTP server is ready to send emails');
      return true;
    } catch (error) {
      console.error('[Gmail] SMTP verification failed:', error);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail({ to, subject, html, text, from, cc, bcc, attachments }) {
    try {
      const mailOptions = {
        from: from || this.defaultFrom,
        to,
        subject,
        text,
        html,
        cc,
        bcc,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('[Gmail] Email sent:', info.messageId, 'to:', to);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error('[Gmail] Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send prospector invite email
   */
  async sendProspectorInvite(prospectorName, prospectorEmail, referralLink) {
    const subject = '🚀 Você foi convidado para ser Prospector da Servio.AI!';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .content p { margin: 16px 0; }
          .benefits { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; }
          .benefits ul { margin: 10px 0; padding-left: 20px; }
          .benefits li { margin: 8px 0; }
          .link-box { background: #e9ecef; padding: 15px; border-radius: 8px; margin: 25px 0; word-break: break-all; font-family: monospace; font-size: 14px; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #5568d3; }
          .cta { text-align: center; margin: 30px 0; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #dee2e6; }
          .footer a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Convite Especial</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Torne-se um Prospector Premium</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${prospectorName}</strong>,</p>
            
            <p>Você foi selecionado para participar do nosso <strong>Programa de Prospectores</strong>!</p>
            
            <div class="benefits">
              <p><strong>📊 O que você ganha:</strong></p>
              <ul>
                <li><strong>💰 10% de comissão</strong> nos primeiros 3 meses de cada prestador indicado</li>
                <li><strong>📈 Dashboard exclusivo</strong> com analytics e métricas em tempo real</li>
                <li><strong>🔗 Links personalizados</strong> com rastreamento de cliques e conversões</li>
                <li><strong>🔔 Notificações push</strong> sobre cada clique e conversão</li>
                <li><strong>🏆 Sistema de badges</strong> e ranking com prospectores top</li>
                <li><strong>📝 Templates prontos</strong> para redes sociais</li>
              </ul>
            </div>

            <p><strong>🎯 Como funciona:</strong></p>
            <ol>
              <li>Ative sua conta clicando no botão abaixo</li>
              <li>Acesse seu dashboard e copie seu link exclusivo</li>
              <li>Compartilhe com prestadores de serviços (eletricistas, encanadores, pintores, etc.)</li>
              <li>Ganhe comissão automaticamente quando eles completarem jobs!</li>
            </ol>

            <p><strong>Seu link exclusivo de indicação:</strong></p>
            <div class="link-box">${referralLink}</div>

            <div class="cta">
              <a href="${referralLink}" class="button">🚀 Ativar Minha Conta Agora</a>
            </div>

            <p>Comece hoje e construa uma <strong>renda passiva</strong> indicando prestadores para a Servio.AI!</p>

            <p>Atenciosamente,<br><strong>Equipe Servio.AI</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>Servio.AI</strong> - Marketplace Inteligente de Serviços</p>
            <p>
              <a href="https://servio-ai.com">servio-ai.com</a> | 
              <a href="mailto:contato@servio-ai.com">contato@servio-ai.com</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              Você recebeu este email porque foi indicado para o Programa de Prospectores.<br>
              Não quer mais receber? <a href="${referralLink}/unsubscribe" style="color: #999;">Cancelar inscrição</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Olá ${prospectorName},

Você foi selecionado para participar do nosso Programa de Prospectores!

O QUE VOCÊ GANHA:
- 10% de comissão nos primeiros 3 meses de cada prestador indicado
- Dashboard exclusivo com analytics e métricas em tempo real
- Links personalizados com rastreamento de cliques e conversões
- Notificações push sobre cada clique e conversão
- Sistema de badges e ranking com prospectores top
- Templates prontos para redes sociais

COMO FUNCIONA:
1. Ative sua conta: ${referralLink}
2. Acesse seu dashboard e copie seu link exclusivo
3. Compartilhe com prestadores de serviços
4. Ganhe comissão automaticamente quando eles completarem jobs!

Seu link exclusivo: ${referralLink}

Comece hoje e construa uma renda passiva!

Atenciosamente,
Equipe Servio.AI

---
Servio.AI - Marketplace Inteligente de Serviços
servio-ai.com | contato@servio-ai.com
    `;

    return this.sendEmail({
      to: prospectorEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send follow-up reminder email
   */
  async sendFollowUpReminder(prospectorName, prospectorEmail, prospectName, daysAgo) {
    const subject = `📞 Lembrete: Follow-up com ${prospectName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; }
          .header { background: #667eea; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .highlight { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .suggestions { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .suggestions ul { margin: 10px 0; padding-left: 20px; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .cta { text-align: center; margin: 25px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">📞 Lembrete de Follow-up</h2>
          </div>
          
          <div class="content">
            <p>Olá <strong>${prospectorName}</strong>,</p>
            
            <div class="highlight">
              <p>Você contatou <strong>${prospectName}</strong> há <strong>${daysAgo} dias</strong>.</p>
            </div>

            <p>Este é o momento ideal para fazer um follow-up! 🎯</p>
            
            <p><strong>Por que fazer follow-up?</strong></p>
            <ul>
              <li>Prospects que recebem follow-up têm <strong>3x mais chances</strong> de converter</li>
              <li>Mostra que você está interessado e disponível</li>
              <li>Muitos prospects precisam apenas de um "empurrãozinho"</li>
            </ul>

            <div class="suggestions">
              <p><strong>💡 Sugestões de mensagem:</strong></p>
              <ul>
                <li>"Oi ${prospectName}! Conseguiu dar uma olhada na plataforma Servio.AI?"</li>
                <li>"Alguma dúvida que eu possa esclarecer sobre o cadastro?"</li>
                <li>"Vi que você trabalha com [serviço]. A Servio.AI pode te ajudar a conseguir mais clientes qualificados!"</li>
                <li>"Temos novidades! Agora a plataforma tem [nova feature]. Quer saber mais?"</li>
              </ul>
            </div>

            <div class="cta">
              <a href="https://servio-ai.com/prospector-dashboard?tab=templates" class="button">Ver Templates de Mensagem</a>
            </div>

            <p>Continue assim! Cada follow-up te aproxima de uma nova conversão. 🚀</p>

            <p>Sucesso,<br><strong>Equipe Servio.AI</strong></p>
          </div>
          
          <div class="footer">
            <p>Servio.AI - Marketplace Inteligente de Serviços</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Olá ${prospectorName},

Você contatou ${prospectName} há ${daysAgo} dias.

Este é o momento ideal para fazer um follow-up!

POR QUE FAZER FOLLOW-UP?
- Prospects que recebem follow-up têm 3x mais chances de converter
- Mostra que você está interessado e disponível
- Muitos prospects precisam apenas de um "empurrãozinho"

SUGESTÕES DE MENSAGEM:
- "Oi ${prospectName}! Conseguiu dar uma olhada na plataforma Servio.AI?"
- "Alguma dúvida que eu possa esclarecer sobre o cadastro?"
- "Vi que você trabalha com [serviço]. A Servio.AI pode te ajudar a conseguir mais clientes qualificados!"

Acesse templates prontos: https://servio-ai.com/prospector-dashboard?tab=templates

Continue assim! Cada follow-up te aproxima de uma nova conversão.

Sucesso,
Equipe Servio.AI
    `;

    return this.sendEmail({
      to: prospectorEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send conversion notification email
   */
  async sendConversionNotification(
    prospectorName,
    prospectorEmail,
    providerName,
    category,
    estimatedCommission
  ) {
    const subject = `🎉 Conversão confirmada: ${providerName} se cadastrou!`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; }
          .content { padding: 40px 30px; }
          .success-box { background: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
          .commission { font-size: 48px; color: #11998e; font-weight: bold; margin: 10px 0; }
          .commission-label { color: #666; font-size: 16px; }
          .info-box { background: #f8f9fa; border-left: 4px solid #17a2b8; padding: 20px; margin: 20px 0; }
          .steps { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; }
          .steps ol { margin: 10px 0; padding-left: 20px; }
          .button { display: inline-block; background: #11998e; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .cta { text-align: center; margin: 30px 0; }
          .footer { background: #f8f9fa; padding: 25px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Parabéns!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Você fez uma conversão!</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${prospectorName}</strong>,</p>
            
            <div class="success-box">
              <p style="margin: 0; font-size: 18px;"><strong>${providerName}</strong> acaba de se cadastrar como:</p>
              <p style="margin: 10px 0; font-size: 24px; color: #11998e;"><strong>${category}</strong></p>
              <p style="margin: 0; color: #666;">através do seu link de indicação!</p>
            </div>

            <div style="text-align: center;">
              <div class="commission">R$ ${estimatedCommission.toFixed(2)}</div>
              <p class="commission-label">Comissão estimada nos próximos 3 meses</p>
            </div>

            <div class="info-box">
              <p><strong>📊 Como funciona sua comissão:</strong></p>
              <ul style="margin: 10px 0;">
                <li>Você ganha <strong>10% da taxa da plataforma</strong> (que é 15% do valor do job)</li>
                <li>Comissão válida nos <strong>primeiros 3 meses</strong> do prestador</li>
                <li>Pagamento automático via <strong>Stripe Connect</strong></li>
                <li>Acompanhe tudo em <strong>tempo real</strong> no dashboard</li>
              </ul>
            </div>

            <div class="steps">
              <p><strong>🚀 Próximos passos:</strong></p>
              <ol>
                <li>Sua comissão será calculada automaticamente a cada job completado por ${providerName}</li>
                <li>Você receberá notificações push toda vez que ganhar comissão</li>
                <li>Verifique suas métricas no dashboard para acompanhar o desempenho</li>
              </ol>
            </div>

            <div class="cta">
              <a href="https://servio-ai.com/prospector-dashboard" class="button">Ver Meu Dashboard</a>
            </div>

            <p style="text-align: center; font-size: 18px; margin: 30px 0;">
              Continue indicando e <strong>multiplique seus ganhos</strong>! 💰
            </p>

            <p>Parabéns pelo sucesso,<br><strong>Equipe Servio.AI</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>Servio.AI</strong> - Marketplace Inteligente de Serviços</p>
            <p>Dúvidas? <a href="mailto:contato@servio-ai.com" style="color: #11998e;">contato@servio-ai.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Parabéns, ${prospectorName}!

${providerName} acaba de se cadastrar como ${category} através do seu link de indicação!

COMISSÃO ESTIMADA: R$ ${estimatedCommission.toFixed(2)}
(nos próximos 3 meses)

COMO FUNCIONA:
- Você ganha 10% da taxa da plataforma (15% do valor do job)
- Comissão válida nos primeiros 3 meses do prestador
- Pagamento automático via Stripe Connect
- Acompanhe tudo em tempo real no dashboard

PRÓXIMOS PASSOS:
1. Sua comissão será calculada automaticamente a cada job completado
2. Você receberá notificações push sobre cada comissão
3. Verifique suas métricas no dashboard

Acesse seu dashboard: https://servio-ai.com/prospector-dashboard

Continue indicando e multiplique seus ganhos!

Parabéns pelo sucesso,
Equipe Servio.AI
    `;

    return this.sendEmail({
      to: prospectorEmail,
      subject,
      html,
      text,
    });
  }
}

// Export singleton instance
module.exports = new GmailService();
