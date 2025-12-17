import { test, expect, type Page } from '@playwright/test';

const expectContained = async (page: Page) => {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect.poll(() => page.locator('.cube-card, .cube-button').evaluateAll(elements =>
    elements.filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent),
  )).toEqual([]);
};

for (const [width, columns] of [[320, 1], [768, 2], [1440, 3]] as const) {
  test('cards respond to available width at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/examples/cards.html');
    await expect(page.getByRole('heading', { name: 'Room for different ideas.' })).toBeVisible();
    const rows = await page.locator('#card-grid > article').evaluateAll(elements =>
      elements.map(element => Math.round(element.getBoundingClientRect().top)),
    );
    expect(rows.filter(row => row === rows[0])).toHaveLength(columns);
    await expectContained(page);
  });
}

test('a nested grid stays narrow in a wide viewport and can be customized locally', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/examples/');
  const cards = page.locator('#lab-nested-grid > article');
  const first = (await cards.nth(0).boundingBox())!;
  const second = (await cards.nth(1).boundingBox())!;
  expect(second.y).toBeGreaterThan(first.y + first.height);
  expect(Math.abs(second.x - first.x)).toBeLessThan(1);
  await page.addStyleTag({ content: '#lab-nested-grid { --cube-grid-min: 10rem; }' });
  const customized = (await cards.nth(1).boundingBox())!;
  expect(customized.x).toBeGreaterThan(first.x);
  expect(Math.abs(customized.y - first.y)).toBeLessThan(1);
  await expectContained(page);
});

test('cards retain their appearance when an author changes the surrounding composition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/examples/cards.html');
  const card = page.locator('#field-notes');
  const before = (await card.boundingBox())!;
  const appearance = await card.evaluate(element => {
    const style = getComputedStyle(element);
    return [style.padding, style.backgroundColor, style.borderTopColor];
  });
  await page.locator('#card-grid').evaluate(element => element.setAttribute('class', 'cube-flow'));
  expect((await card.boundingBox())!.width).toBeGreaterThan(before.width * 2);
  expect(await card.evaluate(element => {
    const style = getComputedStyle(element);
    return [style.padding, style.backgroundColor, style.borderTopColor];
  })).toEqual(appearance);
  await expectContained(page);
});

test('action groups wrap and large text remains readable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/examples/cards.html');
  const actions = page.locator('#action-group > *');
  const first = (await actions.nth(0).boundingBox())!;
  const last = (await actions.nth(2).boundingBox())!;
  expect(last.y).toBeGreaterThan(first.y);
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await expect(page.locator('body')).toHaveCSS('font-size', '36px');
  await expectContained(page);
  await expect(page.getByRole('button', { name: 'Reset selection' })).toBeVisible();
  await page.goto('/examples/');
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await expectContained(page);
});

test('native buttons reset forms and links navigate through the keyboard', async ({ page, browserName }) => {
  await page.goto('/examples/cards.html');
  const select = page.getByLabel('Subject', { exact: true });
  await select.selectOption('type');
  const reset = page.getByRole('button', { name: 'Reset selection' });
  await reset.focus();
  await expect(reset).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(select).toHaveValue('layout');
  await expect(page).toHaveURL(/\/examples\/cards\.html$/);
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
  const link = page.getByRole('link', { name: 'Return to the cards', exact: true });
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#card-grid$/);
  await expect(page.locator('#card-grid')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Unavailable action' })).toBeDisabled();
  await reset.evaluate(element => element.setAttribute('hidden', ''));
  await expect(reset).toBeHidden();
});

test('composed cards and actions work without JavaScript or available webfonts', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('A test base URL is required.');
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  const page = await context.newPage();
  let blocked = 0;
  await page.route('**/*.woff2', route => {
    blocked++;
    return route.abort();
  });
  await page.goto('/examples/cards.html');
  await expect.poll(() => blocked).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Workshop', exact: true })).toBeVisible();
  await expectContained(page);
  await page.getByLabel('Subject', { exact: true }).selectOption('color');
  await page.getByRole('button', { name: 'Reset selection' }).click();
  await expect(page.getByLabel('Subject', { exact: true })).toHaveValue('layout');
  await page.getByRole('link', { name: 'Back to the laboratory' }).click();
  await expect(page.getByRole('heading', { name: 'Give each piece its place.' })).toBeVisible();
  await expectContained(page);
  await context.close();
});

test('primary and outline actions preserve contrast in their resting and hover states', async ({ page }) => {
  await page.goto('/examples/cards.html');
  for (const action of [
    page.getByRole('button', { name: 'Reset selection' }),
    page.getByRole('link', { name: 'Return to the cards', exact: true }),
  ]) {
    for (const hover of [false, true]) {
      if (hover) await action.hover();
      const contrast = await action.evaluate(element => {
        const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(channel => {
          const x = channel / 255;
          return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        });
        const luminance = (value: string): number => {
          const [red, green, blue] = rgb(value);
          if (red === undefined || green === undefined || blue === undefined) throw new Error('Expected three color channels.');
          return red * 0.2126 + green * 0.7152 + blue * 0.0722;
        };
        const style = getComputedStyle(element);
        const background = style.backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.body).backgroundColor : style.backgroundColor;
        const values = [luminance(style.color), luminance(background)];
        return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  }
});
