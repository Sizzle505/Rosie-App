import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/secret-santa.js";
import { composeSecretSantaMail, privateGuestUrl, renderSecretSantaEmail } from "../api/_lib/secretSantaMail.js";

const savedFetch = globalThis.fetch;
const savedUrl = process.env.SUPABASE_URL;
const savedKey = process.env.SUPABASE_SECRET_KEY;
process.env.SUPABASE_URL = "https://example.invalid";
process.env.SUPABASE_SECRET_KEY = "test-service-role-key";
let rows = [];
let notifications = [];
function success(body) {
  return { ok: true, status: 200, text: async () => JSON.stringify(body) };
}
globalThis.fetch = async (url, options) => {
  const u = new URL(url);
  if (u.pathname === "/rest/v1/rpc/rosie_rate_limit") return success({ blocked: false });
  if (u.pathname === "/rest/v1/rosie_santa_notifications") {
    const method = options.method;
    const matches = notifications.filter(row =>
      (!u.searchParams.has("exchange_id") || row.exchange_id === u.searchParams.get("exchange_id").replace("eq.", "")) &&
      (!u.searchParams.has("guest_id") || row.guest_id === u.searchParams.get("guest_id").replace("eq.", "")) &&
      (!u.searchParams.has("kind") || row.kind === u.searchParams.get("kind").replace("eq.", "")) &&
      (!u.searchParams.has("status") || row.status === u.searchParams.get("status").replace("eq.", "")));
    if (method === "GET") return success(matches);
    if (method === "POST") {
      const data = JSON.parse(options.body);
      const row = { status: "pending", attempts: 0, claimed_at: null,
        claim_token: null, sent_at: null, ...data };
      if (notifications.some(n => n.exchange_id === row.exchange_id &&
          n.guest_id === row.guest_id && n.kind === row.kind)) throw new Error("Duplicate notification");
      notifications.push(row);
      return success([row]);
    }
    if (method === "PATCH") {
      const changes = JSON.parse(options.body);
      for (const row of matches) Object.assign(row, changes);
      return success(matches.map(row => ({ ...row })));
    }
    throw new Error("Unexpected notifications call");
  }
  assert.equal(u.pathname, "/rest/v1/rosie_santa_exchanges");
  assert.ok(options.headers.Authorization.startsWith("Bearer "));
  const method = options.method;
  if (method === "POST") {
    const body = JSON.parse(options.body);
    const now = new Date().toISOString();
    const row = { id: crypto.randomUUID(), status: "draft", assignments: {}, exclusions: [],
      created_at: now, updated_at: now, drawn_at: null, budget: "", exchange_date: null, revision: 0, join_enabled: false, ...body };
    rows.push(row);
    return success([row]);
  }
  const id = u.searchParams.get("id")?.replace("eq.", "");
  const matches = rows.filter(row => !id || row.id === id);
  if (method === "GET") return success(matches);
  if (method === "PATCH") {
    const eligible = matches.filter(row =>
      (!u.searchParams.get("status") || row.status === u.searchParams.get("status").replace("eq.", "")) &&
      (!u.searchParams.get("revision") || row.revision === Number(u.searchParams.get("revision").replace("eq.", ""))));
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
  assert.equal(draw.body.mail.configured, false);
  const sendAgain = await invoke("sendMatches", { exchangeId: exchange.id, hostToken });
  assert.equal(sendAgain.status, 200);
  assert.equal(sendAgain.body.mail.configured, false);
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

test("organizer can save, replace and clear optional guest emails without exposing them to participants", async () => {
  const created = await invoke("create", { title: "Email contacts", names: ["Alice", "Blair", "Casey"] });
  assert.equal(created.status, 201);
  const { exchange, hostToken, invitations } = created.body;
  const credentials = { exchangeId: exchange.id, hostToken };
  const guest = exchange.participants[0];
  assert.equal(guest.email, "");

  const forbidden = await invoke("emails", {
    exchangeId: exchange.id, hostToken: "0".repeat(64),
    updates: [{ id: guest.id, email: "alice@example.com" }]
  });
  assert.equal(forbidden.status, 403);

  const invalid = await invoke("emails", {
    ...credentials, updates: [{ id: guest.id, email: "invalid\r\nBcc: malicious@example.com" }]
  });
  assert.equal(invalid.status, 400);

  const saved = await invoke("emails", {
    ...credentials, updates: [
      { id: guest.id, email: " Alice+gift@example.com " },
      { id: exchange.participants[1].id, email: "blair@example.com" }
    ]
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.exchange.participants[0].email, "Alice+gift@example.com");
  assert.equal(saved.body.exchange.participants[1].email, "blair@example.com");
  assert.equal(saved.body.exchange.participants[2].email, "");

  const dashboard = await invoke("dashboard", credentials);
  assert.equal(dashboard.body.exchange.participants[0].email, "Alice+gift@example.com");
  assert.equal(Object.hasOwn(dashboard.body.invitations[0], "email"), false);
  const guestView = await invoke("guest", {
    exchangeId: exchange.id, guestId: invitations[0].id, guestToken: invitations[0].token
  });
  assert.equal(guestView.status, 200);
  assert.equal(guestView.body.guest.email, "Alice+gift@example.com");
  assert.equal(Object.hasOwn(guestView.body.exchange, "participants"), false);

  const cleared = await invoke("emails", {
    ...credentials, updates: [{ id: guest.id, email: "" }]
  });
  assert.equal(cleared.status, 200);
  assert.equal(cleared.body.exchange.participants[0].email, "");
  assert.equal(cleared.body.exchange.participants[1].email, "blair@example.com");

  const draw = await invoke("draw", credentials);
  assert.equal(draw.status, 200);
  const locked = await invoke("emails", { ...credentials, updates: [{ id: guest.id, email: "after@example.com" }] });
  assert.equal(locked.status, 409);
});


test("open invitation requires correct passcode and registers guests with private wishes", async () => {
  const made = await invoke("create", { title: "Rosie's Secret Santa 2026",
    names: [], registration: true, passcode: "67" });
  assert.equal(made.status, 201);
  const { exchange, hostToken, joinToken } = made.body;
  assert.equal(exchange.participants.length, 0);
  assert.equal(exchange.joinEnabled, true);
  assert.match(joinToken, /^[0-9a-f]{64}$/);
  const creds = { exchangeId: exchange.id, joinToken };
  const info = await invoke("joinInfo", creds);
  assert.equal(info.body.exchange.title, "Rosie's Secret Santa 2026");
  assert.equal(info.body.exchange.open, true);
  const invisible = await invoke("joinInfo", { ...creds, joinToken: "0".repeat(64) });
  assert.equal(invisible.status, 403);
  const wrong = await invoke("join", { ...creds, passcode: "68", name: "Jo",
    email: "jo@example.com", wishlist: [] });
  assert.equal(wrong.status, 403);
  const badLink = await invoke("join", { ...creds, passcode: "67", name: "Jo",
    email: "jo@example.com", wishlist: [{ title: "Unsafe", url: "javascript:alert(1)" }] });
  assert.equal(badLink.status, 400);
  const joined = await invoke("join", { ...creds, passcode: "67", name: "Jo",
    email: "jo@example.com", wishlist: [{ title: "Book", url: "https://books.example/1" }] });
  assert.equal(joined.status, 201, JSON.stringify(joined.body));
  const guestCreds = { exchangeId: exchange.id, guestId: joined.body.guest.id,
    guestToken: joined.body.guestToken };
  assert.equal(joined.body.guest.wishlist[0].title, "Book");
  assert.equal(joined.body.guest.email, "jo@example.com");
  assert.equal(Object.hasOwn(joined.body, "participants"), false);
  const repeatName = await invoke("join", { ...creds, passcode: "67", name: "jo",
    email: "someone@example.com", wishlist: [] });
  assert.equal(repeatName.status, 409);
  const repeatEmail = await invoke("join", { ...creds, passcode: "67", name: "Else",
    email: "JO@example.com", wishlist: [] });
  assert.equal(repeatEmail.status, 409);
  const other = await invoke("join", { ...creds, passcode: "67", name: "Sam",
    email: "sam@example.com", wishlist: [] });
  assert.equal(other.status, 201);
  const third = await invoke("join", { ...creds, passcode: "67", name: "Lee",
    email: "lee@example.com", wishlist: [] });
  assert.equal(third.status, 201);
  const update = await invoke("saveWishlist", { ...guestCreds, email: "jo.new@example.com",
    wishlist: [{ title: "Fuzzy slippers", url: "https://shop.example/slippers" },
      { title: "Surprise", url: "" }] });
  assert.equal(update.status, 200);
  assert.equal(update.body.guest.wishlist.length, 2);
  const badOwner = await invoke("saveWishlist", { ...guestCreds, guestToken: "0".repeat(64),
    email: "theft@example.com", wishlist: [] });
  assert.equal(badOwner.status, 403);
  const dashboard = await invoke("dashboard", { exchangeId: exchange.id, hostToken });
  assert.equal(dashboard.body.exchange.participants.length, 3);
  assert.equal(dashboard.body.exchange.participants[0].email, "jo.new@example.com");
  assert.equal(dashboard.body.joinToken, joinToken);
  const guestRead = await invoke("guest", guestCreds);
  assert.equal(guestRead.body.guest.wishlist.length, 2);
  assert.equal(Object.hasOwn(guestRead.body, "participants"), false);
  const draw = await invoke("draw", { exchangeId: exchange.id, hostToken });
  assert.equal(draw.status, 200);
  const revealed = await invoke("reveal", guestCreds);
  assert.equal(revealed.status, 200);
  assert.ok(Array.isArray(revealed.body.recipient.wishlist));
  const afterDraw = await invoke("join", { ...creds, passcode: "67",
    name: "Late", email: "late@example.com", wishlist: [] });
  assert.equal(afterDraw.status, 409);
  const afterEdit = await invoke("saveWishlist", { ...guestCreds, email: "jo.new@example.com",
    wishlist: [{ title: "Fresh list", url: "https://shop.example/fresh" }] });
  assert.equal(afterEdit.status, 200);
});

test("invalid wishlist inputs cannot overwrite a guest's saved list", async () => {
  const made = await invoke("create", { title: "Wishlist safety", names: ["Ash", "Bea", "Cam"] });
  const first = made.body.invitations[0];
  const credentials = { exchangeId: made.body.exchange.id, guestId: first.id, guestToken: first.token };
  const tooMany = await invoke("saveWishlist", { ...credentials,
    wishlist: Array.from({ length: 21 }, (_, i) => ({ title: "Item " + i, url: "" })) });
  assert.equal(tooMany.status, 400);
  const invalid = await invoke("saveWishlist", { ...credentials,
    wishlist: [{ title: "Bad", url: "https://user:password@example.com/gift" }] });
  assert.equal(invalid.status, 400);
  const fresh = await invoke("guest", credentials);
  assert.deepEqual(fresh.body.guest.wishlist, []);
});


test("Gmail messages contain only each guest's private envelope link", () => {
  const link = privateGuestUrl("11111111-2222-4333-8444-555555555555",
    "11111111-2222-4333-8444-666666666666", "ab".repeat(32));
  assert.ok(link.startsWith("https://rosie-app-git.vercel.app/#randomizers?guest="));
  const base = { exchange: { title: "Rosie's Secret Santa 2026" },
    guest: { name: "Amy", email: "amy@example.com" }, url: link };
  const confirmation = composeSecretSantaMail({ ...base, kind: "registration" });
  const matched = composeSecretSantaMail({ ...base, kind: "draw" });
  assert.equal(confirmation.to, "amy@example.com");
  assert.ok(confirmation.message.includes("Content-Type: multipart/alternative"));
  assert.notEqual(confirmation.subject, matched.subject);
  assert.ok(!matched.message.includes("other@example.com"));
  assert.throws(() => composeSecretSantaMail({ ...base,
    guest: { name: "Bad", email: "bad@example.com\r\nBcc:other@example.com" },
    kind: "draw" }));
});
test("festive welcome and draw emails preserve privacy and accessible content", () => {
  const params = {
    exchange: { title: "Rosie's Secret Santa 2026" },
    guest: { name: "Alex", email: "alex@example.com" },
    url: privateGuestUrl("11111111-2222-4333-8444-555555555555",
      "11111111-2222-4333-8444-666666666666", "ab".repeat(32))
  };
  const welcome = renderSecretSantaEmail({ ...params, kind: "registration" });
  const draw = renderSecretSantaEmail({ ...params, kind: "draw" });
  assert.match(welcome.html, /email\/rosie-holiday-banner\.jpg/);
  assert.match(welcome.html, /email\/invitation-scroll\.png/);
  assert.match(draw.html, /email\/sealed-envelope\.png/);
  assert.match(draw.html, /email\/rosie-crest\.png/);
  assert.match(welcome.html, /email\/holiday-gifts\.png/);
  assert.match(draw.html, /email\/holiday-gifts\.png/);
  assert.match(welcome.html, /max-width:680px/);
  assert.match(draw.html, /max-width:680px/);
  assert.match(welcome.html, /padding:8px 7px 28px/);
  assert.match(draw.html, /padding:8px 7px 28px/);
  assert.match(draw.html, /role="presentation"/);
  assert.match(welcome.html, /Dear Alex/);
  assert.match(welcome.html, /OPEN MY PRIVATE ENVELOPE/);
  assert.match(draw.html, /BREAK THE SEAL/);
  assert.match(welcome.text, /You're on the list/);
  assert.match(draw.text, /The names are drawn/);
  assert.ok(welcome.html.includes(params.url));
  assert.ok(draw.html.includes(params.url));
  assert.throws(() => renderSecretSantaEmail({ ...params, url: "https://example.com",
    kind: "draw" }), /private guest invitation link/);
});

test("unauthorized guests cannot access host email controls", async () => {
  const made = await invoke("create", { title: "Mail authorization", names: ["A", "B", "C"] });
  const invite = made.body.invitations[0];
  const unauthorized = await invoke("sendConfirmations", { exchangeId: made.body.exchange.id,
    guestId: invite.id, guestToken: invite.token });
  assert.equal(unauthorized.status, 403);
  const denied = await invoke("mailStatus", { exchangeId: made.body.exchange.id,
    guestId: invite.id, guestToken: invite.token });
  assert.equal(denied.status, 403);
  const hostStatus = await invoke("mailStatus", { exchangeId: made.body.exchange.id,
    hostToken: made.body.hostToken });
  assert.equal(hostStatus.status, 200);
  assert.equal(hostStatus.body.mail.configured, false);
});

test.after(() => {
  globalThis.fetch = savedFetch;
  process.env.SUPABASE_URL = savedUrl;
  process.env.SUPABASE_SECRET_KEY = savedKey;
});
