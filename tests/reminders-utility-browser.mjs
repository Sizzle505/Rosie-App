import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, acceptDownloads: true
  });
  const page = await context.newPage();
  page.on("pageerror", e => errors.push(e.message));
  page.on("dialog", d => d.accept());
  await page.addInitScript(() => {
    const key = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),
      String(date.getDate()).padStart(2,"0")].join("-");
    const now = new Date();
    const yesterday = new Date(now.getFullYear(),now.getMonth(),now.getDate()-1);
    const tomorrow = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
    const item = (id, title, date, category) => ({
      id, title, date:key(date), category, time:"", detail:"",
      repeat:"none", priority:"normal", completedDates:[]
    });
    localStorage.setItem("rosieverse.reminders.v1",JSON.stringify({
      version:1,
      items:[
        item("overdue","Past Due Check",yesterday,"tasks"),
        item("upcoming","Future Call",tomorrow,"appointments")
      ],
      notes: [{id:"localnote",title:"A private thought",body:"Only on this device",updatedAt:Date.now()}],
      goals:[],gratitude:[]
    }));
  });
  await page.goto("http://127.0.0.1:5173/#reminders",{waitUntil:"networkidle"});
  await page.locator(".rr-page").waitFor();
  await page.locator(".loading-screen-hidden").waitFor();
  await page.getByRole("tab",{name:"Today"}).click();
  assert.equal(await page.locator(".rr-entry").filter({hasText:"Past Due Check"}).count(),1,
    "Overdue one-time reminders must appear in Today");
  await page.getByRole("button",{name:/Overdue \(/}).click();
  assert.equal(await page.locator(".rr-entry").filter({hasText:"Past Due Check"}).count(),1);
  await page.locator(".rr-entry").filter({hasText:"Past Due Check"})
    .getByRole("button",{name:"Tomorrow"}).click();
  assert.equal(await page.locator(".rr-entry").filter({hasText:"Past Due Check"}).count(),0,
    "Postponed task must leave the overdue view");
  await page.getByRole("button",{name:/Undo/}).click();
  assert.equal(await page.locator(".rr-entry").filter({hasText:"Past Due Check"}).count(),1,
    "Undo must restore a postponed task");
  await page.getByRole("button",{name:/Next 14 days/}).click();
  assert.equal(await page.locator(".rr-entry").filter({hasText:"Future Call"}).count(),1);
  await page.getByPlaceholder("Search reminders and details…").fill("does not exist");
  assert.equal(await page.locator(".rr-entry").count(),0, "Search must hide nonmatches");
  await page.getByPlaceholder("Search reminders and details…").fill("");
  await page.locator(".rr-feature-tasks").click();
  await page.getByRole("textbox",{name:"New task"}).fill("Draft a wonderful note");
  await page.locator(".rr-quick-options select").selectOption("tomorrow");
  await page.locator(".rr-priority-toggle input").check();
  await page.getByRole("button",{name:"Add task"}).click();
  assert.equal(await page.locator(".rr-task-rows .rr-simple-row")
    .filter({hasText:"Draft a wonderful note"}).count(),1,"Quick task was not saved");
  await page.getByRole("button",{name:"Edit details for Draft a wonderful note"}).click();
  assert.equal(await page.getByRole("dialog").count(),1,"Task editor did not open");
  await page.locator(".rr-modal input[required]").fill("Draft polished note");
  await page.getByRole("button",{name:"Save Reminder"}).click();
  assert.equal(await page.locator(".rr-task-rows .rr-simple-row")
    .filter({hasText:"Draft polished note"}).count(),1, "Task edits were not saved");
  await page.locator(".rr-feature-shopping").click();
  await page.getByRole("textbox",{name:"Grocery list items"}).fill("Cheese\nApples");
  await page.getByRole("button",{name:/Add Items/}).click();
  assert.equal(await page.locator(".rr-grocery-row").count(),2,"Bulk shopping paste failed");
  await page.locator(".rr-grocery-row").first().locator(".rr-simple-check").click();
  await page.getByRole("button",{name:/Clear completed/}).click();
  assert.equal(await page.locator(".rr-grocery-row").count(),1,"Clear completed did not work");
  await page.getByRole("button",{name:/Undo/}).click();
  assert.equal(await page.locator(".rr-grocery-row").count(),2,"Undo failed");
  const download = page.waitForEvent("download");
  await page.getByRole("button",{name:/Download backup/}).click();
  const saved = await download;
  assert.match(saved.suggestedFilename(),/rosie-reminders-backup.*\.json/);
  const backup = JSON.parse(await fs.readFile(await saved.path(),"utf8"));
  assert.equal(backup.version,1);
  assert(backup.items.some(x=>x.title==="Draft polished note"));
  assert.equal(backup.notes[0].title,"A private thought");
  await page.locator(".rr-feature-notes").click();
  assert.equal(await page.getByRole("button",{name:"A private thought"}).count(),1,
    "Local note became inaccessible");
  assert.deepEqual(errors,[],"Unexpected browser page errors");
  console.log("Reminders browser smoke passed: overdue, agenda, search, quick tasks, editor, shopping, undo, backup and local notes.");
} finally {
  await browser.close();
}
