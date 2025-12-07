# 🧪 Plano de Testes de Ponta a Ponta (E2E)

Este documento descreve os cenários de teste que simulam a jornada completa dos usuários na plataforma SERVIO.AI, garantindo que todos os componentes integrados funcionem corretamente antes do lançamento.

---

## Cenário 1: Jornada do Cliente (Fluxo Feliz)

**Objetivo:** Validar a experiência completa de um cliente, desde a solicitação de um serviço até a sua avaliação final.

**Passos:**

1.  **Busca Inteligente:** Acessar a página inicial e descrever uma necessidade na barra de busca (ex: "consertar vazamento na pia da cozinha").
2.  **Wizard com IA:** Ser direcionado para o `AIJobRequestWizard` já na etapa de revisão, com os campos preenchidos pela IA.
3.  **Publicação e Login:** Revisar os dados, adicionar endereço e publicar o job. Se não estiver logado, ser solicitado a criar uma conta/logar.
4.  **Recebimento de Propostas:** Acessar o dashboard e verificar que o job está "ativo". Aguardar o recebimento de notificações de novas propostas.
5.  **Análise e Comunicação:** Abrir a página de detalhes do job, visualizar as propostas e iniciar uma conversa no chat com um dos prestadores.
6.  **Agendamento com IA:** Conversar sobre data e hora e aguardar a sugestão do assistente de agendamento. Confirmar o agendamento.
7.  **Aceite e Pagamento:** Aceitar formalmente a proposta do prestador escolhido. Proceder para a página de pagamento do Stripe e efetuar o pagamento (em modo de teste).
8.  **Acompanhamento:** Receber a notificação de que o prestador está "a caminho".
9.  **Conclusão:** Após a execução do serviço, clicar no botão "Confirmar Conclusão" para liberar o pagamento.
10. **Avaliação:** Deixar uma avaliação de 5 estrelas e um comentário para o prestador.

---

## Cenário 2: Jornada do Prestador (Fluxo Feliz)

**Objetivo:** Validar a experiência completa de um prestador, desde o cadastro até o recebimento pelo serviço prestado.

**Passos:**

1.  **Cadastro e Onboarding:** Criar uma nova conta como "prestador". Ser redirecionado para o fluxo de onboarding.
2.  **Verificação com IA:** Fazer o upload de um documento de identidade e confirmar os dados extraídos pela IA. Submeter para análise.
3.  **Aprovação pelo Admin:** Logar como `admin@servio.ai`, acessar o painel, encontrar o novo prestador pendente e aprová-lo.
4.  **Gamificação e Catálogo:** Logar novamente como prestador, visualizar o componente de "Força do Perfil" e a "Dica da IA". Adicionar um serviço ao seu catálogo.
5.  **Envio de Proposta:** Encontrar o job criado no Cenário 1 na lista de "Novas Oportunidades" e enviar uma proposta.
6.  **Notificação de Aceite:** Receber a notificação de que sua proposta foi aceita e o serviço foi agendado.
7.  **Execução do Serviço:** Acessar os detalhes do job, clicar no botão "Estou a Caminho".
8.  **Recebimento:** Após o cliente confirmar a conclusão, verificar se o status do job muda para "concluído".
9.  **Notificação de Pagamento:** Receber a notificação de que o pagamento foi liberado.
10. **Notificação de Avaliação:** Receber a notificação da nova avaliação de 5 estrelas recebida.

---

## Ferramentas Propostas

- **Testes Manuais:** Execução manual seguindo rigorosamente os roteiros acima, utilizando contas de teste distintas.
- **Testes Automatizados (Pós-MVP):** Implementação dos cenários acima utilizando uma framework como Cypress ou Playwright para garantir a ausência de regressões em futuros deploys.
