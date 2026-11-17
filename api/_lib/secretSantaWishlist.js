import { createHmac, timingSafeEqual } from "node:crypto";

export function normalizeJoinCode(value) {
  if (typeof value !== "string" || !/^[0-9]{2,12}$/.test(value))
    throw new Error("The invitation passcode must contain 2 to 12 digits.");
  return value;
}

export function deriveJoinToken(hostToken, exchangeId) {
  return createHmac("sha256", Buffer.from(hostToken, "hex"))
    .update("rosie-santa-registration:" + exchangeId).digest("hex");
}

export function joinCodeHash(joinToken, passcode) {
  return createHmac("sha256", Buffer.from(joinToken, "hex"))
    .update("passcode:" + passcode).digest("hex");
}

export function equalHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" ||
      !/^[0-9a-f]{64}$/i.test(a) || !/^[0-9a-f]{64}$/i.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function validateWishlist(input) {
  if (!Array.isArray(input) || input.length > 20)
    throw new Error("A wishlist can contain up to 20 gift ideas.");
  return input.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item))
      throw new Error("Each gift idea needs a name.");
    const title = typeof item.title === "string" ? item.title.trim().replace(/\s+/g, " ") : "";
    if (!title || title.length > 140 || /[<>\x00-\x1f]/.test(title))
      throw new Error("Give each gift idea a name (up to 140 characters).");
    const raw = item.url == null ? "" : item.url;
    if (typeof raw !== "string" || raw.trim().length > 1000)
      throw new Error("Product links must be under 1,000 characters.");
    const url = raw.trim();
    if (url) {
      let parsed;
      try { parsed = new URL(url); }
      catch { throw new Error("Enter a complete product link starting with https://."); }
      if (!["https:", "http:"].includes(parsed.protocol) ||
          !parsed.hostname || parsed.username || parsed.password)
        throw new Error("Only ordinary https:// or http:// product links are allowed.");
    }
    return { title, url };
  });
}
