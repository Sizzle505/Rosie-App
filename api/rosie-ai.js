import { randomUUID } from "node:crypto";
import { generateRosieAnswer, RosieAIError } from "./_lib/rosieGeneration.js";

export const config = { maxDuration: 30 };

const MOODS = new Set(["zen", "savage", "sweet", "existential"]);
const visits = new Map(); // Best-effort per-instance throttling; not a distributed quota.

function putJson(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(data);
}

function throttle(req) {
  const now = Date.now();
  if (visits.size > 1500) {
    for (const [key, entry] of visits) {
      if (now - entry.dailyStart > 86400000) visits.delete(key);
    }
    if (visits.size > 1500) visits.clear();
  }
  const value = req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || "unknown";
  const ip = String(Array.isArray(value) ? value[0] : value).split(",")[0].trim().slice(0, 100);
  const row = visits.get(ip) || { minuteStart: now, dailyStart: now, minute: 0, day: 0 };
  if (now - row.minuteStart >= 60000) { row.minuteStart = now; row.minute = 0; }
  if (now - row.dailyStart >= 86400000) { row.dailyStart = now; row.day = 0; }
  if (row.minute >= 8 || row.day >= 100) return false;
  row.minute += 1;
  row.day += 1;
  visits.set(ip, row);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return putJson(res, 405, { error: "method_not_allowed" });
  }
  const len = Number(req.headers["content-length"] || 0);
  if (len > 2400) return putJson(res, 413, { error: "request_too_large" });
  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  const feature = body.feature;
  if (feature !== "haiku" && feature !== "oracle") return putJson(res, 400, { error: "invalid_feature" });

  const input = {};
  if (feature === "haiku") {
    if (typeof body.topic !== "string" || !body.topic.trim() || body.topic.length > 100 ||
        !MOODS.has(body.mood) || !Number.isInteger(body.variation) ||
        body.variation < 0 || body.variation > 10000) {
      return putJson(res, 400, { error: "invalid_input" });
    }
    input.topic = body.topic.trim();
    input.mood = body.mood;
    input.variation = body.variation;
  } else {
    if (typeof body.question !== "string" || !body.question.trim() || body.question.length > 160) {
      return putJson(res, 400, { error: "invalid_input" });
    }
    input.question = body.question.trim();
  }
  if (!throttle(req)) return putJson(res, 429, { error: "too_many_requests" });

  const key = process.env.VENICE_API_KEY;
  if (!key || !key.trim()) return putJson(res, 503, { error: "ai_unavailable" });

  try {
    const answer = await generateRosieAnswer({ feature, input, key });
    if (feature === "haiku") {
      return putJson(res, 200, {
        feature, id: "ai-" + randomUUID(), lines: answer.lines, revised: answer.revised,
        metre: answer.metre, counts: answer.counts
      });
    }
    return putJson(res, 200, { feature, ...answer, id: "ai-" + randomUUID() });
  } catch (error) {
    const safeCodes = new Set([
      "invalid_json", "invalid_poem", "invalid_metre", "empty_response",
      "truncated_response", "invalid_fortune", "timeout",
      "provider_rate_limit", "provider_error"
    ]);
    const code = error instanceof RosieAIError && safeCodes.has(error.code)
      ? error.code : "provider_error";
    // Diagnostic category only: never log the private input, API key or provider response.
    console.warn("[rosie-ai]", feature, code);
    return putJson(res, code === "provider_rate_limit" ? 429 : 503, { error: code });
  }
}
