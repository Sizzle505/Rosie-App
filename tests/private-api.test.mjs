import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { hashPin, verifyPin } from "../api/_lib/core.js";
import login from "../api/auth/login.js";
import sessionRoute from "../api/auth/session.js";
import logout from "../api/auth/logout.js";
import notesRoute from "../api/notes/index.js";
import oneNote from "../api/notes/[id].js";

function response(status, data) {
  return { ok: status >= 200 && status < 300, status, text: async () => data === undefined ? "" : JSON.stringify(data) };
}
function call(handler, { method = "GET", cookie = "", body, query, origin = "http://localhost" } = {}) {
  const headers = { host: "localhost", origin, cookie };
  const res = {
    statusCode: 200, headers: {},
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    end(raw) { this.data = JSON.parse(raw); }
  };
  return Promise.resolve(handler({ method, headers, body, query, socket: { remoteAddress: "127.0.0.1" } }, res)).then(() => res);
}

test("Scrypt hashes are salted and validate only the original PIN", async () => {
  const a = await hashPin("1234"), b = await hashPin("1234");
  assert.notEqual(a, b);
  assert.equal(await verifyPin("1234", a), true);
  assert.equal(await verifyPin("0000", a), false);
  assert.equal(await verifyPin("123456", await hashPin("123456")), true);
});

test("Account lockout, cookie sessions, sign-out, and A/B ownership enforced by API", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "unit-test-only";
  const alice = { id: randomUUID(), username: "alice", display_name: "Alice",
    pin_hash: await hashPin("1234"), pin_length: 4, failed_attempts: 0, locked_until: null, is_active: true };
  const bob = { id: randomUUID(), username: "bob", display_name: "Bob",
    pin_hash: await hashPin("123456"), pin_length: 6, failed_attempts: 0, locked_until: null, is_active: true };
  const users = [alice, bob], sessions = [], notes = [], rateBuckets = new Map();
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url);
    const path = parsed.pathname.replace("/rest/v1/", "");
    const query = parsed.searchParams;
    const body = options.body ? JSON.parse(options.body) : {};
    const method = options.method;
    const filt = (arr) => arr.filter(row =>
      [...query].every(([key, value]) => !["select", "order", "limit"].includes(key) && (
        value === "is.null" ? row[key] == null : String(row[key]) === value.slice(3)
      )));
    if (path === "rpc/rosie_rate_limit") {
      const count = (rateBuckets.get(body.p_key) || 0) + 1;
      rateBuckets.set(body.p_key, count);
      return response(200, { blocked: count > 30 });
    }
    if (path === "rpc/rosie_pin_failure") {
      const u = users.find(x => x.id === body.p_user_id);
      u.failed_attempts += 1;
      if (u.failed_attempts >= 5) u.locked_until = new Date(Date.now() + 900000).toISOString();
      return response(200, { locked_until: u.locked_until });
    }
    if (path === "rpc/rosie_pin_success") {
      const u = users.find(x => x.id === body.p_user_id);
      if (!u.is_active || (u.locked_until && new Date(u.locked_until) > new Date())) return response(200, false);
      u.failed_attempts = 0; u.locked_until = null;
      return response(200, true);
    }
    if (path === "rosie_users") return response(200, filt(users));
    if (path === "rosie_sessions") {
      if (method === "POST") { sessions.push({ id: randomUUID(), revoked_at: null, ...body }); return response(201, []); }
      if (method === "PATCH") { filt(sessions).forEach(x => Object.assign(x, body)); return response(200, []); }
      return response(200, filt(sessions));
    }
    if (path === "rosie_notes") {
      if (method === "POST") {
        const row = { id: randomUUID(), created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(), ...body };
        notes.push(row); return response(201, [row]);
      }
      if (method === "PATCH") {
        const matched = filt(notes); matched.forEach(x => Object.assign(x, body, {updated_at:new Date().toISOString()}));
        return response(200, matched);
      }
      if (method === "DELETE") {
        const matched = filt(notes);
        for (const n of matched) notes.splice(notes.indexOf(n), 1);
        return response(200, matched);
      }
      return response(200, filt(notes));
    }
    throw Error("Unmocked database path: " + path);
  };
  try {
    for (let i = 1; i <= 5; i++) {
      const denied = await call(login, { method: "POST", body: { username: "ALICE", pin: "0000" } });
      assert.equal(denied.statusCode, i === 5 ? 423 : 401, JSON.stringify({ i, data: denied.data, attempts: alice.failed_attempts, until: alice.locked_until }));
    }
    assert.equal(alice.failed_attempts, 5);
    assert.equal((await call(login, { method: "POST", body: { username: "alice", pin: "1234" } })).statusCode, 423);
    alice.locked_until = new Date(Date.now() - 1000).toISOString();
    const aa = await call(login, { method: "POST", body: { username: "ALICE", pin: "1234" } });
    const bb = await call(login, { method: "POST", body: { username: "BOB", pin: "123456" } });
    assert.equal(aa.statusCode, 200);
    assert.equal(bb.statusCode, 200);
    assert.equal(aa.data.user.displayName, "Alice");
    assert.equal(bb.data.user.displayName, "Bob");
    assert.match(aa.headers["set-cookie"], /HttpOnly/);
    assert.match(aa.headers["set-cookie"], /SameSite=Lax/);
    const aCookie = aa.headers["set-cookie"].split(";")[0];
    const bCookie = bb.headers["set-cookie"].split(";")[0];
    assert.equal((await call(sessionRoute, { cookie: aCookie })).data.user.username, "alice");
    assert.equal((await call(sessionRoute, { cookie: bCookie })).data.user.username, "bob");
    assert.equal((await call(notesRoute)).statusCode, 401);

    const note = (await call(notesRoute, {
      method: "POST", cookie: aCookie, body: { title: "Alice only", body: "Private draft" }
    })).data.note;
    assert.equal(notes.length, 1);
    assert.equal((await call(notesRoute, { cookie: aCookie })).data.notes.length, 1);
    assert.equal((await call(notesRoute, { cookie: bCookie })).data.notes.length, 0);
    assert.equal((await call(oneNote, { method: "PATCH", cookie: bCookie, query: { id: note.id },
      body: { body: "Infiltrated" } })).statusCode, 404);
    assert.equal(notes[0].body, "Private draft");
    assert.equal((await call(oneNote, { method: "DELETE", cookie: bCookie, query: { id: note.id } })).statusCode, 404);
    assert.equal(notes.length, 1);
    assert.equal((await call(oneNote, { method: "PATCH", cookie: aCookie, query: { id: note.id },
      body: { body: "Saved edit" } })).statusCode, 200);
    assert.equal(notes[0].body, "Saved edit");
    assert.equal((await call(logout, { method: "POST", cookie: aCookie })).statusCode, 200);
    assert.equal((await call(notesRoute, { cookie: aCookie })).statusCode, 401);
    assert.equal((await call(notesRoute, { cookie: bCookie })).statusCode, 200);
    assert.equal((await call(oneNote, { method: "DELETE", cookie: bCookie, query: { id: note.id } })).statusCode, 404);
    assert.equal((await call(oneNote, { method: "DELETE", cookie: aCookie, query: { id: note.id } })).statusCode, 401);
  } finally {
    globalThis.fetch = original;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});
