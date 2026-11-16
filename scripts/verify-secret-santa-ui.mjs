import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts/secret-santa", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [device, width, height] of [
    ["desktop", 1366, 900], ["ipad", 820, 1180], ["iphone", 390, 844]
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:5173/#randomizers", { waitUntil: "networkidle" });
    const secret = page.locator(".ss-shell");
    await secret.waitFor({ state: "visible" });
    assert.equal(await page.locator(".ss-inline-create form").isVisible(), true,
      device + " must show create form immediately");
    assert.equal(await page.locator(".ss-inline-create textarea").isVisible(), true);
    assert.equal(await page.getByRole("button", { name: "CREATE EXCHANGE" }).isVisible(), true);
    assert.equal(await secret.getByText(/gift budget|exchange date/i).count(), 0);
    assert.equal(await page.locator(".ss-hero__banner").isVisible(), width > 760);
    assert.equal(await page.locator(".ss-hero__mobile").isVisible(), width <= 760);
    const img = width > 760 ? page.locator(".ss-hero__banner") : page.locator(".ss-hero__mobile img").first();
    await img.evaluate(node => node.decode());
    const dims = await secret.evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth }));
    assert.ok(dims.scroll <= dims.client + 3,
      device + " panel overflows horizontally " + JSON.stringify(dims));
    await secret.screenshot({ path: "artifacts/secret-santa/" + device + ".png" });

    // Exercise the organizer's private pre-draw email editor with a mocked API.
    const participants = ["Alice", "Blair", "Casey"].map((name, i) => ({
      id: "00000000-0000-4000-8000-00000000000" + (i + 1), name, email: ""
    }));
    const invitations = participants.map(person => ({ id: person.id, name: person.name, token: "a".repeat(64) }));
    const exchange = { id: "00000000-0000-4000-8000-000000000010", title: "Test exchange",
      status: "draft", participants, exclusions: [] };
    await page.route("**/api/secret-santa", async route => {
      const input = route.request().postDataJSON();
      if (input.action === "emails") {
        for (const update of input.updates) {
          const guest = participants.find(person => person.id === update.id);
          if (guest) guest.email = update.email;
        }
      }
      const result = { exchange, invitations, hostToken: "b".repeat(64) };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(result) });
    });
    await page.locator(".ss-inline-create textarea").fill(["Alice", "Blair", "Casey"].join(String.fromCharCode(10)));
    await page.getByRole("button", { name: "CREATE EXCHANGE" }).click();
    await page.locator(".ss-invite__email input").first().waitFor({ state: "visible" });
    assert.equal(await page.locator(".ss-invite__email input").count(), 3,
      device + " should show one optional email field per guest");
    await page.getByRole("textbox", { name: "Optional email for Alice" }).fill("alice@example.com");
    assert.equal(await page.getByRole("button", { name: "SAVE GUEST EMAILS" }).isEnabled(), true);
    await page.getByRole("button", { name: "SAVE GUEST EMAILS" }).click();
    await page.getByRole("button", { name: "SAVE GUEST EMAILS" }).waitFor({ state: "visible" });
    assert.equal(await page.getByRole("textbox", { name: "Optional email for Alice" }).inputValue(), "alice@example.com");
    assert.equal(await page.locator(".ss-invite__mailto").count(), 1,
      device + " should show one draft-email link for the saved contact");
    const hostDimensions = await secret.evaluate(node => ({ client: node.clientWidth, scroll: node.scrollWidth }));
    assert.ok(hostDimensions.scroll <= hostDimensions.client + 3,
      device + " guest email ledger overflows horizontally " + JSON.stringify(hostDimensions));
    await secret.screenshot({ path: "artifacts/secret-santa/" + device + "-email-ledger.png" });
    await context.close();
  }
} finally { await browser.close(); }
console.log("Secret Santa responsive layout verified for desktop, iPad and iPhone");
