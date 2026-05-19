import { test, expect } from '@playwright/test';

test('smoke: kanban produção basic flows', async ({ page }) => {
  // Adjust base URL and credentials as necessary
  await page.goto('/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');

  // Sidebar contains only Kanban (and not Kanban Produção)
  await expect(page.locator('nav').locator('text=Kanban')).toBeVisible();
  await expect(page.locator('nav').locator('text=Kanban Produção')).toHaveCount(0);

  // Open Kanban hub
  await page.click('nav >> text=Kanban');
  await page.waitForURL(/kanban/);

  // Select Produção context if available
  const producaoOption = page.locator('select').locator('option', { hasText: 'Produção' });
  if (await producaoOption.count() > 0) {
    await page.selectOption('select', { label: 'Produção' });
    await page.waitForURL('/kanban/producao');

    // Wait for KPIs and list
    await expect(page.locator('text=OPs')).toBeVisible();

    // Try to open first OP drawer if exists
    const firstOpButton = page.locator('button', { hasText: 'OP' }).first();
    if (await firstOpButton.count() > 0) {
      await firstOpButton.click();
      await expect(page.locator('text=Checklist')).toBeVisible();
    }
  }
});
