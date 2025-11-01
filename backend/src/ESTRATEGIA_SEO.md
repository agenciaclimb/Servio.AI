# 📈 Estratégia de SEO - SERVIO.AI

**Objetivo:** Posicionar a plataforma SERVIO.AI na primeira página do Google para palavras-chave transacionais e informacionais, atraindo tanto clientes quanto prestadores de serviço de forma orgânica.

---

## 1. Pilar de Conteúdo (On-Page SEO)

### 1.1. Páginas de Categoria (`/servicos/:categoria/:localidade`)

- **Estratégia:** Criar a melhor página de destino para cada serviço em cada cidade. O conteúdo é gerado por IA para ser rico e relevante.
- **Aprimoramentos:** Incluir seções sobre "Preço Médio", "Serviços Comuns" e "Dicas ao Contratar" para aumentar a autoridade e o tempo de permanência.

### 1.2. Perfis Públicos de Prestadores (`/provider/:id`)

- **Estratégia:** Transformar cada perfil em um micro-site otimizado, destacando especialidades, avaliações e portfólio.
- **Aprimoramentos:** Usar IA para gerar `seoTitle`, `metaDescription` e um resumo das avaliações.

### 1.3. Blog / Central de Conteúdo (Futuro)

- **Estratégia:** Capturar tráfego informacional com artigos que respondem a dúvidas comuns dos usuários (ex: "Como saber se preciso de um eletricista?").
- **Implementação:** Criar uma nova seção no site e um endpoint de IA para gerar rascunhos de artigos.

---

## 2. Pilar Técnico (Technical SEO)

### 2.1. Dados Estruturados (Schema.org)

- **Estratégia:** "Etiquetar" nosso conteúdo para que os mecanismos de busca o entendam perfeitamente, gerando rich snippets (estrelas de avaliação, FAQs, etc.) nos resultados.
- **Implementação:** Adicionar scripts JSON-LD nas páginas de Categoria e Perfil usando os schemas `LocalBusiness`, `Service`, `Review` e `FAQPage`.

### 2.2. Sitemap Dinâmico (`/sitemap.xml`)

- **Estratégia:** Fornecer ao Google um mapa atualizado de todas as nossas páginas importantes para garantir uma indexação rápida e completa.
- **Implementação:** Um endpoint no backend gera o `sitemap.xml` dinamicamente, listando todas as páginas de categoria e perfis de prestadores verificados.

### 2.3. Performance (Core Web Vitals)

- **Estratégia:** Garantir que o site seja extremamente rápido, especialmente em dispositivos móveis, pois a velocidade é um fator de ranqueamento.
- **Implementação:** Otimização contínua de imagens, code splitting e lazy loading de componentes.

---

## 3. Pilar de Autoridade (Local e Off-Page SEO)

### 3.1. Google Business Profile (Externo)

- **Estratégia:** Criar e otimizar um perfil para a SERVIO.AI no Google Business Profile para aparecer no "map pack" para buscas locais.

### 3.2. Link Building (Futuro)

- **Estratégia:** Obter links de outros sites relevantes (blogs de decoração, fóruns de construção, etc.) para aumentar a autoridade do nosso domínio.

---

## Plano de Ação Imediato

1.  [✅] **Aprimorar Conteúdo das Páginas de Categoria:** Refinar o prompt da IA para gerar conteúdo mais rico.
2.  [✅] **Implementar Sitemap Dinâmico:** Criar o endpoint `/sitemap.xml` no backend.
3.  [⏳] **Adicionar Dados Estruturados:** Iniciar a implementação do schema `FAQPage` e `Service` nas páginas de categoria.
