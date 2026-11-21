// The AI service is optional. Both experiences retain local curated fallbacks.
export async function generateRosieText(payload, timeoutMs = 19500) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("/api/rosie-ai", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Rosie's inspiration is temporarily unavailable.");
    const data = await response.json();
    if (data.feature !== payload.feature) throw new Error("Invalid response from Rosie.");
    return data;
  } finally {
    window.clearTimeout(timer);
  }
}
