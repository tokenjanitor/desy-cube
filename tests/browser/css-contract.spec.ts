import { test, expect } from '@playwright/test';

test('nested flow keeps the outer interval when its children use a local rhythm', async ({ page }) => {
  await page.goto('/examples/standalone.html');
  await page.setContent(`
    <link rel="stylesheet" href="/css/cube.css">
    <style>
      #outer { --cube-flow-space: 4rem; }
      #inner > * { --cube-flow-space: 0.5rem; }
      #exception { --cube-flow-space: 2rem; }
    </style>
    <main id="outer" class="cube-flow">
      <p>Opening text</p>
      <section id="inner" class="cube-flow"><p>Inner opening</p><p>Inner continuation</p></section>
      <p id="ordinary">Outer continuation</p><p id="exception">A deliberate child exception</p>
    </main>
  `);
  await expect(page.locator('#inner')).toHaveCSS('margin-block-start', '64px');
  await expect(page.locator('#inner > p').nth(1)).toHaveCSS('margin-block-start', '8px');
  await expect(page.locator('#ordinary')).toHaveCSS('margin-block-start', '64px');
  await expect(page.locator('#exception')).toHaveCSS('margin-block-start', '32px');
  await expect(page.locator('#inner')).toHaveCSS('display', 'block');
});

test('gap owns semantic grid and cluster spacing while ordinary lists retain rhythm', async ({ page }) => {
  await page.goto('/examples/standalone.html');
  await page.setContent(`
    <link rel="stylesheet" href="/css/cube.css">
    <style>
      .layout { inline-size: 600px; --cube-grid-min: 10rem; }
      .layout > li { block-size: 40px; }
    </style>
    <ul id="grid" class="cube-grid layout"><li>One</li><li>Two</li><li>Three</li></ul>
    <ul id="cluster" class="cube-cluster layout"><li>One</li><li>Two</li><li>Three</li></ul>
    <ul id="ordinary"><li>One</li><li>Two</li></ul>
  `);
  await expect(page.locator('#grid')).toHaveCSS('display', 'grid');
  for (const selector of ['#grid', '#cluster']) {
    const positions = await page.locator(selector + ' > li').evaluateAll(elements =>
      elements.map(element => element.getBoundingClientRect().top));
    expect(positions).toHaveLength(3);
    for (const top of positions) expect(top).toBeCloseTo(positions[0]!, 2);
    await expect(page.locator(selector + ' > li').nth(1)).toHaveCSS('margin-block-start', '0px');
    await expect(page.locator(selector)).toHaveCSS('list-style-type', 'disc');
  }
  const ordinaryMargin = await page.locator('#ordinary > li').nth(1).evaluate(element =>
    parseFloat(getComputedStyle(element).marginBlockStart));
  expect(ordinaryMargin).toBeGreaterThan(0);
});

test('local design properties vary independently without changing shared code surfaces', async ({ page }) => {
  await page.goto('/examples/standalone.html');
  await page.setContent(`
    <link rel="stylesheet" href="/css/cube.css">
    <style>
      main {
        --cube-h1-size: 42px;
        --cube-h1-tracking: 1px;
        --cube-list-space: 12px;
        --cube-card-radius: 10px;
        --cube-button-padding: 8px 20px;
        --cube-focus-width: 5px;
        --desy-color-code-background: rgb(200, 210, 220);
      }
    </style>
    <main>
      <h1>Locally adjusted</h1><ul><li>One</li><li>Two</li></ul>
      <article class="cube-card">A card</article>
      <button class="cube-button" type="button">Action</button>
      <button class="cube-button" type="button" disabled>Unavailable</button>
      <p><code>Code</code></p>
      <pre><code>Code</code><samp>Output</samp><kbd>Input</kbd></pre>
    </main>
  `);
  await expect(page.locator('h1')).toHaveCSS('font-size', '42px');
  await expect(page.locator('h1')).toHaveCSS('letter-spacing', '1px');
  await expect(page.locator('li').nth(1)).toHaveCSS('margin-block-start', '12px');
  await expect(page.locator('.cube-card')).toHaveCSS('border-radius', '10px');
  const action = page.locator('button:not(:disabled)');
  await expect(action).toHaveCSS('padding', '8px 20px');
  await action.focus();
  await expect(action).toHaveCSS('outline-width', '5px');
  await expect(page.locator('p code')).toHaveCSS('background-color', 'rgb(200, 210, 220)');
  await expect(page.locator(':disabled')).toHaveCSS('background-color', 'rgb(231, 236, 232)');
  await page.addStyleTag({ content: 'main { --cube-button-disabled-background: rgb(220, 215, 210); }' });
  await expect(page.locator(':disabled')).toHaveCSS('background-color', 'rgb(220, 215, 210)');
  const preSize = await page.locator('pre').evaluate(element => getComputedStyle(element).fontSize);
  for (const tag of ['code', 'samp', 'kbd']) {
    await expect(page.locator('pre ' + tag)).toHaveCSS('font-size', preSize);
  }
});

test('a responsive SVG retains its intrinsic aspect ratio', async ({ page }) => {
  await page.goto('/examples/standalone.html');
  await page.setContent(`
    <link rel="stylesheet" href="/css/cube.css">
    <div style="inline-size: 200px">
      <svg width="800" height="400" viewBox="0 0 800 400" role="img" aria-label="A rectangle">
        <rect width="800" height="400" fill="currentColor" />
      </svg>
    </div>
  `);
  await expect(page.locator('svg')).toHaveCSS('width', '200px');
  await expect(page.locator('svg')).toHaveCSS('height', '100px');
});
