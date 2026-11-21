import { makeHaikuRepairPrompt, makeRosiePrompt } from "./rosiePrompts.js";

const ENDPOINT = "https://api.venice.ai/api/v1/chat/completions";
const MODEL = "olafangensan-glm-4.7-flash-heretic";
const TARGET_METRE = [5, 7, 5];
const KNOWN_SYLLABLES = {
  rosie: 2, quiet: 2, fire: 1, hour: 1, every: 2, flower: 2,
  poem: 2, squirrel: 1, beautiful: 3, people: 2, sometimes: 2,
  everything: 3, ocean: 2, family: 3, journey: 2, thunder: 2,
  fireworks: 2, vacation: 3, japanese: 3, florida: 3
};

export class RosieAIError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function estimateSyllables(line) {
  return line.split(/\s+/).reduce((total, raw) => {
    const word = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (!word) return total;
    if (KNOWN_SYLLABLES[word]) return total + KNOWN_SYLLABLES[word];
    if (word.length <= 3) return total + 1;
    let count = (word.match(/[aeiouy]+/g) || []).length;
    if (word.endsWith("e") && !/[^aeiouy]le$/.test(word) && !/ee$/.test(word)) count -= 1;
    if (/[^aeiouy]es$/.test(word) && !/(ses|zes|ches|shes)$/.test(word)) count -= 1;
    if (/ed$/.test(word) && !/(ted|ded)$/.test(word)) count -= 1;
    return total + Math.max(1, count);
  }, 0);
}

export function meterAssessment(lines) {
  const counts = lines.map(estimateSyllables);
  const deltas = counts.map((count, index) => Math.abs(count - TARGET_METRE[index]));
  return { counts, acceptable: deltas.every(delta => delta <= 1), score: deltas.reduce((a, b) => a + b, 0) };
}

function parseJson(raw) {
  if (typeof raw !== "string" || !raw.trim()) throw new RosieAIError("empty_response");
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a === -1 || b <= a) throw new RosieAIError("invalid_json");
  try { return JSON.parse(text.slice(a, b + 1)); }
  catch { throw new RosieAIError("invalid_json"); }
}

export function validateHaikuContent(value) {
  if (!value || !Array.isArray(value.lines) || value.lines.length !== 3) throw new RosieAIError("invalid_poem");
  const lines = value.lines.map(value => typeof value === "string" ? value.trim() : "");
  if (lines.some(line => line.length < 3 || line.length > 70 || /[\r\n<>]/.test(line))) throw new RosieAIError("invalid_poem");
  return lines;
}

function validateOracleContent(value) {
  if (typeof value?.text !== "string") throw new RosieAIError("invalid_fortune");
  const text = value.text.trim();
  if (text.length < 12 || text.length > 280 || /[\r\n<>]/.test(text)) throw new RosieAIError("invalid_fortune");
  const tone = ["positive", "uncertain", "negative"].includes(value.tone) ? value.tone : "uncertain";
  return { text, tone };
}

async function complete({ key, feature, prompt, signal, temperature }) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: "Bearer " + key.trim(), "Content-Type": "application/json" },
      cache: "no-store",
      signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        store: false,
        temperature: temperature ?? (feature === "haiku" ? 0.77 : 0.72),
        max_tokens: feature === "haiku" ? 260 : 230,
        response_format: { type: "json_object" },
        venice_parameters: { disable_thinking: true, enable_web_search: "off" },
        messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }]
      })
    });
  } catch (error) {
    if (error?.name === "AbortError") throw new RosieAIError("timeout");
    throw new RosieAIError("provider_error");
  }

  if (!response.ok) {
    throw new RosieAIError(response.status === 429 ? "provider_rate_limit" : "provider_error");
  }
  let data;
  try { data = await response.json(); }
  catch { throw new RosieAIError("invalid_json"); }
  if (data?.choices?.[0]?.finish_reason === "length") throw new RosieAIError("truncated_response");
  return parseJson(data?.choices?.[0]?.message?.content);
}

export async function generateRosieAnswer({ feature, input, key }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), feature === "haiku" ? 24500 : 17500);
  try {
    const prompt = makeRosiePrompt(feature, input);
    if (feature === "oracle") {
      return validateOracleContent(await complete({ key, feature, prompt, signal: controller.signal }));
    }

    let firstLines = null;
    let firstError = null;
    let firstMetre = null;
    try {
      const first = await complete({ key, feature, prompt, signal: controller.signal });
      firstLines = validateHaikuContent(first);
      firstMetre = meterAssessment(firstLines);
      if (firstMetre.acceptable) return { lines: firstLines, revised: false };
    } catch (error) {
      firstError = error;
      if (!(error instanceof RosieAIError)) throw error;
      // Provider outages and timeouts should not trigger a second billable call.
      if (!["invalid_json", "invalid_poem", "empty_response", "truncated_response"].includes(error.code)) throw error;
    }

    // One bounded second attempt for malformed output or off-metre poetry.
    const repairedPrompt = makeHaikuRepairPrompt(
      input, firstLines || [], firstMetre?.counts || [], firstLines ? "metre" : "format"
    );
    try {
      const revised = validateHaikuContent(await complete({
        key, feature, prompt: repairedPrompt, signal: controller.signal, temperature: 0.57
      }));
      const repairedMetre = meterAssessment(revised);
      if (repairedMetre.acceptable) return { lines: revised, revised: true };
      // Do not mistake a weak syllable heuristic for proof the poem is defective.
      if (firstLines && firstMetre.score < repairedMetre.score && firstMetre.score <= 3) {
        return { lines: firstLines, revised: false };
      }
      throw new RosieAIError("invalid_metre");
    } catch (error) {
      if (firstError && error?.code === "invalid_json") throw firstError;
      throw error;
    }
  } finally {
    clearTimeout(timer);
  }
}
