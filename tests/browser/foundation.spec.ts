import { test, expect, type Page } from '@playwright/test';

const expectNoPageOverflow = async (page: Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
};

test('the public entry provides a readable standalone page and local fonts', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', response => {
    if (response.status() >= 400) failed.push(response.url());
  });
  await page.goto('/examples/standalone.html');
  await expect(page.getByRole('heading', { name: 'A clear starting point.' })).toBeVisible();
  const fonts = await page.evaluate(async () => {
    const names = ['Source Sans 3', 'Source Serif 4', 'Source Code Pro'];
    return Promise.all(names.flatMap(name => ['normal', 'italic'].map(async style => {
      const faces = await document.fonts.load(style + ' 600 20px "' + name + '"', 'ÄÖÜ äöü ß ẞ');
      return { name, style, loaded: faces.length > 0 && faces.every(face => face.status === 'loaded') };
    })));
  });
  expect(fonts.every(font => font.loaded)).toBe(true);
  await expect(page.locator('body')).toHaveCSS('font-size', '18px');
  await expectNoPageOverflow(page);
  expect(failed).toEqual([]);
});

for (const width of [320, 768, 1440]) {
  test('the laboratory contains long and nested content at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/examples/');
    await expect(page.getByRole('heading', { name: 'A foundation for everyday pages.' })).toBeVisible();
    await expect(page.getByText('A closer conversation', { exact: true })).toBeVisible();
    await expect(page.getByText(/Donaudampfschifffahrtsgesellschaft/)).toBeVisible();
    await expectNoPageOverflow(page);
    const spacing = await page.locator('.lab-nested').evaluate(element => {
      const children = [...element.children];
      return children.slice(1).map(child => parseFloat(getComputedStyle(child).marginBlockStart));
    });
    expect(spacing).toEqual([12, 12]);
    await expect(page.locator('.lab-nested')).toHaveCSS('margin-block-start', '24px');
    const wrapper = await page.locator('main').boundingBox();
    expect(wrapper!.width).toBeLessThan(width);
    expect(wrapper!.x).toBeGreaterThan(0);
  });
}

test('keyboard navigation exposes focus and native disclosure works', async ({ page, browserName }) => {
  await page.goto('/examples/');
  // macOS WebKit uses Option-Tab to include links in keyboard navigation.
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  expect((await skip.boundingBox())!.y).toBeGreaterThanOrEqual(0);
  await expect(skip).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  const disclosure = page.locator('summary');
  await disclosure.focus();
  await expect(disclosure).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByText('No. Content, navigation, disclosure, CSS imports, and local fonts all work without application JavaScript.')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('details')).not.toHaveAttribute('open', '');
});

test('content and navigation work with JavaScript disabled', async ({ browser, baseURL }) => {
  if (!baseURL) throw new Error('A test base URL is required.');
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/examples/');
  await expect(page.getByRole('heading', { name: 'Three voices, one family.' })).toBeVisible();
  await page.getByRole('link', { name: 'Standalone example', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clear starting point.' })).toBeVisible();
  await context.close();
});

test('font delivery may fail without hiding text or breaking layout', async ({ page }) => {
  let blocked = 0;
  await page.route('**/*.woff2', route => {
    blocked++;
    return route.abort();
  });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/examples/');
  await page.evaluate(() => document.fonts.ready);
  expect(blocked).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'A foundation for everyday pages.' })).toBeVisible();
  await expect(page.getByText(/Gute Gestaltung lässt/)).toBeVisible();
  await expectNoPageOverflow(page);
  await page.getByRole('link', { name: 'Standalone example', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clear starting point.' })).toBeVisible();
});

test('larger root text and consumer overrides retain useful layout', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/examples/standalone.html');
  const original = await page.locator('main').boundingBox();
  await page.addStyleTag({ content: 'html { font-size: 200%; } :root { --desy-color-accent: #71432a; } main { --cube-wrapper-max: 30ch; --cube-flow-space: 2rem; }' });
  await expect(page.locator('body')).toHaveCSS('font-size', '36px');
  await expect(page.getByRole('link')).toHaveCSS('color', 'rgb(113, 67, 42)');
  await expect(page.locator('main > p').first()).toHaveCSS('margin-block-start', '64px');
  await expectNoPageOverflow(page);
  expect((await page.locator('main').boundingBox())!.height).toBeGreaterThan(original!.height);
});

test('rendered text, links, notes and focus have adequate contrast', async ({ page }) => {
  await page.goto('/examples/');
  const ratios = await page.evaluate(() => {
    const rgb = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(channel => {
      const x = channel / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    const luminance = (value: string): number => {
      const [red, green, blue] = rgb(value);
      if (red === undefined || green === undefined || blue === undefined) throw new Error('Expected three color channels.');
      return red * 0.2126 + green * 0.7152 + blue * 0.0722;
    };
    const background = luminance(getComputedStyle(document.body).backgroundColor);
    return ['body', '.lab-note', 'nav a'].map(selector => {
      const foreground = luminance(getComputedStyle(document.querySelector(selector)!).color);
      return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
    });
  });
  for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  const link = page.getByRole('link', { name: 'Typography', exact: true });
  await link.focus();
  await expect(link).toHaveCSS('outline-width', '3px');
  const focus = await link.evaluate(element => getComputedStyle(element).outlineColor);
  const ink = await link.evaluate(element => getComputedStyle(element).color);
  expect(focus).toBe(ink);
});

