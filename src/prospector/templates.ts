export type TemplateVars = Record<string, string | number | undefined>;

export const templates = {
  whatsapp: {
    intro_value: `Olá {{nome}}, tudo bem? Sou da Servio.AI. Vi que você atua em {{categoria}} e acredito que podemos ajudar a fechar mais negócios com automações inteligentes. Posso te enviar um case rápido?`,
    case_study: `Segue um case: ajudamos {{empresa}} a aumentar em {{percent}}% as conversões em {{dias}} dias com prospecção multicanal + IA. Faz sentido para você?`,
    question_nudge: `Consegue me dizer se faz sentido avançarmos? Posso adaptar a proposta ao seu contexto de {{categoria}}.`,
  },
  email: {
    intro_value: `Assunto: Como aumentar conversões em {{categoria}}\n\nOlá {{nome}},\n\nSou da Servio.AI. Temos ajudado empresas como {{empresa}} a aumentar conversões com IA e automações de prospecção. Posso compartilhar um case de {{dias}} dias e uma sugestão de abordagem para seu contexto?\n\nAbraços,\nEquipe Servio.AI`,
    case_study: `Assunto: Case rápido ({{empresa}})\n\n{{nome}},\n\nEm {{dias}} dias, {{empresa}} aumentou {{percent}}% as conversões usando nosso CRM de prospecção com sequências multicanal e IA. Posso detalhar os passos e te enviar um rascunho adaptado?\n\nAbs,\nServio.AI`,
  },
  call: {
    call_script_short: `Script curto:\n- Apresentação rápida e contexto de valor para {{categoria}}\n- Case objetivo ({{empresa}}, {{percent}}%)\n- Pergunta de encaixe (agenda de 15min)\n- Próximo passo (enviar proposta/agenda)`,
  }
} as const;

export function render(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, k) => String(vars[k.trim()] ?? ''));
}
