/**
 * Database Wrapper - Firestore com fallback em memória para desenvolvimento local.
 * 
 * Garante que o backend funcione mesmo sem credenciais Firebase válidas,
 * útil para testes E2E e desenvolvimento local.
 */

const admin = require('firebase-admin');

// In-memory storage para fallback
const memoryStore = {
  collections: new Map(),
};

/**
 * Cria helpers para FieldValue baseado no modo (Firestore ou Memória)
 */
function createFieldValueHelpers(useMemory) {
  return {
    increment: (n) => {
      if (!useMemory && admin && admin.firestore && admin.firestore.FieldValue) {
        return admin.firestore.FieldValue.increment(n);
      }
      // Em memória, retornamos um marcador especial
      return { _type: 'increment', _value: n };
    },
    
    serverTimestamp: () => {
      if (!useMemory && admin && admin.firestore && admin.firestore.FieldValue) {
        return admin.firestore.FieldValue.serverTimestamp();
      }
      // Em memória, retornamos um Date real
      return { _type: 'timestamp', _value: new Date() };
    },
    
    arrayUnion: (...elements) => {
      if (!useMemory && admin && admin.firestore && admin.firestore.FieldValue) {
        return admin.firestore.FieldValue.arrayUnion(...elements);
      }
      return { _type: 'arrayUnion', _value: elements };
    },
    
    arrayRemove: (...elements) => {
      if (!useMemory && admin && admin.firestore && admin.firestore.FieldValue) {
        return admin.firestore.FieldValue.arrayRemove(...elements);
      }
      return { _type: 'arrayRemove', _value: elements };
    }
  };
}

// Exporta versão global (detecta automaticamente o modo)
const fieldValueHelpers = {
  increment: (n) => {
    if (admin && admin.firestore && admin.firestore.FieldValue) {
      return admin.firestore.FieldValue.increment(n);
    }
    return { _type: 'increment', _value: n };
  },
  
  serverTimestamp: () => {
    if (admin && admin.firestore && admin.firestore.FieldValue) {
      return admin.firestore.FieldValue.serverTimestamp();
    }
    return { _type: 'timestamp', _value: new Date() };
  },
  
  arrayUnion: (...elements) => {
    if (admin && admin.firestore && admin.firestore.FieldValue) {
      return admin.firestore.FieldValue.arrayUnion(...elements);
    }
    return { _type: 'arrayUnion', _value: elements };
  },
  
  arrayRemove: (...elements) => {
    if (admin && admin.firestore && admin.firestore.FieldValue) {
      return admin.firestore.FieldValue.arrayRemove(...elements);
    }
    return { _type: 'arrayRemove', _value: elements };
  }
};

/**
 * Processa valores especiais (increment, timestamp) em modo memória
 */
