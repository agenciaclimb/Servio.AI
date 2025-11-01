# 🗺️ Plano de Próximos Passos - Pós-MVP (v1.1)

Com o MVP (Minimum Viable Product) da plataforma SERVIO.AI concluído e pronto para o lançamento, esta fase se concentra em aprofundar as funcionalidades existentes, melhorar a experiência do usuário com base em feedback inicial e expandir as capacidades da plataforma.

---

## 1. Aprofundamento da Inteligência e Automação

**Objetivo:** Tornar a IA ainda mais proativa e indispensável para o usuário.

- **Notificações por Push/SMS:**
  - **O quê:** Integrar o Firebase Cloud Messaging (FCM) e/ou Twilio para enviar notificações críticas (novo job, mensagem, alerta de "a caminho") diretamente para o celular do usuário, mesmo com o app fechado.
  - **Por quê:** Aumenta drasticamente a velocidade de resposta e o engajamento.

- **Assistente de Resposta no Chat:**
  - **O quê:** Adicionar um botão "Sugestão de Resposta da IA" no chat. A IA analisará a última mensagem recebida e sugerirá 2-3 respostas rápidas e profissionais para o usuário.
  - **Por quê:** Reduz o tempo de digitação e ajuda os prestadores a manterem uma comunicação profissional.

- **Análise de Sentimento do Chat:**
  - **O quê:** Criar uma Cloud Function que, periodicamente, analisa o sentimento das conversas. Se detectar frustração ou negatividade, pode gerar um alerta de "risco de disputa" para o administrador.
  - **Por quê:** Permite uma mediação proativa antes mesmo que uma disputa formal seja aberta.

---

## 2. Engajamento e Retenção de Usuários

**Objetivo:** Criar um ecossistema onde os usuários queiram permanecer e interagir.

- **Sistema de Níveis e Medalhas para Prestadores:**
  - **O quê:** Criar um sistema de gamificação onde prestadores ganham pontos e medalhas por completar jobs, receber boas avaliações e manter o perfil atualizado. Níveis mais altos (ex: "Prestador Ouro") podem ter taxas de serviço menores ou destaque na busca.
  - **Por quê:** Incentiva a qualidade e a participação contínua na plataforma.

- **Histórico de Manutenção nos Itens:**
  - **O quê:** Implementar a tela de detalhes do item (em "Meus Itens"), que exibe um histórico de todos os serviços da SERVIO.AI realizados naquele item.
  - **Por quê:** Transforma a plataforma em um "manual digital" para os bens do cliente, aumentando a retenção.

---

## 3. Expansão e Monetização

**Objetivo:** Explorar novas fontes de receita e expandir o alcance da plataforma.

- **Plano "Destaque" para Prestadores:**
  - **O quê:** Criar um plano de assinatura mensal opcional onde prestadores pagam para ter seu perfil destacado nos resultados de busca e no matching da IA.
  - **Por quê:** Cria uma nova fonte de receita recorrente.

- **Páginas de Categoria Otimizadas para SEO:**
  - **O quê:** Criar páginas públicas para cada categoria de serviço (ex: `/servicos/eletricista/sao-paulo`), com conteúdo gerado por IA, para atrair tráfego orgânico do Google.
  - **Por quê:** Estratégia de aquisição de clientes de baixo custo e alta escalabilidade.

---

## 4. Robustez e Escalabilidade Técnica

**Objetivo:** Garantir que a plataforma seja segura, rápida e confiável à medida que cresce.

- **Testes E2E Automatizados:**
  - **O quê:** Implementar os cenários do `PLANO_DE_TESTES_E2E.md` usando uma framework como Cypress ou Playwright. Integrar a execução desses testes no workflow de CI/CD.
  - **Por quê:** Previne regressões e garante a estabilidade da plataforma a cada novo deploy.

- **Dashboard de Métricas para o Admin:**
  - **O quê:** Criar um dashboard visual (com gráficos) para o administrador, mostrando métricas chave em tempo real: novos usuários, jobs criados, receita, etc.
  - **Por quê:** Permite a tomada de decisões de negócio baseada em dados.

  ***

  ## 5. Diretrizes para Agentes (Gemini) – Correções e Evoluções

  Estas regras garantem que qualquer agente (IA ou humano) evolua o sistema sem quebrar padrões, segurança ou pipelines.
  1. Fonte da verdade e rastreabilidade
  - Registrar toda mudança no `doc/DOCUMENTO_MESTRE_SERVIO_AI.md` via `#update_log` com data/hora, arquivos afetados e resultado (Build/Lint/Tests: PASS/FAIL).
  - Atualizar `TODO.md` quando criar/fechar pendências.
  2. Segurança e segredos
  - Jamais commitar chaves/segredos. Usar `.env.local` (frontend) e segredos do GitHub/Cloud Run (backend). Atualizar `.env.example` quando criar novas variáveis.
  - Não imprimir valores sensíveis em logs ou testes.
  3. Qualidade e CI
  - Executar localmente: `npm run test:all`, `npm run lint`, `npm run typecheck`. Corrigir antes de abrir PR.
  - Respeitar `.eslintignore` e estilos existentes. Não reformatar em massa fora do escopo.
  4. Backend
  - Manter `backend/src/index.js` em CommonJS e seguir o padrão de Injeção de Dependência (`createApp({ db, storage, stripe })`).
  - Nunca inicializar serviços reais nos testes; usar mocks. Adicionar testes quando alterar comportamento público.
  5. Frontend
  - Usar `firebaseConfig.ts` e variáveis `VITE_*`. Nunca hardcode de chaves. Evitar acesso direto ao window em libs compartilhadas.
  - Quando alterar comportamento de UI, adicionar pelo menos um teste de fumaça.
  6. Pagamentos (Stripe)
  - Manter simulações/guardas até que segredos e contas conectadas existam. Implementar `Connect` (payout/transfer) como tarefa separada com testes e feature flag.
  7. PRs e comunicação
  - Trabalhar em branches feature/\*, abrir PR com título e descrição clara do escopo.
  - Comentar status (tests locais, riscos, passos de rollout). Não mesclar sem CI verde.
  8. Definition of Done (para qualquer tarefa)
  - Código + testes (feliz e 1-2 arestas) + docs (README ou Documento Mestre) + variáveis documentadas + CI verde.
