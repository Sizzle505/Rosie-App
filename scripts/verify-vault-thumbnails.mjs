/**
 * Visual regression audit for Card Vault.
 * Install the browser once: npm install --no-save playwright && npx playwright install chromium
 * Run: node scripts/verify-vault-thumbnails.mjs 'https://YOUR-DEPLOYMENT/?_vercel_share=TOKEN#vault'
 * The default target is the public production URL.
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const target = process.argv[2] || 'https://rosie-app-git.vercel.app/#vault';
const browser = await chromium.launch({ headless: true });
const viewports = [
  [390, 844, 'phone-portrait'],
  [844, 390, 'phone-landscape'],
  [768, 1024, 'tablet'],
  [1440, 900, 'desktop']
];
const tracked = ['rc-057', 'rc-039', 'rc-098', 'rc-116'];
let checks = 0;

async function checkGrid(page, label) {
  const tiles = page.locator('[data-vault-tile]');
  assert.ok(await tiles.count() >= 4, label + ': card grid not found');
  const records = await tiles.evaluateAll(nodes => nodes.slice(0, 16).map(tile => {
    const img = tile.querySelector('img');
    const tr = tile.getBoundingClientRect(), ir = img.getBoundingClientRect();
    const styles = getComputedStyle(img);
    return {
      tile: [tr.width, tr.height],
      image: [ir.width, ir.height],
      offset: [ir.left - tr.left, ir.top - tr.top],
      fit: styles.objectFit,
      position: styles.objectPosition
    };
  }));
  for (const r of records) {
    assert.ok(Math.abs(r.tile[0] / r.tile[1] - 2 / 3) < 0.008, label + ': wrong tile aspect ratio');
    assert.ok(Math.abs(r.tile[0] - r.image[0]) < 0.7 && Math.abs(r.tile[1] - r.image[1]) < 0.7, label + ': image underfills tile');
    assert.ok(Math.abs(r.offset[0]) < 0.7 && Math.abs(r.offset[1]) < 0.7, label + ': image not top-left aligned');
    assert.equal(r.fit, 'cover', label + ': thumbnail should use proportional cover');
    assert.ok(r.position === '0% 0%' || r.position === 'left top', label + ': alignment drift');
    checks++;
  }
}

try {
  for (const [width, height, label] of viewports) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: width < 721, hasTouch: width < 721 });
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.locator('[data-vault-tile]').first().waitFor({ timeout: 20000 });
    // The app continuously moves the page; brake it to make DOM measurements stable.
    await page.getByRole('button', { name: 'Pause ambient card drift' }).click();
    await checkGrid(page, label);

    const slider = page.locator('input[aria-label="Card Vault zoom"]');
    await slider.focus();
    await slider.press('Home');
    for (let i = 0; i < (width < 721 ? 3 : 5); i++) {
      await checkGrid(page, label + '-zoom-' + i);
      await slider.press('ArrowRight');
    }

    if (label === 'phone-portrait') {
      for (const id of tracked) {
        const img = page.locator('[data-vault-tile] img[src*="' + id + '"]').first();
        await img.scrollIntoViewIfNeeded();
        await img.evaluate(el => el.decode());
        const dims = await img.evaluate(el => [el.naturalWidth, el.naturalHeight]);
        assert.deepEqual(dims, [1024, 1536], id + ': unexpected source image geometry');
        checks++;
      }
      const selected = page.locator('[data-vault-tile]').first();
      const originalSrc = await selected.locator('img').getAttribute('src');
      await selected.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      assert.equal(await dialog.locator('img').getAttribute('src'), originalSrc, 'expanded artwork changed');
      await page.getByRole('button', { name: 'Close card detail' }).click();
      assert.equal(await page.getByRole('dialog').count(), 0, 'lightbox did not close');
      checks += 2;

      const countBefore = await page.locator('[data-vault-tile]').count();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1200);
      assert.ok(await page.locator('[data-vault-tile]').count() > countBefore, 'infinite scrolling did not append cards');
      await checkGrid(page, label + '-appended');
    }

    await page.screenshot({ path: '/tmp/rosie-vault-' + label + '.png' });
    console.log(label + ': OK');
    await page.close();
  }
  console.log('PASS: ' + checks + ' card/layout assertions');
} finally {
  await browser.close();
}
