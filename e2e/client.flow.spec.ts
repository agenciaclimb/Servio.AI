import { test, expect } from '@playwright/test';

test.describe('Client Journey - Smoke', () => {
  test('homepage renders search input and CTA', async ({ page }) => {
    await page.goto('/');
    // Input has id #job-prompt per cliente.spec.ts
    await expect(page.locator('#job-prompt')).toBeVisible();
    await expect(page.getByRole('button', { name: /começar agora/i })).toBeVisible();
  });

  test.skip('search triggers wizard open (initialPrompt path) - SKIP: requires auth', async ({ page }) => {
    // This flow requires user to be authenticated first.
    // Current app redirects guest users to login before opening wizard.
    // TODO: implement auth mock or unskip after auth flow is E2E-testable.
    await page.goto('/');
    const search = page.locator('#job-prompt');
    await search.fill('Instalar ventilador de teto na sala');
    await page.getByRole('button', { name: /começar agora/i }).click();
    // Would expect wizard modal if authenticated
  });
});
