import { describe, it, expect } from 'vitest';
import { fingerprint, isDuplicate, filterDuplicates, type ProspectMinimal } from '../../src/prospector/dedupe';

describe('Prospector Dedupe', () => {
  describe('fingerprint', () => {
    it('deve gerar fingerprint com email, phone, name e company', () => {
      const prospect: ProspectMinimal = {
        email: 'test@example.com',
        phone: '+55 (11) 99999-9999',
        name: 'João Silva',
        company: 'ACME Corp',
      };
      const fp = fingerprint(prospect);
      expect(fp).toMatch(/^fp_\d+$/);
    });

    it('deve gerar fingerprints iguais para prospects idênticos', () => {
      const p1: ProspectMinimal = {
        email: 'test@example.com',
        phone: '11999999999',
        name: 'João',
      };
      const p2: ProspectMinimal = {
        email: 'test@example.com',
        phone: '11999999999',
        name: 'João',
      };
      expect(fingerprint(p1)).toBe(fingerprint(p2));
    });

    it('deve normalizar email (lowercase, trim)', () => {
      const p1: ProspectMinimal = { email: '  Test@EXAMPLE.com  ' };
      const p2: ProspectMinimal = { email: 'test@example.com' };
      expect(fingerprint(p1)).toBe(fingerprint(p2));
    });

    it('deve normalizar phone (remove formatação)', () => {
      const p1: ProspectMinimal = { phone: '+55 (11) 99999-9999' };
      const p2: ProspectMinimal = { phone: '5511999999999' };
      expect(fingerprint(p1)).toBe(fingerprint(p2));
    });

    it('deve normalizar name (lowercase, trim, espaços únicos)', () => {
      const p1: ProspectMinimal = { name: '  João   Silva  ' };
      const p2: ProspectMinimal = { name: 'joão silva' };
      expect(fingerprint(p1)).toBe(fingerprint(p2));
    });

    it('deve normalizar company (lowercase, trim)', () => {
      const p1: ProspectMinimal = { company: '  ACME CORP  ' };
      const p2: ProspectMinimal = { company: 'acme corp' };
      expect(fingerprint(p1)).toBe(fingerprint(p2));
    });

    it('deve lidar com campos vazios', () => {
      const prospect: ProspectMinimal = {};
      const fp = fingerprint(prospect);
      expect(fp).toMatch(/^fp_\d+$/);
    });

    it('deve lidar com campos null', () => {
      const prospect: ProspectMinimal = {
        email: null,
        phone: null,
        name: null,
        company: null,
      };
      const fp = fingerprint(prospect);
      expect(fp).toMatch(/^fp_\d+$/);
    });

    it('deve gerar fingerprints diferentes para prospects diferentes', () => {
      const p1: ProspectMinimal = { email: 'test1@example.com' };
      const p2: ProspectMinimal = { email: 'test2@example.com' };
      expect(fingerprint(p1)).not.toBe(fingerprint(p2));
    });

    it('deve usar apenas campos não vazios no fingerprint', () => {
      const p1: ProspectMinimal = { email: 'test@example.com', phone: '' };
      const p2: ProspectMinimal = { email: 'test@example.com' };
      expect(fingerprint(p1)).toBe(fingerprint(p2));
    });

    it('deve remover código de país do phone (últimos 11 dígitos)', () => {
      const p1: ProspectMinimal = { phone: '+55 11 99999-9999' }; // 5511999999999 → 11999999999
      const p2: ProspectMinimal = { phone: '11999999999' };
      expect(fingerprint(p1)).toBe(fingerprint(p2));
    });

    it('deve lidar com phone com mais de 11 dígitos', () => {
      const p1: ProspectMinimal = { phone: '555511999999999' }; // 15 digits → last 11
      const p2: ProspectMinimal = { phone: '11999999999' };
      expect(fingerprint(p1)).toBe(fingerprint(p2));
    });

    it('deve gerar hash numérico positivo', () => {
      const prospect: ProspectMinimal = { email: 'test@example.com' };
      const fp = fingerprint(prospect);
      const hash = fp.replace('fp_', '');
      expect(parseInt(hash, 10)).toBeGreaterThanOrEqual(0);
    });

    it('deve usar Math.abs para garantir hash positivo', () => {
      const prospect: ProspectMinimal = { name: 'Ω' }; // char que pode gerar hash negativo
      const fp = fingerprint(prospect);
      expect(fp).toMatch(/^fp_\d+$/);
      expect(fp).not.toContain('-');
    });
  });

  describe('isDuplicate', () => {
    describe('Email Match', () => {
      it('deve detectar duplicata por email idêntico', () => {
        const a: ProspectMinimal = { email: 'test@example.com' };
        const b: ProspectMinimal = { email: 'test@example.com' };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('deve normalizar emails antes de comparar', () => {
        const a: ProspectMinimal = { email: 'Test@EXAMPLE.com' };
        const b: ProspectMinimal = { email: 'test@example.com' };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('não deve considerar duplicata se email diferente', () => {
        const a: ProspectMinimal = { email: 'test1@example.com' };
        const b: ProspectMinimal = { email: 'test2@example.com' };
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('não deve considerar duplicata se email vazio', () => {
        const a: ProspectMinimal = { email: '' };
        const b: ProspectMinimal = { email: '' };
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('não deve considerar duplicata se email null', () => {
        const a: ProspectMinimal = { email: null };
        const b: ProspectMinimal = { email: null };
        expect(isDuplicate(a, b)).toBe(false);
      });
    });

    describe('Phone Match', () => {
      it('deve detectar duplicata por phone idêntico', () => {
        const a: ProspectMinimal = { phone: '11999999999' };
        const b: ProspectMinimal = { phone: '11999999999' };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('deve normalizar phones antes de comparar', () => {
        const a: ProspectMinimal = { phone: '+55 (11) 99999-9999' };
        const b: ProspectMinimal = { phone: '5511999999999' };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('não deve considerar duplicata se phone diferente', () => {
        const a: ProspectMinimal = { phone: '11999999999' };
        const b: ProspectMinimal = { phone: '11888888888' };
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('não deve considerar duplicata se phone vazio', () => {
        const a: ProspectMinimal = { phone: '' };
        const b: ProspectMinimal = { phone: '' };
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('não deve considerar duplicata se phone null', () => {
        const a: ProspectMinimal = { phone: null };
        const b: ProspectMinimal = { phone: null };
        expect(isDuplicate(a, b)).toBe(false);
      });
    });

    describe('Name + Company Match', () => {
      it('deve detectar duplicata por name + company', () => {
        const a: ProspectMinimal = { name: 'João Silva', company: 'ACME Corp' };
        const b: ProspectMinimal = { name: 'João Silva', company: 'ACME Corp' };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('deve normalizar name e company antes de comparar', () => {
        const a: ProspectMinimal = { name: 'JOÃO SILVA', company: '  acme corp  ' };
        const b: ProspectMinimal = { name: 'joão silva', company: 'ACME Corp' };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('não deve considerar duplicata se name diferente', () => {
        const a: ProspectMinimal = { name: 'João Silva', company: 'ACME Corp' };
        const b: ProspectMinimal = { name: 'Maria Silva', company: 'ACME Corp' };
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('não deve considerar duplicata se company diferente', () => {
        const a: ProspectMinimal = { name: 'João Silva', company: 'ACME Corp' };
        const b: ProspectMinimal = { name: 'João Silva', company: 'XYZ Inc' };
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('não deve considerar duplicata se falta company em um', () => {
        const a: ProspectMinimal = { name: 'João Silva', company: 'ACME Corp' };
        const b: ProspectMinimal = { name: 'João Silva' };
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('não deve considerar duplicata se name vazio', () => {
        const a: ProspectMinimal = { name: '', company: 'ACME Corp' };
        const b: ProspectMinimal = { name: '', company: 'ACME Corp' };
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('não deve considerar duplicata se ambos company vazias', () => {
        const a: ProspectMinimal = { name: 'João Silva', company: '' };
        const b: ProspectMinimal = { name: 'João Silva', company: '' };
        expect(isDuplicate(a, b)).toBe(false);
      });
    });

    describe('Priority Logic', () => {
      it('deve priorizar email match sobre name+company', () => {
        const a: ProspectMinimal = {
          email: 'test@example.com',
          name: 'João Silva',
          company: 'ACME',
        };
        const b: ProspectMinimal = {
          email: 'test@example.com',
          name: 'Maria Silva',
          company: 'XYZ',
        };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('deve priorizar phone match sobre name+company', () => {
        const a: ProspectMinimal = {
          phone: '11999999999',
          name: 'João Silva',
          company: 'ACME',
        };
        const b: ProspectMinimal = {
          phone: '11999999999',
          name: 'Maria Silva',
          company: 'XYZ',
        };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('deve considerar duplicata se email OU phone match', () => {
        const a: ProspectMinimal = { email: 'test@example.com', phone: '11999999999' };
        const b: ProspectMinimal = { email: 'test@example.com', phone: '11888888888' };
        expect(isDuplicate(a, b)).toBe(true); // email matches
      });
    });

    describe('Edge Cases', () => {
      it('não deve considerar duplicata se ambos vazios', () => {
        const a: ProspectMinimal = {};
        const b: ProspectMinimal = {};
        expect(isDuplicate(a, b)).toBe(false);
      });

      it('deve lidar com espaços múltiplos no name', () => {
        const a: ProspectMinimal = { name: 'João   Silva', company: 'ACME' };
        const b: ProspectMinimal = { name: 'João Silva', company: 'ACME' };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('deve lidar com acentos e caracteres especiais', () => {
        const a: ProspectMinimal = { email: 'josé@example.com' };
        const b: ProspectMinimal = { email: 'josé@example.com' };
        expect(isDuplicate(a, b)).toBe(true);
      });

      it('deve considerar duplicata mesmo com campos extras diferentes', () => {
        const a: ProspectMinimal = { id: '1', email: 'test@example.com' };
        const b: ProspectMinimal = { id: '2', email: 'test@example.com' };
        expect(isDuplicate(a, b)).toBe(true);
      });
    });
  });

  describe('filterDuplicates', () => {
    it('deve retornar unique vazio quando incoming vazio', () => {
      const existing: ProspectMinimal[] = [{ email: 'test@example.com' }];
      const incoming: ProspectMinimal[] = [];
      const result = filterDuplicates(existing, incoming);
      expect(result.unique).toHaveLength(0);
      expect(result.dupes).toHaveLength(0);
    });

    it('deve retornar todos como unique quando existing vazio', () => {
      const existing: ProspectMinimal[] = [];
      const incoming: ProspectMinimal[] = [
        { email: 'test1@example.com' },
        { email: 'test2@example.com' },
      ];
      const result = filterDuplicates(existing, incoming);
      expect(result.unique).toHaveLength(2);
      expect(result.dupes).toHaveLength(0);
    });

    it('deve detectar duplicata por fingerprint', () => {
      const existing: ProspectMinimal[] = [{ email: 'test@example.com' }];
      const incoming: ProspectMinimal[] = [{ email: 'test@example.com' }];
      const result = filterDuplicates(existing, incoming);
      expect(result.unique).toHaveLength(0);
      expect(result.dupes).toHaveLength(1);
      expect(result.dupes[0].email).toBe('test@example.com');
    });

    it('deve filtrar múltiplas duplicatas', () => {
      const existing: ProspectMinimal[] = [
        { email: 'test1@example.com' },
        { email: 'test2@example.com' },
      ];
      const incoming: ProspectMinimal[] = [
        { email: 'test1@example.com' }, // dupe
        { email: 'test2@example.com' }, // dupe
        { email: 'test3@example.com' }, // unique
      ];
      const result = filterDuplicates(existing, incoming);
      expect(result.unique).toHaveLength(1);
      expect(result.dupes).toHaveLength(2);
      expect(result.unique[0].email).toBe('test3@example.com');
    });

    it('deve usar normalização de fingerprint', () => {
      const existing: ProspectMinimal[] = [{ email: 'Test@EXAMPLE.com' }];
      const incoming: ProspectMinimal[] = [{ email: 'test@example.com' }];
      const result = filterDuplicates(existing, incoming);
      expect(result.dupes).toHaveLength(1);
      expect(result.unique).toHaveLength(0);
    });

    it('deve preservar prospects únicos', () => {
      const existing: ProspectMinimal[] = [{ email: 'existing@example.com' }];
      const incoming: ProspectMinimal[] = [
        { email: 'new1@example.com' },
        { email: 'new2@example.com' },
      ];
      const result = filterDuplicates(existing, incoming);
      expect(result.unique).toHaveLength(2);
      expect(result.dupes).toHaveLength(0);
    });

    it('deve manter ordem dos prospects', () => {
      const existing: ProspectMinimal[] = [];
      const incoming: ProspectMinimal[] = [
        { email: 'test1@example.com' },
        { email: 'test2@example.com' },
        { email: 'test3@example.com' },
      ];
      const result = filterDuplicates(existing, incoming);
      expect(result.unique[0].email).toBe('test1@example.com');
      expect(result.unique[1].email).toBe('test2@example.com');
      expect(result.unique[2].email).toBe('test3@example.com');
    });

    it('deve lidar com prospects complexos', () => {
      const existing: ProspectMinimal[] = [
        {
          id: '1',
          email: 'test@example.com',
          phone: '11999999999',
          name: 'João Silva',
          company: 'ACME',
        },
      ];
      const incoming: ProspectMinimal[] = [
        {
          id: '2',
          email: 'Test@EXAMPLE.com',
          phone: '+55 11 99999-9999',
          name: 'joão silva',
          company: 'acme',
        },
      ];
      const result = filterDuplicates(existing, incoming);
      // fingerprints devem ser iguais devido a normalização (email, phone, name, company todos normalizados)
      expect(result.dupes).toHaveLength(1);
    });

    it('deve retornar estrutura correta com unique e dupes', () => {
      const existing: ProspectMinimal[] = [];
      const incoming: ProspectMinimal[] = [];
      const result = filterDuplicates(existing, incoming);
      expect(result).toHaveProperty('unique');
      expect(result).toHaveProperty('dupes');
      expect(Array.isArray(result.unique)).toBe(true);
      expect(Array.isArray(result.dupes)).toBe(true);
    });

    it('deve usar Map para indexação eficiente', () => {
      const existing: ProspectMinimal[] = Array.from({ length: 1000 }, (_, i) => ({
        email: `test${i}@example.com`,
      }));
      const incoming: ProspectMinimal[] = [{ email: 'test500@example.com' }];
      const result = filterDuplicates(existing, incoming);
      expect(result.dupes).toHaveLength(1);
      expect(result.unique).toHaveLength(0);
    });

    it('deve lidar com múltiplos incoming duplicando mesmo existing', () => {
      const existing: ProspectMinimal[] = [{ email: 'test@example.com' }];
      const incoming: ProspectMinimal[] = [
        { email: 'test@example.com' },
        { email: 'test@example.com' },
        { email: 'test@example.com' },
      ];
      const result = filterDuplicates(existing, incoming);
      expect(result.dupes).toHaveLength(3); // todos são duplicatas do existing
      expect(result.unique).toHaveLength(0);
    });

    it('deve permitir duplicatas dentro de incoming (só checa contra existing)', () => {
      const existing: ProspectMinimal[] = [{ email: 'existing@example.com' }];
      const incoming: ProspectMinimal[] = [
        { email: 'new@example.com' },
        { email: 'new@example.com' }, // duplicata dentro de incoming, mas ambos são unique vs existing
      ];
      const result = filterDuplicates(existing, incoming);
      expect(result.unique).toHaveLength(2); // ambos são únicos vs existing
      expect(result.dupes).toHaveLength(0);
    });
  });

  describe('Integration', () => {
    it('deve usar mesma lógica de fingerprint em filterDuplicates e fingerprint()', () => {
      const prospect: ProspectMinimal = {
        email: 'test@example.com',
        phone: '11999999999',
        name: 'João Silva',
      };
      const fp = fingerprint(prospect);
      const existing: ProspectMinimal[] = [prospect];
      const incoming: ProspectMinimal[] = [prospect];
      const result = filterDuplicates(existing, incoming);
      expect(result.dupes).toHaveLength(1); // mesmo fingerprint
      expect(fp).toMatch(/^fp_\d+$/);
    });

    it('deve lidar com cenário completo de importação', () => {
      const existing: ProspectMinimal[] = [
        { id: '1', email: 'joao@example.com', name: 'João Silva' },
        { id: '2', email: 'maria@example.com', name: 'Maria Santos' },
        { id: '3', phone: '11999999999', name: 'Pedro Costa' },
      ];
      const incoming: ProspectMinimal[] = [
        { email: 'joao@example.com', name: 'João Silva' }, // dupe (email)
        { phone: '11999999999', name: 'Pedro Costa' }, // dupe (phone via fingerprint)
        { email: 'ana@example.com', name: 'Ana Lima' }, // unique
        { phone: '11888888888', name: 'Carlos Rocha' }, // unique
      ];
      const result = filterDuplicates(existing, incoming);
      expect(result.dupes).toHaveLength(2);
      expect(result.unique).toHaveLength(2);
    });
  });
});
