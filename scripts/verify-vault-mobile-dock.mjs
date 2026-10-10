import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:4173/#vault';

for (const [engine, name] of [[chromium, 'Chromium'], [webkit, 'WebKit (Safari engine)']]) {
  const browser = await engine.launch({ headless: true });
  try {
    for (const [width, height] of [[390, 844], [844, 390]]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.locator('[data-vault-tile]').first().waitFor();
      const collapsed = page.getByRole('button', { name: 'Expand drift speed controls' });
      await collapsed.waitFor();
      const panel = page.locator('aside[aria-label="Ambient card drift speed and direction"]');
      const b = await panel.boundingBox();
      assert.ok(b.width <= 43 && b.height <= 75, name + ': collapsed dock still obscures the cards');
      const pause = page.getByRole('button', { name: 'Pause ambient card drift' });
      await pause.click();
      await page.getByRole('button', { name: 'Resume ambient card drift' }).waitFor();
      await collapsed.click();
      await page.getByRole('button', { name: 'Collapse drift speed controls' }).waitFor();
      const range = page.getByRole('slider', { name: 'Card drift speed and direction; center is zero' });
      assert.ok(await range.isVisible(), name + ': speed slider should expand');
      const expandedBox = await panel.boundingBox();
      assert.ok(expandedBox.width >= 50 && expandedBox.height >= 185, name + ': slider panel did not expand');
      await range.focus();
      const oldVal = Number(await range.inputValue());
      await range.press('ArrowUp');
      assert.notEqual(Number(await range.inputValue()), oldVal, name + ': speed adjustment failed');
      await page.getByRole('button', { name: 'Collapse drift speed controls' }).click();
      const shrunk = await panel.boundingBox();
      assert.ok(shrunk.width <= 43, name + ': expanded dock did not collapse');
      const tile = page.locator('[data-vault-tile]').first();
      const tr = await tile.boundingBox(), ir = await tile.locator('img').boundingBox();
      assert.ok(Math.abs(tr.width - ir.width) < 1 && Math.abs(tr.height - ir.height) < 1, name + ': thumb underfills tile');
      await tile.click({ force: true });
      await page.getByRole('dialog').waitFor();
      await page.getByRole('button', { name: 'Close card detail' }).click();
      await page.screenshot({ path: '/tmp/vault-' + name.split(' ')[0].toLowerCase() + '-' + width + '.png' });
      console.log(name + ' ' + width + 'x' + height + ': PASS (compact dock, expansion, pause, speed, artwork, lightbox)');
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
