import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

describe('Prospector Material Kit', () => {
  const docPath = resolve(__dirname, '../doc');

  describe('Required Files Exist', () => {
    it('should have KIT_PROSPECTOR.md', () => {
      const filePath = resolve(docPath, 'KIT_PROSPECTOR.md');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have EMAIL_TEMPLATES_PROSPECTOR.md', () => {
      const filePath = resolve(docPath, 'EMAIL_TEMPLATES_PROSPECTOR.md');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have GUIA_RAPIDO_PROSPECTOR.md', () => {
      const filePath = resolve(docPath, 'GUIA_RAPIDO_PROSPECTOR.md');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('Content Validation - KIT_PROSPECTOR.md', () => {
    let content: string;

    beforeAll(() => {
      const filePath = resolve(docPath, 'KIT_PROSPECTOR.md');
      content = readFileSync(filePath, 'utf-8');
    });

    it('should contain at least 3 presentation scripts', () => {
      const scriptMatches = content.match(/### Script \d:/g);
      expect(scriptMatches).toBeTruthy();
      expect(scriptMatches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should have objection handling section', () => {
      expect(content).toContain('## 💬 Respostas para Objeções Comuns');
    });

    it('should include WhatsApp message templates', () => {
      expect(content).toContain('## 📱 Mensagens WhatsApp Personalizáveis');
      expect(content).toContain('Primeiro Contato');
      expect(content).toContain('Follow-up');
    });

    it('should have prospecting techniques section', () => {
      expect(content).toContain('## 🎯 Técnicas de Prospecção Eficazes');
    });

    it('should include success checklist', () => {
      expect(content).toContain('## ✅ Checklist do Prospector de Sucesso');
    });

    it('should have benefit highlights for different personas', () => {
      expect(content).toContain('Para Prestadores Iniciantes');
      expect(content).toContain('Para Prestadores Experientes');
    });
  });

  describe('Content Validation - EMAIL_TEMPLATES_PROSPECTOR.md', () => {
    let content: string;

    beforeAll(() => {
      const filePath = resolve(docPath, 'EMAIL_TEMPLATES_PROSPECTOR.md');
      content = readFileSync(filePath, 'utf-8');
    });

    it('should contain at least 6 email templates', () => {
      const templateMatches = content.match(/## Template \d:/g);
      expect(templateMatches).toBeTruthy();
      expect(templateMatches!.length).toBeGreaterThanOrEqual(6);
    });

    it('should have professional formal template', () => {
      expect(content).toContain('Template 1: E-mail Profissional Formal');
      expect(content).toContain('**Assunto**:');
    });

    it('should have casual/direct template', () => {
      expect(content).toContain('Template 2: E-mail Casual/Direto');
    });

    it('should include follow-up templates', () => {
      expect(content).toContain('Follow-up');
    });

    it('should have re-engagement template', () => {
      expect(content).toContain('E-mail de Reengajamento');
    });

    it('should provide usage tips', () => {
      expect(content).toContain('## 🎯 Dicas de Uso dos Templates');
    });

    it('should include A/B testing guidance', () => {
      expect(content).toContain('Teste A/B');
    });

    it('should provide metrics to track', () => {
      expect(content).toContain('## 📊 Métricas para Acompanhar');
      expect(content).toContain('Taxa de Abertura');
      expect(content).toContain('Taxa de Resposta');
    });
  });

  describe('Content Validation - GUIA_RAPIDO_PROSPECTOR.md', () => {
    let content: string;

    beforeAll(() => {
      const filePath = resolve(docPath, 'GUIA_RAPIDO_PROSPECTOR.md');
      content = readFileSync(filePath, 'utf-8');
    });

    it('should explain what a prospector is', () => {
      expect(content).toContain('## 📌 O Que É um Prospector?');
    });

    it('should explain commission structure', () => {
      expect(content).toContain('## 💰 Como Você Ganha?');
      expect(content).toContain('1% de todos os serviços');
      expect(content).toContain('0.25% de todos os serviços');
    });

    it('should have first day checklist', () => {
      expect(content).toContain('## 🎯 Seu Primeiro Dia');
      expect(content).toContain('Checklist de Início');
    });

    it('should explain where to find providers', () => {
      expect(content).toContain('## 🔍 Onde Encontrar Prestadores?');
      expect(content).toContain('Online:');
      expect(content).toContain('Offline:');
    });

    it('should have approach guidelines', () => {
      expect(content).toContain('## 💬 Como Abordar?');
      expect(content).toContain('Regra de Ouro');
    });

    it('should explain registration process', () => {
      expect(content).toContain('## 🛠️ Processo de Cadastro');
      expect(content).toContain('Passo 1:');
    });

    it('should explain dashboard features', () => {
      expect(content).toContain('## 📊 Seu Dashboard');
      expect(content).toContain('Métricas Principais');
      expect(content).toContain('Sistema de Badges');
    });

    it('should provide objection responses', () => {
      expect(content).toContain('## 🎓 Respondendo Objeções');
    });

    it('should include goals and strategy', () => {
      expect(content).toContain('## 📈 Metas e Estratégia');
      expect(content).toContain('Meta Semanal Sugerida');
    });

    it('should have quick wins section', () => {
      expect(content).toContain('## ⚡ Ações Rápidas (Quick Wins)');
    });

    it('should provide support information', () => {
      expect(content).toContain('## 🆘 Suporte');
    });

    it('should have daily checklist', () => {
      expect(content).toContain('## ✅ Checklist Diária do Prospector');
    });

    it('should have summary section', () => {
      expect(content).toContain('## 🎯 Resumo em 10 Pontos');
    });
  });

  describe('Content Quality Standards', () => {
    it('KIT_PROSPECTOR.md should be comprehensive (>5000 chars)', () => {
      const filePath = resolve(docPath, 'KIT_PROSPECTOR.md');
      const content = readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(5000);
    });

    it('EMAIL_TEMPLATES_PROSPECTOR.md should be comprehensive (>5000 chars)', () => {
      const filePath = resolve(docPath, 'EMAIL_TEMPLATES_PROSPECTOR.md');
      const content = readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(5000);
    });

    it('GUIA_RAPIDO_PROSPECTOR.md should be comprehensive (>5000 chars)', () => {
      const filePath = resolve(docPath, 'GUIA_RAPIDO_PROSPECTOR.md');
      const content = readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(5000);
    });
  });

  describe('Content Coherence', () => {
    it('all files should mention commission structure', () => {
      const files = [
        'KIT_PROSPECTOR.md',
        'EMAIL_TEMPLATES_PROSPECTOR.md',
        'GUIA_RAPIDO_PROSPECTOR.md',
      ];

      files.forEach(file => {
        const filePath = resolve(docPath, file);
        const content = readFileSync(filePath, 'utf-8');
        const hasCommissionMention =
          content.includes('comissão') ||
          content.includes('Comissão') ||
          content.includes('1%') ||
          content.includes('0.25%');
        expect(hasCommissionMention).toBe(true);
      });
    });

    it('all files should be in Portuguese', () => {
      const files = [
        'KIT_PROSPECTOR.md',
        'EMAIL_TEMPLATES_PROSPECTOR.md',
        'GUIA_RAPIDO_PROSPECTOR.md',
      ];

      files.forEach(file => {
        const filePath = resolve(docPath, file);
        const content = readFileSync(filePath, 'utf-8');
        // Check for Portuguese-specific words
        const portugueseWords = ['você', 'serviço', 'comissão', 'prestador'];
        const hasPortuguese = portugueseWords.some(word => content.includes(word));
        expect(hasPortuguese).toBe(true);
      });
    });
  });
});
