import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const URL = "http://127.0.0.1:5173/#reminders";
const user = { id: "11111111-1111-4111-8111-111111111111", username: "rosiefan", displayName: "Rosie's Favorite" };
const now = new Date().toISOString();
const seed = [
  { id: "22222222-2222-4222-8222-222222222222", title: "A Remarkable Idea", body: "Call the dog park committee.\nInvestigate the missing biscuits.\nReserve a little time for delight.", created_at: now, updated_at: now },
  { id: "33333333-3333-4333-8333-333333333333", title: "Weekend Plans", body: "Walk Rosie, admire the sunset, and enjoy a well-earned treat.", created_at: now, updated_at: now }
];

async function capture(engine, isMobile) {
  const browser = await engine.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: isMobile ? 2 : 1,
    ...(isMobile ? { isMobile: true, hasTouch: true } : {}),
    reducedMotion: "reduce"
  });
  const page = await ctx.newPage();
  let loggedIn = false, notes = structuredClone(seed);
  await page.route("**/api/auth/session", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ user: loggedIn ? user : null })
  }));
  await page.route("**/api/auth/login", route => {
    loggedIn = true;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user, message: "Welcome back!" }) });
  });
  await page.route("**/api/auth/logout", route => {
    loggedIn = false;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ok: true}) });
  });
  await page.route("**/api/notes", route => {
    const method = route.request().method();
    if (method === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({notes}) });
    if (method === "POST") {
      const body = route.request().postDataJSON();
      const note = {id:"44444444-4444-4444-8444-444444444444",created_at:now,updated_at:now,...body};
      notes = [note,...notes];
      return route.fulfill({status:201,contentType:"application/json",body:JSON.stringify({note})});
    }
    return route.abort();
  });
  await page.route("**/api/notes/*", route => {
    const id = route.request().url().split("/").at(-1);
    const idx = notes.findIndex(n => n.id === id);
    if (idx < 0) return route.fulfill({status:404,contentType:"application/json",body:JSON.stringify({error:"Note not found."})});
    if (route.request().method() === "PATCH") {
      notes[idx] = {...notes[idx],...route.request().postDataJSON(),updated_at:new Date().toISOString()};
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({note:notes[idx]})});
    }
    if (route.request().method() === "DELETE") {
      notes.splice(idx,1);
      return route.fulfill({status:200,contentType:"application/json",body:'{"ok":true}'});
    }
    return route.abort();
  });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(URL, {waitUntil:"domcontentloaded"});
  const goNotes = page.getByRole("button", {name:"Open Notes & Ideas"});
  await goNotes.waitFor({timeout:30000});
  await goNotes.click();
  await page.getByRole("heading", {name:"Welcome to RosieVerse"}).waitFor();
  await page.getByRole("heading", {name:"Welcome to RosieVerse"}).locator("..").screenshot({
    path:`artifacts/rosie-private/${isMobile?"iphone":"desktop"}-entrance-${engine.name()}.png`
  });
  await page.getByRole("heading", {name:"Welcome to RosieVerse"}).scrollIntoViewIfNeeded();
  await page.getByRole("heading", {name:"Welcome to RosieVerse"}).locator("xpath=..").screenshot({path:`artifacts/rosie-private/${isMobile?"iphone":"desktop"}-login-${engine.name()}.png`});
  await page.getByRole("textbox", {name:"Username"}).fill("rosiefan");
  await page.getByLabel("Secret PIN").fill("1234");
  await page.getByRole("button",{name:/Enter RosieVerse/}).click();
  await page.locator('textarea[aria-label="Note text"]').waitFor();
  const body = page.locator('textarea[aria-label="Note text"]');
  await body.fill("A good day begins with Rosie.\nRemember the biscuits.");
  await page.getByText("Saved", {exact:false}).first().waitFor({timeout:15000});
  await page.getByRole("heading", {name:"Notes & Ideas"}).locator("../..").screenshot({
    path:`artifacts/rosie-private/${isMobile?"iphone":"desktop"}-ledger-${engine.name()}.png`
  });
  await body.scrollIntoViewIfNeeded();
  await body.evaluate(element => element.blur());
  await page.getByRole("heading", {name:"Notes & Ideas", level:3}).locator("xpath=../../..").screenshot({path:`artifacts/rosie-private/${isMobile?"iphone":"desktop"}-notes-${engine.name()}.png`});
  assert.equal(await body.inputValue(),"A good day begins with Rosie.\nRemember the biscuits.");
  assert.equal(notes[0].body,"A good day begins with Rosie.\nRemember the biscuits.");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow,false,"horizontal overflow on "+engine.name()+" "+isMobile);
  assert.deepEqual(errors,[],"page errors");
  await ctx.close();
  await browser.close();
}
await mkdir("artifacts/rosie-private",{recursive:true});
for(const engine of [webkit,chromium]){
  for(const mobile of [true,false]) await capture(engine,mobile);
}
console.log("Browser screenshot checks completed in WebKit and Chromium at 390px / 1440px.");
