// Wrapper CJS para rodar o guardrail ESM em repos com "type": "module".
// Mantém compatibilidade com `npm run guardrails:audit`.

(async () => {
  try {
    await import('./deny-local-audit-results.js');
  } catch (err) {
    // Se o módulo ESM lançar, respeitar código de saída quando possível.
    // Como o módulo principal usa process.exit(), isso normalmente não é atingido.
    // Mantemos fallback seguro.
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
})();
