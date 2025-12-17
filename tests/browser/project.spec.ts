import { test, expect } from '@playwright/test';

test('the complete page connects navigation, cards, reading and footer', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await page.goto('/examples/project.html');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good work starts with a little attention.');
  await expect(page.locator('#work .cube-card')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Genau hinschauen, bevor wir etwas ändern.' })).toBeVisible();
  await page.getByRole('link', { name: 'Read a field note', exact: true }).click();
  await expect(page).toHaveURL(/#notes$/);
  await expect(page.locator('#notes')).toBeInViewport();
  expect(failed).toEqual([]);
});

for (const width of [320, 768, 1440]) {
  test('the complete page reflows at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/examples/project.html');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole('link', { name: 'Explore the practice', exact: true })).toBeVisible();
  });
}

test('the complete page retains content and navigation without scripts or fonts', async ({ browser, baseURL, browserName }) => {
  if (!baseURL) throw new Error('A test base URL is required.');
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  const page = await context.newPage();
  let blocked = 0;
  await page.route('**/*.woff2', route => { blocked++; return route.abort(); });
  await page.goto('/examples/project.html');
  await expect.poll(() => blocked).toBeGreaterThan(0);
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('link', { name: 'CSS laboratory', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A foundation for everyday pages.' })).toBeVisible();
  await context.close();
});
