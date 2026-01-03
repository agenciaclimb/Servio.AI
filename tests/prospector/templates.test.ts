import { describe, it, expect } from 'vitest';
import { templates, render, type TemplateVars } from '../../src/prospector/templates';

describe('prospector/templates', () => {
  describe('templates structure', () => {
    it('deve ter estrutura de canais (whatsapp, email, call)', () => {
      expect(templates).toHaveProperty('whatsapp');
      expect(templates).toHaveProperty('email');
      expect(templates).toHaveProperty('call');
    });

    it('deve ter templates do WhatsApp', () => {
      expect(templates.whatsapp).toHaveProperty('intro_value');
      expect(templates.whatsapp).toHaveProperty('case_study');
      expect(templates.whatsapp).toHaveProperty('question_nudge');
    });

    it('deve ter templates de email', () => {
      expect(templates.email).toHaveProperty('intro_value');
      expect(templates.email).toHaveProperty('case_study');
    });

    it('deve ter template de chamada', () => {
      expect(templates.call).toHaveProperty('call_script_short');
    });

    it('templates devem ser strings não vazias', () => {
      expect(typeof templates.whatsapp.intro_value).toBe('string');
      expect(templates.whatsapp.intro_value.length).toBeGreaterThan(0);
      expect(typeof templates.email.intro_value).toBe('string');
      expect(templates.email.intro_value.length).toBeGreaterThan(0);
    });
  });

  describe('render', () => {
    it('deve substituir variáveis básicas', () => {
      const template = 'Olá {{nome}}, bem-vindo!';
      const vars: TemplateVars = { nome: 'João' };

      const result = render(template, vars);

      expect(result).toBe('Olá João, bem-vindo!');
    });

    it('deve substituir múltiplas variáveis', () => {
      const template = '{{nome}} trabalha em {{categoria}} há {{anos}} anos';
      const vars: TemplateVars = { nome: 'Maria', categoria: 'Pintura', anos: 5 };

      const result = render(template, vars);

      expect(result).toBe('Maria trabalha em Pintura há 5 anos');
    });

    it('deve lidar com variáveis com espaços', () => {
      const template = '{{ nome }} e {{ sobrenome }}';
      const vars: TemplateVars = { nome: 'Pedro', sobrenome: 'Silva' };

      const result = render(template, vars);

      expect(result).toBe('Pedro e Silva');
    });

    it('deve substituir variável não encontrada por string vazia', () => {
      const template = 'Olá {{nome}}, você trabalha em {{categoria}}';
      const vars: TemplateVars = { nome: 'Ana' };

      const result = render(template, vars);

      expect(result).toBe('Olá Ana, você trabalha em ');
    });

    it('deve lidar com valores numéricos', () => {
      const template = 'Aumentamos {{percent}}% em {{dias}} dias';
      const vars: TemplateVars = { percent: 150, dias: 30 };

      const result = render(template, vars);

      expect(result).toBe('Aumentamos 150% em 30 dias');
    });

    it('deve lidar com valor undefined', () => {
      const template = '{{nome}} - {{empresa}}';
      const vars: TemplateVars = { nome: 'Carlos', empresa: undefined };

      const result = render(template, vars);

      expect(result).toBe('Carlos - ');
    });

    it('deve processar template real do WhatsApp intro_value', () => {
      const template = templates.whatsapp.intro_value;
      const vars: TemplateVars = { nome: 'João', categoria: 'Pintura' };

      const result = render(template, vars);

      expect(result).toContain('João');
      expect(result).toContain('Pintura');
      expect(result).toContain('Servio.AI');
    });

    it('deve processar template real do WhatsApp case_study', () => {
      const template = templates.whatsapp.case_study;
      const vars: TemplateVars = { empresa: 'TechCorp', percent: 150, dias: 30 };

      const result = render(template, vars);

      expect(result).toContain('TechCorp');
      expect(result).toContain('150');
      expect(result).toContain('30');
    });

    it('deve processar template real do email intro_value', () => {
      const template = templates.email.intro_value;
      const vars: TemplateVars = { nome: 'Maria', categoria: 'Elétrica', empresa: 'ElétricaX', dias: 45 };

      const result = render(template, vars);

      expect(result).toContain('Maria');
      expect(result).toContain('Elétrica');
      expect(result).toContain('ElétricaX');
      expect(result).toContain('45');
    });

    it('deve processar template real do call script', () => {
      const template = templates.call.call_script_short;
      const vars: TemplateVars = { categoria: 'Construção', empresa: 'BuildCo', percent: 200 };

      const result = render(template, vars);

      expect(result).toContain('Construção');
      expect(result).toContain('BuildCo');
      expect(result).toContain('200');
    });

    it('deve lidar com variáveis repetidas', () => {
      const template = '{{nome}} gosta de {{nome}}';
      const vars: TemplateVars = { nome: 'Pizza' };

      const result = render(template, vars);

      expect(result).toBe('Pizza gosta de Pizza');
    });

    it('deve lidar com template sem variáveis', () => {
      const template = 'Texto fixo sem variáveis';
      const vars: TemplateVars = { nome: 'Teste' };

      const result = render(template, vars);

      expect(result).toBe('Texto fixo sem variáveis');
    });

    it('deve lidar com caracteres especiais em valores', () => {
      const template = 'Empresa: {{empresa}}';
      const vars: TemplateVars = { empresa: 'Tech & Co.' };

      const result = render(template, vars);

      expect(result).toBe('Empresa: Tech & Co.');
    });

    it('deve lidar com valores vazios', () => {
      const template = '{{nome}} - {{email}}';
      const vars: TemplateVars = { nome: '', email: '' };

      const result = render(template, vars);

      expect(result).toBe(' - ');
    });

    it('deve processar template com múltiplas linhas', () => {
      const template = `Linha 1: {{var1}}
Linha 2: {{var2}}
Linha 3: {{var3}}`;
      const vars: TemplateVars = { var1: 'A', var2: 'B', var3: 'C' };

      const result = render(template, vars);

      expect(result).toContain('Linha 1: A');
      expect(result).toContain('Linha 2: B');
      expect(result).toContain('Linha 3: C');
    });

    it('deve lidar com valores muito longos', () => {
      const longValue = 'a'.repeat(1000);
      const template = '{{texto}}';
      const vars: TemplateVars = { texto: longValue };

      const result = render(template, vars);

      expect(result).toBe(longValue);
      expect(result.length).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com chaves duplas sem variável', () => {
      const template = 'Texto com {{}} vazio';
      const vars: TemplateVars = { };

      const result = render(template, vars);

      expect(result).toBe('Texto com  vazio');
    });

    it('deve lidar com variáveis não fechadas (manter como está)', () => {
      const template = 'Olá {{nome que não fecha';
      const vars: TemplateVars = { nome: 'João' };

      const result = render(template, vars);

      // Regex não captura variáveis mal formadas, mantém como está
      expect(result).toBe('Olá {{nome que não fecha');
    });

    it('deve lidar com zero como valor', () => {
      const template = 'Valor: {{numero}}';
      const vars: TemplateVars = { numero: 0 };

      const result = render(template, vars);

      expect(result).toBe('Valor: 0');
    });

    it('deve lidar com template vazio', () => {
      const template = '';
      const vars: TemplateVars = { nome: 'Teste' };

      const result = render(template, vars);

      expect(result).toBe('');
    });

    it('deve lidar com vars vazias', () => {
      const template = 'Olá {{nome}}';
      const vars: TemplateVars = {};

      const result = render(template, vars);

      expect(result).toBe('Olá ');
    });
  });
});
