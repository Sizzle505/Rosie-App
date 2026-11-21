import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import handler from "../api/rosie-ai.js";

async function invoke(body, method = "POST") {
  const res = {
    code: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  await handler({ method, headers: { "x-forwarded-for": `test-${randomUUID()}` }, body }, res);
  return res;
}

test("only supported feature names and validated input reach the provider", async () => {
  assert.equal((await invoke({ feature: "unknown" })).code, 400);
  assert.equal((await invoke({ feature: "haiku", topic: "", mood: "zen", variation: 0 })).code, 400);
  assert.equal((await invoke({ feature: "haiku", topic: "rain", mood: "wrong", variation: 0 })).code, 400);
  assert.equal((await invoke({ feature: "oracle", question: "" })).code, 400);
  assert.equal((await invoke({}, "GET")).code, 405);
});

test("without a key, AI fails closed so clients can use their curated fallback", async () => {
  const original = process.env.VENICE_API_KEY;
  try {
    delete process.env.VENICE_API_KEY;
    const res = await invoke({ feature: "haiku", topic: "thunderstorm", mood: "zen", variation: 0 });
    assert.equal(res.code, 503);
    assert.equal(res.payload.error, "ai_unavailable");
  } finally {
    if (original === undefined) delete process.env.VENICE_API_KEY;
    else process.env.VENICE_API_KEY = original;
  }
});

test("haiku and oracle keep input details and return bounded parsed output", async () => {
  const originalKey = process.env.VENICE_API_KEY;
  const originalFetch = globalThis.fetch;
  const providerBodies = [];
  process.env.VENICE_API_KEY = "test-key-do-not-deploy";
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    providerBodies.push(body);
    const text = body.messages[0].content.includes("haiku")
      ? JSON.stringify({ lines: ["Thunder shakes the pines", "Rosie sleeps beside the fire", "Rain fades into dawn"] })
      : JSON.stringify({ text: "Yes, take the trip. Even a Shiba knows a good adventure when she sniffs one.", tone: "positive" });
    return { ok: true, json: async () => ({ choices: [{ message: { content: text } }] }) };
  };
  try {
    const haiku = await invoke({ feature: "haiku", topic: "Rosie sleeping through a thunderstorm", mood: "sweet", variation: 0 });
    assert.equal(haiku.code, 200);
    assert.equal(haiku.payload.lines.length, 3);
    assert.equal(haiku.payload.feature, "haiku");
    assert.match(providerBodies[0].messages[1].content, /thunderstorm/);
    const oracle = await invoke({ feature: "oracle", question: "Should I take the trip?" });
    assert.equal(oracle.code, 200);
    assert.equal(oracle.payload.tone, "positive");
    assert.match(providerBodies[1].messages[1].content, /take the trip/);
    assert.equal(providerBodies[0].venice_parameters.enable_web_search, "off");
  } finally {
    if (originalKey === undefined) delete process.env.VENICE_API_KEY;
    else process.env.VENICE_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("rejects malformed upstream output rather than passing it to the UI", async () => {
  const originalKey = process.env.VENICE_API_KEY;
  const originalFetch = globalThis.fetch;
  process.env.VENICE_API_KEY = "test-key-do-not-deploy";
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "not-json" } }] }) });
  try {
    const res = await invoke({ feature: "oracle", question: "What next?" });
    assert.equal(res.code, 503);
    assert.equal(res.payload.error, "ai_unavailable");
  } finally {
    if (originalKey === undefined) delete process.env.VENICE_API_KEY;
    else process.env.VENICE_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});
