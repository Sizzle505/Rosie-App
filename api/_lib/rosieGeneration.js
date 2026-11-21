import { makeHaikuRepairPrompt, makeRosiePrompt } from "./rosiePrompts.js";

const ENDPOINT = "https://api.venice.ai/api/v1/chat/completions";
const MODEL = "olafangensan-glm-4.7-flash-heretic";
// Use the pronunciation dictionary, never a count of written vowel groups.
import { assessHaikuMeter, lineSyllableAssessment } from "./rosieMeter.js";

export function estimateSyllables(line) {
  return lineSyllableAssessment(line, 5).count;
}
export const meterAssessment = assessHaikuMeter;

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
  const timer = setTimeout(() => controller.abort(), feature === "haiku" ? 26000 : 17500);
  try {
    const firstPrompt = makeRosiePrompt(feature, input);
    if (feature === "oracle") {
      return validateOracleContent(await complete({ key, feature, prompt: firstPrompt, signal: controller.signal }));
    }

    let best = null;
    let lastFormatError = null;
    let attemptedRepair = false;

    // Three attempts maximum. CMU pronunciation entries determine metre;
    // the model gets exact per-word feedback for revisions.
    for (let attempt = 0; attempt < 3; attempt++) {
      const prompt = attempt === 0
        ? firstPrompt
        : makeHaikuRepairPrompt(input, best?.lines || [], best?.meter?.rows || [], best ? "metre" : "format");
      if (attempt > 0) attemptedRepair = true;
      try {
        const output = await complete({
          key, feature, prompt, signal: controller.signal,
          temperature: attempt === 0 ? 0.84 : 0.46
        });
        const lines = validateHaikuContent(output);
        const meter = meterAssessment(lines);
        const candidate = { lines, meter, attempt };
        if (!best || meter.score < best.meter.score ||
            (meter.score === best.meter.score && meter.verified && !best.meter.verified)) best = candidate;
        if (meter.verified) return {
          lines, revised: attempt > 0, metre: "verified",
          counts: meter.counts
        };
      } catch (error) {
        if (!(error instanceof RosieAIError)) throw error;
        if (["provider_error", "provider_rate_limit", "timeout"].includes(error.code)) {
          if (!best) throw error;
          break;
        }
        lastFormatError = error;
        // Best poem survives a malformed revision; don't lose an original.
      }
    }
    if (!best) throw lastFormatError || new RosieAIError("invalid_poem");
    return {
      lines: best.lines, revised: attemptedRepair && best.attempt > 0,
      metre: best.meter.verified ? "verified" : "approximate",
      counts: best.meter.counts
    };
  } finally {
    clearTimeout(timer);
  }
}
