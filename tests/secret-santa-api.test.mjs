import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/secret-santa.js";

const savedFetch = globalThis.fetch;
const savedUrl = process.env.SUPABASE_URL;
const savedKey = process.env.SUPABASE_SECRET_KEY;
process.env.SUPABASE_URL = "https://example.invalid";
process.env.SUPABASE_SECRET_KEY = "test-service-role-key";
let rows = [];
function success(body) {
  return { ok: true, status: 200, text: async () => JSON.stringify(body) };
}
globalThis.fetch = async (url, options) => {
  const u = new URL(url);
  assert.equal(u.pathname, "/rest/v1/rosie_santa_exchanges");
  assert.ok(options.headers.Authorization.startsWith("Bearer "));
  const method = options.method;
  if (method === "POST") {
    const body = JSON.parse(options.body);
    const now = new Date().toISOString();
    const row = { id: crypto.randomUUID(), status: "draft", assignments: {}, exclusions: [],
      created_at: now, updated_at: now, drawn_at: null, budget: "", exchange_date: null, ...body };
    rows.push(row);
    return success([row]);
  }
  const id = u.searchParams.get("id")?.replace("eq.", "");
  const matches = rows.filter(row => !id || row.id === id);
  if (method === "GET") return success(matches);
  if (method === "PATCH") {
    const eligible = matches.filter(row => !u.searchParams.get("status") || row.status === u.searchParams.get("status").replace("eq.", ""));
    const changes = JSON.parse(options.body);
    for (const row of eligible) Object.assign(row, changes);
    return success(eligible.map(row => ({ ...row })));
  }
  throw new Error("Unexpected database request " + method);
};
async function invoke(action, payload) {
  let body = null;
  const res = { statusCode: 200, setHeader() {}, end(value) { body = JSON.parse(value); } };
  await handler({ method: "POST", headers: { origin: "http://localhost", host: "localhost" },
    body: { action, ...payload } }, res);
  return { status: res.statusCode, body };
}

test("private guest links reveal only one recipient, not the mapping", async () => {
  const made = await invoke("create", { title: "Holiday Draw", budget: "$50",
    names: ["Alex", "Blair", "Casey", "Dana"] });
  assert.equal(made.status, 201);
  const { exchange, hostToken, invitations } = made.body;
  assert.equal(invitations.length, 4);
  assert.equal(Object.hasOwn(exchange, "assignments"), false);
  const info = await invoke("dashboard", { exchangeId: exchange.id, hostToken });
  assert.equal(info.status, 200);
  assert.equal(Object.hasOwn(info.body.exchange, "assignments"), false);
  const guest = invitations[0];
  const creds = { exchangeId: exchange.id, guestId: guest.id, guestToken: guest.token };
  const before = await invoke("guest", creds);
  assert.equal(before.status, 200);
  assert.equal(before.body.exchange.status, "draft");
  assert.equal(Object.hasOwn(before.body, "recipient"), false);
  const draw = await invoke("draw", { exchangeId: exchange.id, hostToken });
  assert.equal(draw.status, 200);
  assert.equal(Object.hasOwn(draw.body.exchange, "assignments"), false);
  const unopened = await invoke("guest", creds);
  assert.equal(Object.hasOwn(unopened.body, "recipient"), false);
  const opened = await invoke("reveal", creds);
  assert.equal(opened.status, 200);
  assert.ok(opened.body.recipient.name);
  assert.notEqual(opened.body.recipient.name, guest.name);
  assert.equal(Object.hasOwn(opened.body, "invitations"), false);
  const badToken = await invoke("reveal", { ...creds, guestToken: "0".repeat(64) });
  assert.equal(badToken.status, 403);
  const doubleDraw = await invoke("draw", { exchangeId: exchange.id, hostToken });
  assert.equal(doubleDraw.status, 409);
  const cannotAdd = await invoke("add", { exchangeId: exchange.id, hostToken, name: "Erin" });
  assert.equal(cannotAdd.status, 409);
});
test("validates impossible restrictions before locking the draw", async () => {
  const made = await invoke("create", { title: "Restrictive Draw", names: ["One", "Two", "Three"] });
  const { exchange, hostToken } = made.body;
  const [a, b, c] = exchange.participants;
  const rules = await invoke("rules", { exchangeId: exchange.id, hostToken,
    exclusions: [{ giver: a.id, recipient: b.id }, { giver: a.id, recipient: c.id }] });
  assert.equal(rules.status, 200);
  const draw = await invoke("draw", { exchangeId: exchange.id, hostToken });
  assert.equal(draw.status, 422);
  const dashboard = await invoke("dashboard", { exchangeId: exchange.id, hostToken });
  assert.equal(dashboard.body.exchange.status, "draft");
});
test.after(() => {
  globalThis.fetch = savedFetch;
  process.env.SUPABASE_URL = savedUrl;
  process.env.SUPABASE_SECRET_KEY = savedKey;
});
