// Browser regression check for iPhone and desktop cheese-card reveal pacing.
// Run against a local Vite server: npx playwright test is not required;
// node tests/cheese-card-reveal.mjs (requires Playwright browsers installed).
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const base = process.env.ROSIE_TEST_BASE || 'http://127.0.0.1:5173';
for (const [name, browserType] of [['webkit-iphone', webkit], ['chromium-desktop', chromium]]) {
  const browser = await browserType.launch({ headless: true });
  try {
    const mobile = name.startsWith('webkit');
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      hasTouch: mobile,
      isMobile: mobile
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/#cheese', { waitUntil: 'domcontentloaded' });
    const cards = page.locator('button.cheese-card');
    await cards.first().waitFor();
    await page.locator('.loading-screen-hidden').waitFor();

    const duration = await cards.first().locator('.cheese-card-inner').evaluate(el =>
      getComputedStyle(el).transitionDuration.split(',')[0].trim());
    assert.equal(duration, '0.22s', name + ': card flip must be snappy');

    const ids = await cards.evaluateAll(nodes => nodes.map(node =>
      node.querySelector('.cheese-card-front strong')?.textContent?.trim()));
    assert.equal(ids.length, 16, 'expected sixteen cards');
    const miss = ids.findIndex(id => id !== ids[0]);
    const mate = ids.findIndex((id, i) => i > 0 && id === ids[0]);
    assert(miss >= 0 && mate >= 0, 'requires both a match and non-match');

    const first = cards.nth(0);
    await first.click();
    assert(await first.evaluate(el => el.classList.contains('is-flipped')),
      name + ': first tap must flip without an artificial timer');
    await cards.nth(miss).click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('button.cheese-card')].every(el =>
        !el.classList.contains('is-flipped')),
    null, { timeout: 1800 });
    // After a mismatch, the player should be able to immediately start another attempt.
    await first.click();
    assert(await first.evaluate(el => el.classList.contains('is-flipped')),
      name + ': new selection must be unlocked promptly');
    await cards.nth(mate).click();
    await page.waitForFunction(() =>
      document.querySelectorAll('button.cheese-card.is-matched').length === 2,
    null, { timeout: 1200 });
    assert.equal(await page.locator('button.cheese-card.is-matched').count(), 2);
    assert.deepEqual(errors, [], name + ': no page errors');
    await context.close();
    console.log(name + ': cheese reveal timing passes');
  } finally {
    await browser.close();
  }
}
