/**
 * Testes para o dbWrapper - Sistema de fallback em memória
 */

const { createDbWrapper, fieldValueHelpers } = require('../src/dbWrapper');

describe('dbWrapper - Memory Fallback System', () => {
  let db;

  beforeEach(() => {
    // Força modo memória para testes
    db = createDbWrapper(true);
    
    // Limpar dados entre testes
    if (db._clearMemory) {
      db._clearMemory();
    }
  });

  describe('Modo Memória', () => {
    it('deve detectar modo memória quando sem Project ID', () => {
      expect(db.isMemoryMode()).toBe(true);
    });

    it('deve ter métodos principais disponíveis', () => {
      expect(db.collection).toBeDefined();
      expect(db.isMemoryMode).toBeDefined();
      expect(db._clearMemory).toBeDefined();
      expect(db._exportMemory).toBeDefined();
    });
  });

  describe('Operações CRUD', () => {
    it('deve criar documento com set()', async () => {
      const docRef = db.collection('users').doc('user123');
      await docRef.set({ name: 'Test User', email: 'test@test.com' });
      
      const snapshot = await docRef.get();
      expect(snapshot.exists).toBe(true);
      expect(snapshot.data()).toEqual({ name: 'Test User', email: 'test@test.com' });
    });

    it('deve gerar ID automático quando doc() chamado sem argumento', () => {
      const docRef = db.collection('jobs').doc();
      expect(docRef.id).toBeDefined();
      expect(docRef.id).toMatch(/^auto_\d+_/);
    });

    it('deve atualizar documento com update()', async () => {
      const docRef = db.collection('users').doc('user123');
      await docRef.set({ name: 'Test User', score: 0 });
      
      await docRef.update({ score: 10 });
      
      const snapshot = await docRef.get();
      expect(snapshot.data().score).toBe(10);
      expect(snapshot.data().name).toBe('Test User');
    });

    it('deve fazer merge com set({ merge: true })', async () => {
      const docRef = db.collection('users').doc('user123');
      await docRef.set({ name: 'Test User', email: 'test@test.com' });
      
      await docRef.set({ score: 100 }, { merge: true });
      
      const snapshot = await docRef.get();
      expect(snapshot.data()).toEqual({
        name: 'Test User',
        email: 'test@test.com',
        score: 100
      });
    });

    it('deve deletar documento', async () => {
      const docRef = db.collection('users').doc('user123');
      await docRef.set({ name: 'Test User' });
      
      await docRef.delete();
      
      const snapshot = await docRef.get();
      expect(snapshot.exists).toBe(false);
    });

    it('deve adicionar documento com add()', async () => {
      const collRef = db.collection('jobs');
      const docRef = await collRef.add({ title: 'Test Job', budget: 100 });
      
      expect(docRef.id).toBeDefined();
      
      const snapshot = await docRef.get();
      expect(snapshot.exists).toBe(true);
      expect(snapshot.data().title).toBe('Test Job');
    });
  });

  describe('Queries', () => {
    beforeEach(async () => {
      // Popular dados para testes de query
      await db.collection('jobs').doc('job1').set({ title: 'Limpeza', status: 'aberto', budget: 100 });
      await db.collection('jobs').doc('job2').set({ title: 'Pintura', status: 'aberto', budget: 200 });
      await db.collection('jobs').doc('job3').set({ title: 'Reparos', status: 'fechado', budget: 150 });
    });

    it('deve filtrar com where()', async () => {
      const snapshot = await db.collection('jobs')
        .where('status', '==', 'aberto')
        .get();
      
      expect(snapshot.docs).toHaveLength(2);
      expect(snapshot.docs.every(doc => doc.data().status === 'aberto')).toBe(true);
    });

    it('deve limitar resultados com limit()', async () => {
      const snapshot = await db.collection('jobs').limit(2).get();
      
      expect(snapshot.docs).toHaveLength(2);
    });

    it('deve ordenar com orderBy()', async () => {
      const snapshot = await db.collection('jobs')
        .orderBy('budget', 'asc')
        .get();
      
      const budgets = snapshot.docs.map(doc => doc.data().budget);
      expect(budgets).toEqual([100, 150, 200]);
    });

    it('deve combinar where + orderBy + limit', async () => {
      const snapshot = await db.collection('jobs')
        .where('status', '==', 'aberto')
        .orderBy('budget', 'desc')
        .limit(1)
        .get();
      
      expect(snapshot.docs).toHaveLength(1);
      expect(snapshot.docs[0].data().budget).toBe(200);
    });
  });

  describe('fieldValueHelpers', () => {
    it('deve processar increment()', async () => {
      const docRef = db.collection('users').doc('user1');
      await docRef.set({ score: 10 });
      
      await docRef.update({ score: db.fieldValue.increment(5) });
      
      const snapshot = await docRef.get();
      expect(snapshot.data().score).toBe(15);
    });

    it('deve processar serverTimestamp()', async () => {
      const docRef = db.collection('events').doc('event1');
      await docRef.set({ createdAt: db.fieldValue.serverTimestamp() });
      
      const snapshot = await docRef.get();
      expect(snapshot.data().createdAt).toBeInstanceOf(Date);
    });

    it('deve processar arrayUnion()', async () => {
      const docRef = db.collection('users').doc('user1');
      await docRef.set({ tags: ['tag1'] });
      
      await docRef.update({ tags: db.fieldValue.arrayUnion('tag2', 'tag3') });
      
      const snapshot = await docRef.get();
      expect(snapshot.data().tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('deve processar arrayRemove()', async () => {
      const docRef = db.collection('users').doc('user1');
      await docRef.set({ tags: ['tag1', 'tag2', 'tag3'] });
      
      await docRef.update({ tags: db.fieldValue.arrayRemove('tag2') });
      
      const snapshot = await docRef.get();
      expect(snapshot.data().tags).toEqual(['tag1', 'tag3']);
    });
  });

  describe('Export e Debug', () => {
    it('deve exportar dados com _exportMemory()', async () => {
      await db.collection('users').doc('user1').set({ name: 'User 1' });
      await db.collection('users').doc('user2').set({ name: 'User 2' });
      await db.collection('jobs').doc('job1').set({ title: 'Job 1' });
      
      const exported = db._exportMemory();
      
      expect(exported).toHaveProperty('users');
      expect(exported).toHaveProperty('jobs');
      expect(Object.keys(exported.users)).toHaveLength(2);
      expect(Object.keys(exported.jobs)).toHaveLength(1);
    });

    it('deve limpar dados com _clearMemory()', async () => {
      await db.collection('users').doc('user1').set({ name: 'User 1' });
      
      db._clearMemory();
      
      const exported = db._exportMemory();
      expect(Object.keys(exported)).toHaveLength(0);
    });
  });

  describe('Comportamento do snapshot', () => {
    it('snapshot deve ter propriedade exists', async () => {
      const docRef = db.collection('users').doc('user1');
      await docRef.set({ name: 'User 1' });
      
      const snapshot = await docRef.get();
      expect(snapshot.exists).toBe(true);
      
      const nonExistent = await db.collection('users').doc('user999').get();
      expect(nonExistent.exists).toBe(false);
    });

    it('snapshot deve ter propriedade id', async () => {
      const docRef = db.collection('users').doc('user123');
      await docRef.set({ name: 'User' });
      
      const snapshot = await docRef.get();
      expect(snapshot.id).toBe('user123');
    });

    it('snapshot.docs deve ter map', async () => {
      await db.collection('users').doc('user1').set({ name: 'User 1' });
      await db.collection('users').doc('user2').set({ name: 'User 2' });
      
      const snapshot = await db.collection('users').get();
      const names = snapshot.docs.map(doc => doc.data().name);
      
      expect(names).toContain('User 1');
      expect(names).toContain('User 2');
    });
  });
});
