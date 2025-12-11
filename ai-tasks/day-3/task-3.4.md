# Task 3.4 — Implementar validação de Documento Mestre (parser)

ID: 3.4
Protocolo: v4.0

Descrição:
Parser para validar a estrutura e conteúdo do Documento Mestre v4.0.

Critérios de Aceitação:

- Parser implementado para validar Documento Mestre v4.0
- Parser verifica a estrutura do documento
- Parser verifica campos obrigatórios
- Parser valida os valores dos campos
- Testes unitários cobrem cenários de validação

Arquivos:

- Criar: `master_document/parser.ts`, `master_document/schema.json`, `master_document/parser.test.ts`
- Modificar: (nenhum)

Dependências: (nenhuma)
Esforço Estimado: 10h

Plano de Implementação:

1. Definir `schema.json` com seções obrigatórias e tipos
2. Implementar `parser.ts` para validar contra schema
3. Testes unitários com casos válidos e inválidos
4. Integrar parser ao pipeline local (npm script)
