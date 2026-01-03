import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendWhatsAppInvite, buildInviteTemplate } from '../../services/whatsappService';

describe('WhatsApp Service', () => {
  describe('sendWhatsAppInvite', () => {
    beforeEach(() => {
      // Reset random seed for predictable tests
      vi.spyOn(Math, 'random');
    });

    it('deve retornar erro quando phone está vazio', async () => {
      const result = await sendWhatsAppInvite('', 'template_intro');
      
      expect(result.success).toBe(false);
      expect(result.provider).toBe('');
      expect(result.template).toBe('template_intro');
      expect(result.error).toBe('missing_phone');
    });

    it('deve retornar erro quando phone é null', async () => {
      const result = await sendWhatsAppInvite(null as any, 'template_intro');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('missing_phone');
    });

    it('deve retornar erro quando phone é undefined', async () => {
      const result = await sendWhatsAppInvite(undefined as any, 'template_intro');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('missing_phone');
    });

    it('deve simular sucesso quando random < 0.8', async () => {
      vi.mocked(Math.random).mockReturnValue(0.5); // < 0.8
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result.success).toBe(true);
      expect(result.provider).toBe('+5511999999999');
      expect(result.template).toBe('template_intro');
      expect(result.error).toBeUndefined();
    });

    it('deve simular falha quando random >= 0.8', async () => {
      vi.mocked(Math.random).mockReturnValue(0.9); // >= 0.8
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result.success).toBe(false);
      expect(result.provider).toBe('+5511999999999');
      expect(result.template).toBe('template_intro');
      expect(result.error).toBe('simulated_failure');
    });

    it('deve retornar sucesso no limite (random = 0.79)', async () => {
      vi.mocked(Math.random).mockReturnValue(0.79); // < 0.8
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result.success).toBe(true);
    });

    it('deve retornar falha no limite (random = 0.8)', async () => {
      vi.mocked(Math.random).mockReturnValue(0.8); // >= 0.8
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result.success).toBe(false);
    });

    it('deve preservar provider e template em sucesso', async () => {
      vi.mocked(Math.random).mockReturnValue(0.1);
      
      const result = await sendWhatsAppInvite('+5511987654321', 'custom_template');
      
      expect(result.provider).toBe('+5511987654321');
      expect(result.template).toBe('custom_template');
    });

    it('deve preservar provider e template em falha', async () => {
      vi.mocked(Math.random).mockReturnValue(0.9);
      
      const result = await sendWhatsAppInvite('+5511987654321', 'custom_template');
      
      expect(result.provider).toBe('+5511987654321');
      expect(result.template).toBe('custom_template');
    });

    it('deve ter estrutura WhatsAppSendResult completa', async () => {
      vi.mocked(Math.random).mockReturnValue(0.5);
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('provider');
      expect(result).toHaveProperty('template');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.provider).toBe('string');
      expect(typeof result.template).toBe('string');
    });

    it('deve aceitar diferentes formatos de telefone', async () => {
      vi.mocked(Math.random).mockReturnValue(0.5);
      
      const phones = [
        '+5511999999999',
        '5511999999999',
        '11999999999',
        '+55 11 99999-9999',
      ];

      for (const phone of phones) {
        const result = await sendWhatsAppInvite(phone, 'template_intro');
        expect(result.provider).toBe(phone);
      }
    });

    it('deve ser função async', () => {
      const result = sendWhatsAppInvite('+5511999999999', 'template_intro');
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('buildInviteTemplate', () => {
    it('deve construir template com nome e categoria', () => {
      const template = buildInviteTemplate('João Silva', 'Pintura');
      
      expect(template).toContain('João Silva');
      expect(template).toContain('Pintura');
      expect(template).toContain('Servio.AI');
    });

    it('deve incluir saudação', () => {
      const template = buildInviteTemplate('Maria', 'Limpeza');
      
      expect(template).toContain('Olá Maria');
    });

    it('deve incluir descrição da plataforma', () => {
      const template = buildInviteTemplate('João', 'Pintura');
      
      expect(template).toContain('plataforma inteligente');
      expect(template).toContain('serviços de Pintura');
    });

    it('deve incluir call-to-action', () => {
      const template = buildInviteTemplate('João', 'Pintura');
      
      expect(template).toContain('Cadastre-se');
      expect(template).toContain('oportunidades qualificadas');
    });

    it('deve incluir emoji de foguete', () => {
      const template = buildInviteTemplate('João', 'Pintura');
      
      expect(template).toContain('🚀');
    });

    it('deve lidar com nomes longos', () => {
      const longName = 'João Pedro da Silva Santos Junior';
      const template = buildInviteTemplate(longName, 'Pintura');
      
      expect(template).toContain(longName);
    });

    it('deve lidar com categorias longas', () => {
      const longCategory = 'Instalação e Manutenção de Sistemas de Ar Condicionado';
      const template = buildInviteTemplate('João', longCategory);
      
      expect(template).toContain(longCategory);
    });

    it('deve lidar com caracteres especiais no nome', () => {
      const specialName = "D'Angelo & Côrtes";
      const template = buildInviteTemplate(specialName, 'Pintura');
      
      expect(template).toContain(specialName);
    });

    it('deve lidar com caracteres especiais na categoria', () => {
      const specialCategory = 'Construção & Reformas';
      const template = buildInviteTemplate('João', specialCategory);
      
      expect(template).toContain(specialCategory);
    });

    it('deve retornar string não vazia', () => {
      const template = buildInviteTemplate('João', 'Pintura');
      
      expect(template).toBeTruthy();
      expect(template.length).toBeGreaterThan(0);
    });

    it('deve ter tamanho aproximado de 150 caracteres', () => {
      const template = buildInviteTemplate('João Silva', 'Pintura');
      
      // Comentário no código diz ~150 chars
      expect(template.length).toBeGreaterThan(100);
      expect(template.length).toBeLessThan(200);
    });

    it('deve ser consistente para mesmos inputs', () => {
      const template1 = buildInviteTemplate('João', 'Pintura');
      const template2 = buildInviteTemplate('João', 'Pintura');
      
      expect(template1).toBe(template2);
    });

    it('deve gerar templates diferentes para nomes diferentes', () => {
      const template1 = buildInviteTemplate('João', 'Pintura');
      const template2 = buildInviteTemplate('Maria', 'Pintura');
      
      expect(template1).not.toBe(template2);
    });

    it('deve gerar templates diferentes para categorias diferentes', () => {
      const template1 = buildInviteTemplate('João', 'Pintura');
      const template2 = buildInviteTemplate('João', 'Limpeza');
      
      expect(template1).not.toBe(template2);
    });

    it('deve lidar com nome vazio', () => {
      const template = buildInviteTemplate('', 'Pintura');
      
      expect(template).toContain('Olá !'); // "Olá !"
      expect(template).toContain('Pintura');
    });

    it('deve lidar com categoria vazia', () => {
      const template = buildInviteTemplate('João', '');
      
      expect(template).toContain('João');
      expect(template).toContain('serviços de '); // "serviços de "
    });

    it('deve manter formato mesmo com inputs vazios', () => {
      const template = buildInviteTemplate('', '');
      
      expect(template).toContain('Servio.AI');
      expect(template).toContain('🚀');
      expect(template).toContain('Cadastre-se');
    });

    it('deve retornar string (não undefined ou null)', () => {
      const template = buildInviteTemplate('João', 'Pintura');
      
      expect(typeof template).toBe('string');
      expect(template).not.toBeNull();
      expect(template).not.toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('sendWhatsAppInvite deve lidar com template vazio', async () => {
      vi.mocked(Math.random).mockReturnValue(0.5);
      
      const result = await sendWhatsAppInvite('+5511999999999', '');
      
      expect(result.template).toBe('');
      expect(result.success).toBe(true);
    });

    it('sendWhatsAppInvite deve lidar com phone com espaços', async () => {
      vi.mocked(Math.random).mockReturnValue(0.5);
      
      const result = await sendWhatsAppInvite('  ', 'template_intro');
      
      expect(result.success).toBe(true); // "  " is truthy
      expect(result.provider).toBe('  ');
    });

    it('buildInviteTemplate deve lidar com nomes com números', () => {
      const template = buildInviteTemplate('João 123', 'Pintura');
      
      expect(template).toContain('João 123');
    });

    it('buildInviteTemplate deve preservar quebras de linha se houver', () => {
      const template = buildInviteTemplate('João\nSilva', 'Pintura');
      
      expect(template).toContain('João\nSilva');
    });

    it('sendWhatsAppInvite com random = 0 deve retornar sucesso', async () => {
      vi.mocked(Math.random).mockReturnValue(0);
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result.success).toBe(true);
    });

    it('sendWhatsAppInvite com random = 1 deve retornar falha', async () => {
      vi.mocked(Math.random).mockReturnValue(1);
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result.success).toBe(false);
    });

    it('deve garantir que error só existe quando success=false (missing_phone)', async () => {
      const result = await sendWhatsAppInvite('', 'template_intro');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve garantir que error só existe quando success=false (simulated)', async () => {
      vi.mocked(Math.random).mockReturnValue(0.9);
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('simulated_failure');
    });

    it('deve garantir que error não existe quando success=true', async () => {
      vi.mocked(Math.random).mockReturnValue(0.5);
      
      const result = await sendWhatsAppInvite('+5511999999999', 'template_intro');
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
