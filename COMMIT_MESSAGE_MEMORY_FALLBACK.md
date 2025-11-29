# Commit Message Template

## feat(backend): implementar sistema de fallback em memória

### Descrição

Implementa sistema robusto de fallback em memória que permite desenvolvimento local sem credenciais Firebase. O backend detecta automaticamente a ausência de Project ID do Google Cloud e usa armazenamento Map-based compatível com a API do Firestore.

### Mudanças Principais

**Novo Arquivo: backend/src/dbWrapper.js (314 linhas)**

- `createDbWrapper()`: Factory que detecta modo (firestore/memory)
- `MemoryDocumentReference`: CRUD completo em documentos
- `MemoryQuery`: Suporte a where(), limit(), orderBy()
- `MemoryCollectionReference`: Gerenciamento de coleções
- `fieldValueHelpers`: increment, serverTimestamp, arrayUnion, arrayRemove
- Geração automática de IDs quando doc() chamado sem argumento
- Propriedade .id exposta para compatibilidade

**Modificado: backend/src/index.js**

- 18 substituições: admin.firestore.FieldValue → fieldValueHelpers
- IPv4 binding (0.0.0.0:8081) para evitar problemas de rede
- Heartbeat logs para manter processo ativo
- SIGTERM handlers para graceful shutdown
- Adicionado 4º usuário E2E: prospector

**Novo: Development Endpoints (NODE_ENV !== 'production')**

- POST /dev/seed-e2e-users: Cria 4 usuários de teste
  - e2e-cliente@servio.ai (cliente)
  - e2e-prestador@servio.ai (prestador com specialties)
  - admin@servio.ai (admin)
  - e2e-prospector@servio.ai (prospector com stats)
- GET /dev/db-status: Retorna modo e dump completo de dados

**Novo: GUIA_DESENVOLVIMENTO_LOCAL.md**

- Quick start em 5 minutos
- Exemplos de uso de todos os endpoints
- Troubleshooting comum
- Limitações do modo memória

**Atualizado: DOCUMENTO_MESTRE_SERVIO_AI.md**

- Nova seção completa sobre Sistema de Fallback
- Exemplos de código e uso
- Benefícios e limitações documentados
- Status atualizado com 4 usuários E2E

**Novo: RESUMO_SESSAO_MEMORY_FALLBACK_28NOV.md**

- Documentação completa da sessão de desenvolvimento
- Validações realizadas
- Estatísticas e métricas
- Próximos passos

### Validações

✅ Backend inicia em modo memória quando sem Project ID  
✅ 4 usuários E2E criados com sucesso  
✅ IDs automáticos gerados corretamente  
✅ Jobs criados via POST /api/jobs com IDs únicos  
✅ Propostas criadas via POST /proposals  
✅ API completamente funcional em modo memória  
✅ Health check responde corretamente  
✅ /dev/db-status retorna dados completos

### Benefícios

**Para Desenvolvedores:**

- Zero setup: rodar backend sem configurar Firebase
- Debugging fácil com /dev/db-status
- Testes locais sem dependencies

**Para CI/CD:**

- Sem secrets necessários
- Builds mais rápidos
- Menos complexidade

**Para o Projeto:**

- Onboarding simplificado
- Menos bugs
- Maior produtividade

### Breaking Changes

Nenhum. Sistema mantém compatibilidade total com Firestore real.

### Notas

- Dados em memória são voláteis (perdem-se ao reiniciar)
- Firebase Auth ainda requer configuração para login via interface
- Sistema recomendado apenas para development/testing

---

**Closes**: N/A (Feature nova)  
**Related**: #memoria-fallback, #dev-experience  
**Testing**: Manual validation - ver RESUMO_SESSAO_MEMORY_FALLBACK_28NOV.md
