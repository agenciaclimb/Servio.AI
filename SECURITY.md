# Segurança e Resposta a Incidentes

Este projeto utiliza chaves para serviços de terceiros (GCP Gemini, Stripe, Firebase). Siga estas práticas para evitar vazamentos e responder a incidentes.

## Boas práticas

- Nunca commite `.env`, `.env.*` ou chaves reais. `.env.example` usa placeholders.
- Use variáveis de ambiente no Cloud Run e Secrets no GitHub.
- Evite allowlists amplas no Gitleaks; mantenha-as específicas a arquivos de documentação.
- Revise alertas de Secret Scanning (GitHub) e configure Push Protection quando disponível.

## Se uma chave vazar

1. Rotacione imediatamente

- GCP: APIs & Services → Credentials → API keys → selecione a chave → Regenerate key → Save.
- Stripe: Developers → API keys → Roll.

2. Restrinja uso

- GCP: em API key restrictions, limite a APIs necessárias (ex.: Generative Language API) e adicione restrições de aplicação (quando aplicável).

3. Remova do repositório

- Commit de limpeza: substitua a chave por placeholder e faça commit.
- Opcional (forte recomendação para repositórios públicos): reescreva histórico para remover a chave de commits antigos.
  - Opção rápida: BFG Repo-Cleaner
    - bfg --replace-text banned.txt
  - Opção oficial: git filter-repo (ou filter-branch)
    - git filter-repo --invert-paths --path DEPLOY_GCP_GUIDE.md # ou substituição via --replace-text
  - Forçar push: git push --force --all && git push --force --tags

4. Atualize ambientes

- Substitua a chave nos Secrets do GitHub e nas variáveis do Cloud Run.
- Faça novo deploy.

5. Audite

- Verifique Cloud Logging (APIs & Services → Credentials → Usage) e faturamento.
- Habilite alertas de orçamento.

## Verificação rápida

- git grep "AIza" # procura padrões de Google API key
- gitleaks detect --no-banner --redact

Se algum passo não estiver claro, abra um issue com o rótulo security e descreva o incidente (sem postar chaves).
