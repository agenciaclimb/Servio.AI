import { describe, it, expect } from 'vitest';
import {
  getTemperatureBadgeClass,
  getTemperatureEmoji,
  formatRelativeTime,
  generateWhatsAppTemplate,
  generateEmailTemplate,
  type LeadTemperature,
  type ProspectLead,
} from '../../src/utils/prospectorHelpers';

describe('prospectorHelpers', () => {
  describe('getTemperatureBadgeClass', () => {
    it('deve retornar classe vermelha para temperatura hot', () => {
      expect(getTemperatureBadgeClass('hot')).toBe('bg-red-100 text-red-700');
    });

    it('deve retornar classe amarela para temperatura warm', () => {
      expect(getTemperatureBadgeClass('warm')).toBe('bg-yellow-100 text-yellow-700');
    });

    it('deve retornar classe azul para temperatura cold', () => {
      expect(getTemperatureBadgeClass('cold')).toBe('bg-blue-100 text-blue-700');
    });

    it('deve retornar classe azul quando temperatura não fornecida', () => {
      expect(getTemperatureBadgeClass()).toBe('bg-blue-100 text-blue-700');
    });

    it('deve retornar classe azul para temperatura undefined', () => {
      expect(getTemperatureBadgeClass(undefined)).toBe('bg-blue-100 text-blue-700');
    });
  });

  describe('getTemperatureEmoji', () => {
    it('deve retornar emoji de fogo para temperatura hot', () => {
      expect(getTemperatureEmoji('hot')).toBe('🔥');
    });

    it('deve retornar emoji de sol para temperatura warm', () => {
      expect(getTemperatureEmoji('warm')).toBe('☀️');
    });

    it('deve retornar emoji de gelo para temperatura cold', () => {
      expect(getTemperatureEmoji('cold')).toBe('❄️');
    });

    it('deve retornar emoji de gelo quando temperatura não fornecida', () => {
      expect(getTemperatureEmoji()).toBe('❄️');
    });

    it('deve retornar emoji de gelo para temperatura undefined', () => {
      expect(getTemperatureEmoji(undefined)).toBe('❄️');
    });
  });

  describe('formatRelativeTime', () => {
    it('deve retornar "agora" para menos de 60 segundos', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('agora');

      const fiftySecondsAgo = new Date(Date.now() - 50 * 1000);
      expect(formatRelativeTime(fiftySecondsAgo)).toBe('agora');
    });

    it('deve retornar minutos para menos de 1 hora', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5min atrás');

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      expect(formatRelativeTime(thirtyMinutesAgo)).toBe('30min atrás');

      const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000);
      expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59min atrás');
    });

    it('deve retornar horas para menos de 1 dia', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h atrás');

      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      expect(formatRelativeTime(twelveHoursAgo)).toBe('12h atrás');

      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000);
      expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23h atrás');
    });

    it('deve retornar dias para mais de 1 dia', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe('1d atrás');

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d atrás');

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(thirtyDaysAgo)).toBe('30d atrás');
    });

    it('deve arredondar para baixo os valores', () => {
      // 1.9 minutos = 1 minuto
      const onePointNineMinutes = new Date(Date.now() - 114 * 1000);
      expect(formatRelativeTime(onePointNineMinutes)).toBe('1min atrás');

      // 2.9 horas = 2 horas
      const twoPointNineHours = new Date(Date.now() - 10440 * 1000);
      expect(formatRelativeTime(twoPointNineHours)).toBe('2h atrás');
    });

    it('deve lidar com exatamente 60 segundos', () => {
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      expect(formatRelativeTime(sixtySecondsAgo)).toBe('1min atrás');
    });

    it('deve lidar com exatamente 1 hora', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe('1h atrás');
    });

    it('deve lidar com exatamente 1 dia', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe('1d atrás');
    });
  });

  describe('generateWhatsAppTemplate', () => {
    const baseLead: ProspectLead = {
      id: 'lead-1',
      name: 'João Silva',
    };

    it('deve gerar template básico com nome', () => {
      const template = generateWhatsAppTemplate(baseLead);

      expect(template).toContain('Olá João Silva! 👋');
      expect(template).toContain('Sou prospector da Servio.AI');
      expect(template).toContain('Sem taxas de cadastro');
      expect(template).toContain('Pagamento garantido');
      expect(template).toContain('Flexibilidade total');
      expect(template).toContain('Suporte dedicado');
      expect(template).toContain('Quer saber mais');
    });

    it('deve incluir categoria quando fornecida', () => {
      const leadWithCategory: ProspectLead = {
        ...baseLead,
        category: 'Pintura',
      };

      const template = generateWhatsAppTemplate(leadWithCategory);

      expect(template).toContain('Vi que você trabalha com Pintura.');
    });

    it('não deve mencionar categoria quando não fornecida', () => {
      const template = generateWhatsAppTemplate(baseLead);

      expect(template).not.toContain('Vi que você trabalha com');
      expect(template).toContain('Temos uma oportunidade perfeita');
    });

    it('deve incluir todos os emojis esperados', () => {
      const template = generateWhatsAppTemplate(baseLead);

      expect(template).toContain('👋');
      expect(template).toContain('💰');
      expect(template).toContain('✅');
      expect(template).toContain('🚀');
    });

    it('deve gerar template com email e telefone (não usado no template mas na interface)', () => {
      const leadComplete: ProspectLead = {
        id: 'lead-2',
        name: 'Maria Costa',
        email: 'maria@example.com',
        phone: '11999999999',
        category: 'Elétrica',
      };

      const template = generateWhatsAppTemplate(leadComplete);

      expect(template).toContain('Olá Maria Costa!');
      expect(template).toContain('Vi que você trabalha com Elétrica.');
    });

    it('deve lidar com categoria com caracteres especiais', () => {
      const lead: ProspectLead = {
        id: 'lead-3',
        name: 'Pedro Santos',
        category: 'Encanamento & Hidráulica',
      };

      const template = generateWhatsAppTemplate(lead);

      expect(template).toContain('Vi que você trabalha com Encanamento & Hidráulica.');
    });

    it('deve lidar com nomes compostos', () => {
      const lead: ProspectLead = {
        id: 'lead-4',
        name: 'Ana Paula da Silva Costa',
      };

      const template = generateWhatsAppTemplate(lead);

      expect(template).toContain('Olá Ana Paula da Silva Costa!');
    });

    it('deve manter estrutura consistente do template', () => {
      const template = generateWhatsAppTemplate(baseLead);
      
      const lines = template.split('\n').filter(line => line.trim());
      expect(lines.length).toBeGreaterThan(5); // Template tem várias linhas
      expect(template).toMatch(/Olá.*!/); // Começa com saudação
      // Termina com pergunta ou emoji 🚀
      expect(template.endsWith('?') || template.endsWith('🚀')).toBe(true);
    });
  });

  describe('generateEmailTemplate', () => {
    const baseLead: ProspectLead = {
      id: 'lead-1',
      name: 'João Silva',
    };

    it('deve gerar template básico de email com nome', () => {
      const template = generateEmailTemplate(baseLead);

      expect(template).toContain('Olá João Silva,');
      expect(template).toContain('Meu nome é [SEU NOME]');
      expect(template).toContain('Servio.AI');
      expect(template).toContain('Clientes pré-qualificados');
      expect(template).toContain('Pagamento garantido pela plataforma');
      expect(template).toContain('Sem mensalidades ou taxas ocultas');
      expect(template).toContain('Você define sua agenda e valores');
    });

    it('deve incluir categoria no email quando fornecida', () => {
      const leadWithCategory: ProspectLead = {
        ...baseLead,
        category: 'Pintura',
      };

      const template = generateEmailTemplate(leadWithCategory);

      expect(template).toContain('profissionais de Pintura');
      expect(template).toContain('Percebi sua expertise em Pintura');
    });

    it('deve usar termo genérico quando categoria não fornecida', () => {
      const template = generateEmailTemplate(baseLead);

      expect(template).toContain('profissionais autônomos');
      expect(template).not.toContain('Percebi sua expertise');
    });

    it('deve incluir saudação e despedida formais', () => {
      const template = generateEmailTemplate(baseLead);

      expect(template).toMatch(/^Olá/);
      expect(template).toContain('Estou à disposição');
      expect(template).toContain('Abraços,');
      expect(template).toContain('[SEU NOME]');
    });

    it('deve manter formatação de bullet points', () => {
      const template = generateEmailTemplate(baseLead);

      expect(template).toContain('•');
      const bulletCount = (template.match(/•/g) || []).length;
      expect(bulletCount).toBe(4); // 4 bullet points
    });

    it('deve gerar email com categoria complexa', () => {
      const lead: ProspectLead = {
        id: 'lead-3',
        name: 'Carlos Oliveira',
        category: 'Instalação & Manutenção de Ar Condicionado',
      };

      const template = generateEmailTemplate(lead);

      expect(template).toContain('profissionais de Instalação & Manutenção de Ar Condicionado');
      expect(template).toContain('Percebi sua expertise em Instalação & Manutenção de Ar Condicionado');
    });

    it('deve lidar com nomes com acentuação', () => {
      const lead: ProspectLead = {
        id: 'lead-4',
        name: 'José María',
        category: 'Construção',
      };

      const template = generateEmailTemplate(lead);

      expect(template).toContain('Olá José María,');
    });

    it('deve incluir placeholder para personalização', () => {
      const template = generateEmailTemplate(baseLead);

      const placeholders = template.match(/\[SEU NOME\]/g) || [];
      expect(placeholders.length).toBe(2); // Aparece 2 vezes (início e fim)
    });

    it('deve ter estrutura de email profissional', () => {
      const template = generateEmailTemplate(baseLead);

      // Deve ter saudação, corpo, call-to-action e assinatura
      expect(template).toMatch(/Olá.*,/);
      expect(template).toContain('Meu nome é');
      expect(template).toContain('oportunidade exclusiva:');
      expect(template).toContain('Estou à disposição');
      expect(template).toContain('Abraços,');
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com nome vazio no WhatsApp template', () => {
      const lead: ProspectLead = { id: 'lead-1', name: '' };
      const template = generateWhatsAppTemplate(lead);

      expect(template).toContain('Olá !'); // Nome vazio deixa espaço
    });

    it('deve lidar com nome vazio no email template', () => {
      const lead: ProspectLead = { id: 'lead-1', name: '' };
      const template = generateEmailTemplate(lead);

      expect(template).toContain('Olá ,'); // Nome vazio deixa espaço
    });

    it('deve lidar com lead completo no WhatsApp', () => {
      const lead: ProspectLead = {
        id: 'lead-full',
        name: 'Full Lead',
        email: 'full@example.com',
        phone: '11999999999',
        category: 'Teste',
        temperature: 'hot',
        lastContacted: new Date(),
        customField: 'custom value',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('Olá Full Lead!');
      expect(template).toContain('Vi que você trabalha com Teste.');
    });

    it('deve lidar com lead completo no email', () => {
      const lead: ProspectLead = {
        id: 'lead-full',
        name: 'Full Lead',
        email: 'full@example.com',
        phone: '11999999999',
        category: 'Teste',
        temperature: 'warm',
        lastContacted: new Date(),
        customField: 'custom value',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('Olá Full Lead,');
      expect(template).toContain('profissionais de Teste');
    });

    it('deve lidar com categoria muito longa', () => {
      const lead: ProspectLead = {
        id: 'lead-long',
        name: 'Test User',
        category: 'Instalação, Manutenção e Reparo de Sistemas de Climatização Residencial e Comercial',
      };

      const whatsappTemplate = generateWhatsAppTemplate(lead);
      const emailTemplate = generateEmailTemplate(lead);

      expect(whatsappTemplate).toContain('Vi que você trabalha com Instalação');
      expect(emailTemplate).toContain('profissionais de Instalação');
    });

    it('formatRelativeTime deve lidar com data futura (retorna negativo mas funcional)', () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 1000);
      const result = formatRelativeTime(futureDate);
      
      // Verifica que não quebra, mesmo com data futura
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Type Safety', () => {
    it('deve aceitar todos os valores válidos de LeadTemperature', () => {
      const temperatures: LeadTemperature[] = ['hot', 'warm', 'cold'];
      
      temperatures.forEach(temp => {
        expect(() => getTemperatureBadgeClass(temp)).not.toThrow();
        expect(() => getTemperatureEmoji(temp)).not.toThrow();
      });
    });

    it('deve aceitar ProspectLead com campos opcionais', () => {
      const minimalLead: ProspectLead = {
        id: '1',
        name: 'Test',
      };

      expect(() => generateWhatsAppTemplate(minimalLead)).not.toThrow();
      expect(() => generateEmailTemplate(minimalLead)).not.toThrow();
    });
  });
});
