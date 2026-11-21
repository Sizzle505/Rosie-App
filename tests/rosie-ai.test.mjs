import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import handler from "../api/rosie-ai.js";
import { relevantRosieBackground, rosiePersonaFor, ROSIE_BACKGROUND } from "../api/_lib/rosiePersona.js";
import { makeRosiePrompt } from "../api/_lib/rosiePrompts.js";

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
    assert.equal(res.payload.error, "invalid_json");
  } finally {
    if (originalKey === undefined) delete process.env.VENICE_API_KEY;
    else process.env.VENICE_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("Rosie's background contains all canonical facets without flooding generic responses", () => {
  const archive = ROSIE_BACKGROUND.map(item => item.fact).join(" ");
  for (const clue of [
    "Doctor of Cheese", "treats", "naps", "digging", "squirrels", "cats",
    "baths", "vacuum", "mail carrier", "sheds", "pedigree",
    "thunder and fireworks", "Japan", "South Florida", "garbage",
    "leash", "belly scratches", "tail wags"
  ]) assert.match(archive, new RegExp(clue, "i"), clue);
  const neutral = rosiePersonaFor("What should I do about my next job interview?");
  assert.match(neutral, /genius Shiba Inu/);
  assert.match(neutral, /extraordinary longevity/);
  assert.doesNotMatch(neutral, /Doctor of Cheese|cheese|squirrels|treats|naps|mail carrier|vacuum|Japan/i);
  const cheese = rosiePersonaFor("Does aged Manchego taste better than Gouda?");
  assert.match(cheese, /Doctor of Cheese/);
  assert.doesNotMatch(cheese, /mail carrier|baths|pursues squirrels/);
  assert.deepEqual(relevantRosieBackground("How do I prepare for a job interview?"), []);
  assert.ok(relevantRosieBackground("Should I nap, eat cheese, or chase a cat?").length <= 2);
});

test("haiku and Oracle prompts prioritize the actual subject, not a dedication", () => {
  const haiku = makeRosiePrompt("haiku", {
    topic: "Rosie hides from a thunderstorm", mood: "zen", variation: 3
  });
  assert.match(haiku.system, /subject is NOT a dedication/i);
  assert.match(haiku.user, /HAIKU SUBJECT - WRITE ABOUT THIS/);
  assert.match(haiku.user, /thunderstorm/);
  assert.match(haiku.system, /thunder and fireworks frighten her/);
  assert.doesNotMatch(haiku.system, /Doctor of Cheese|mail carrier/);
  const oracle = makeRosiePrompt("oracle", { question: "What should I do about my promotion?" });
  assert.match(oracle.system, /central dilemma/);
  assert.doesNotMatch(oracle.system, /Doctor of Cheese|cheese|treats|mail carrier|squirrels|naps/i);
  assert.match(oracle.user, /promotion/);
});

test("off-meter haiku triggers one subject-preserving revision before display", async () => {
  const originalKey = process.env.VENICE_API_KEY;
  const originalFetch = globalThis.fetch;
  let calls = 0;
  process.env.VENICE_API_KEY = "test-key-do-not-deploy";
  globalThis.fetch = async (_url, init) => {
    calls++;
    const payload = JSON.parse(init.body);
    if (calls === 2) assert.match(payload.messages[1].content, /thunderstorm/);
    const poem = calls === 1
      ? { lines: ["Clouds", "Dogs", "Rain"] }
      : { lines: ["Thunder shakes the pines", "Rosie sleeps beside the fire", "Rain fades into dawn"] };
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(poem) } }] }) };
  };
  try {
    const res = await invoke({ feature: "haiku", topic: "Rosie sleeping during a thunderstorm", mood: "sweet", variation: 1 });
    assert.equal(res.code, 200);
    assert.equal(calls, 2);
    assert.equal(res.payload.revised, true);
    assert.match(res.payload.lines.join(" "), /Thunder/);
  } finally {
    if (originalKey === undefined) delete process.env.VENICE_API_KEY;
    else process.env.VENICE_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("two off-meter originals still succeed and never become canned poems", async () => {
  const originalKey = process.env.VENICE_API_KEY;
  const originalFetch = globalThis.fetch;
  let calls = 0;
  process.env.VENICE_API_KEY = "test-key-do-not-deploy";
  globalThis.fetch = async () => {
    calls++;
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ lines: ["Rain", "Dog", "Sun"] }) } }] }) };
  };
  try {
    const res = await invoke({ feature: "haiku", topic: "The dentist", mood: "existential", variation: 0 });
    assert.equal(calls, 2);
    assert.equal(res.code, 200);
    assert.deepEqual(res.payload.lines, ["Rain", "Dog", "Sun"]);
    assert.equal(res.payload.metre, undefined); // No false 5/7/5 certification on the API.
    assert.equal(res.payload.revised, true);
  } finally {
    if (originalKey === undefined) delete process.env.VENICE_API_KEY;
    else process.env.VENICE_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("consecutive haiku generations return originals instead of failing after the first", async () => {
  const originalKey = process.env.VENICE_API_KEY;
  const originalFetch = globalThis.fetch;
  let requests = 0;
  process.env.VENICE_API_KEY = "test-key-do-not-deploy";
  globalThis.fetch = async (_url, init) => {
    requests++;
    const body = JSON.parse(init.body);
    assert.match(body.messages[1].content, /sunflowers/i);
    // Deliberately imperfect metre, structurally valid and specific.
    const lines = ["Sunflowers lean in", "A watcher at the garden gate", "I approve this sun"];
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ lines }) } }] }) };
  };
  try {
    for (let variation = 0; variation < 3; variation++) {
      const res = await invoke({ feature: "haiku", topic: "sunflowers in the garden", mood: "savage", variation });
      assert.equal(res.code, 200);
      assert.equal(res.payload.feature, "haiku");
      assert.equal(res.payload.lines.length, 3);
    }
    assert.ok(requests >= 3);
  } finally {
    if (originalKey === undefined) delete process.env.VENICE_API_KEY;
    else process.env.VENICE_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("haiku prompts carry a discernible Rosie perspective without obligatory dog clichés", () => {
  const a = makeRosiePrompt("haiku", { topic: "a distant comet", mood: "existential", variation: 0 });
  assert.match(a.system, /intelligent Shiba Inu|brilliant Shiba Inu/);
  assert.match(a.system, /Rosie's own sensibility/);
  assert.match(a.system, /not formulaic references to paws, cheese, fur or barking/);
  assert.match(a.user, /distant comet/);
  assert.doesNotMatch(a.system, /Doctor of Cheese|She pursues squirrels/);
});