function processSpecialValues(data, existingData = {}) {
  const result = { ...existingData };
  
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && value._type) {
      switch (value._type) {
        case 'increment':
          result[key] = (existingData[key] || 0) + value._value;
          break;
        case 'timestamp':
          // Garantir Date real em memória
          result[key] = value._value instanceof Date ? value._value : new Date();
          break;
        case 'arrayUnion':
          result[key] = [...new Set([...(existingData[key] || []), ...value._value])];
          break;
        case 'arrayRemove':
          result[key] = (existingData[key] || []).filter(item => !value._value.includes(item));
          break;
        default:
          result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Memory Document Reference
 */
class MemoryDocumentReference {
  constructor(collectionName, docId) {
    this.collectionName = collectionName;
    this.docId = docId;
    // Expor .id como getter para compatibilidade com Firestore
    this.id = docId;
  }
  
  async get() {
    const collection = memoryStore.collections.get(this.collectionName) || new Map();
    const data = collection.get(this.docId);
    
    return {
      exists: !!data,
      id: this.docId,
      data: () => data || null,
      ref: this,
    };
  }
  
  async set(data, options = {}) {
    let collection = memoryStore.collections.get(this.collectionName);
    if (!collection) {
      collection = new Map();
      memoryStore.collections.set(this.collectionName, collection);
    }
    
    if (options.merge) {
      const existing = collection.get(this.docId) || {};
      const merged = processSpecialValues(data, existing);
      collection.set(this.docId, merged);
    } else {
      const processed = processSpecialValues(data);
      collection.set(this.docId, processed);
    }
    
    return this;
  }
  
  async update(data) {
    const collection = memoryStore.collections.get(this.collectionName) || new Map();
    const existing = collection.get(this.docId) || {};
    const updated = processSpecialValues(data, existing);
    collection.set(this.docId, updated);
    return this;
  }
  
  async delete() {
    const collection = memoryStore.collections.get(this.collectionName);
    if (collection) {
      collection.delete(this.docId);
    }
    return this;
  }
}

/**
 * Memory Query
 */
class MemoryQuery {
  constructor(collectionName, filters = []) {
    this.collectionName = collectionName;
    this.filters = filters;
    this._limitCount = null;
    this._orderByField = null;
    this._orderByDirection = 'asc';
  }
  
  where(field, operator, value) {
    return new MemoryQuery(this.collectionName, [
      ...this.filters,
      { field, operator, value }
    ]);
  }
  
  limit(count) {
    const query = new MemoryQuery(this.collectionName, this.filters);
    query._limitCount = count;
    query._orderByField = this._orderByField;
    query._orderByDirection = this._orderByDirection;
    return query;
  }
  
  orderBy(field, direction = 'asc') {
    const query = new MemoryQuery(this.collectionName, this.filters);
    query._limitCount = this._limitCount;
    query._orderByField = field;
    query._orderByDirection = direction;
    return query;
  }
  
  async get() {
    const collection = memoryStore.collections.get(this.collectionName) || new Map();
    let results = Array.from(collection.entries()).map(([id, data]) => ({
      id,
      data: () => data,
      exists: true,
      ref: new MemoryDocumentReference(this.collectionName, id),
    }));
    
    // Aplicar filtros
    for (const filter of this.filters) {
      results = results.filter(doc => {
        const data = doc.data();
        const fieldValue = data[filter.field];
        
        switch (filter.operator) {
          case '==': return fieldValue === filter.value;
          case '!=': return fieldValue !== filter.value;
          case '<': return fieldValue < filter.value;
          case '<=': return fieldValue <= filter.value;
          case '>': return fieldValue > filter.value;
          case '>=': return fieldValue >= filter.value;
          case 'in': return filter.value.includes(fieldValue);
          case 'array-contains': return Array.isArray(fieldValue) && fieldValue.includes(filter.value);
          default: return true;
        }
      });
    }
    
    // Aplicar ordenação
    if (this._orderByField) {
      results.sort((a, b) => {
        const aVal = a.data()[this._orderByField];
        const bVal = b.data()[this._orderByField];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this._orderByDirection === 'desc' ? -comparison : comparison;
      });
    }
    
    // Aplicar limit
    if (this._limitCount) {
      results = results.slice(0, this._limitCount);
    }
    
    return {
      docs: results,
      empty: results.length === 0,
      size: results.length,
    };
  }
}

/**
 * Memory Collection Reference
 */
class MemoryCollectionReference extends MemoryQuery {
  constructor(collectionName) {
    super(collectionName, []);
  }
  
  doc(docId) {
    // Se docId não for fornecido, gerar um ID automático
    const id = docId || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new MemoryDocumentReference(this.collectionName, id);
  }
  
  async add(data) {
    const docId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docRef = this.doc(docId);
    await docRef.set(data);
    return docRef;
  }
}

/**
 * Cria wrapper de DB que usa Firestore real ou fallback em memória
 * @param {boolean} forceMemory - Forçar uso de memória (útil para testes)
 */
function createDbWrapper(forceMemory = false) {
  let firestoreDb = null;
  let useMemory = forceMemory;
  
  // Forçar modo memória se não houver Project ID configurado
  const hasProjectId = process.env.GOOGLE_CLOUD_PROJECT || 
                      process.env.GCLOUD_PROJECT || 
                      process.env.GCP_PROJECT;
  
  if (forceMemory) {
    console.warn('[DB] ⚠️  Modo memória forçado para testes');
    useMemory = true;
  } else if (!hasProjectId) {
    console.warn('[DB] ⚠️  No Google Cloud Project ID found - usando armazenamento em memória');
    useMemory = true;
  } else {
    try {
      if (admin.apps && admin.apps.length > 0) {
        firestoreDb = admin.firestore();
        console.log('[DB] ✅ Firestore conectado com sucesso');
      } else {
        throw new Error('Firebase Admin não inicializado');
      }
    } catch (error) {
      console.warn('[DB] ⚠️  Firestore indisponível - usando armazenamento em memória');
      console.warn('[DB] Motivo:', error.message);
      useMemory = true;
    }
  }
  
  // Cria helpers específicos para este modo
  const contextualHelpers = createFieldValueHelpers(useMemory);
  
  return {
    collection: (name) => {
      if (useMemory) {
        return new MemoryCollectionReference(name);
      }
      return firestoreDb.collection(name);
    },
    
    isMemoryMode: () => useMemory,
    
    // Retorna helpers contextualizados para este modo
    fieldValue: contextualHelpers,
    
    // Limpar memória (útil para testes)
    _clearMemory: () => {
      if (useMemory) {
        memoryStore.collections.clear();
        console.log('[DB] Memória limpa');
      }
    },
    
    // Exportar dados da memória (debug)
    _exportMemory: () => {
      if (useMemory) {
        const exported = {};
        for (const [collName, collData] of memoryStore.collections.entries()) {
          exported[collName] = Object.fromEntries(collData);
        }
        return exported;
      }
      return null;
    }
  };
}

module.exports = {
  createDbWrapper,
  fieldValueHelpers,
};
