#!/usr/bin/env node
// Admin-only CLI: run on a trusted machine with SUPABASE_URL and a server-side SUPABASE_SECRET_KEY set.
// Never give this script or the service-role key to the browser.
import { db, hashPin } from "../api/_lib/core.js";

const [action, rawUsername, ...nameParts] = process.argv.slice(2);
const username = String(rawUsername || "").trim().toLowerCase();
if (!["create", "reset", "disable", "enable", "unlock"].includes(action) || !/^[a-z0-9_.-]{3,32}$/.test(username)) {
  console.error('Usage: node scripts/rosie-admin.mjs create|reset|disable|enable|unlock USERNAME ["Display Name"]');
  process.exit(2);
}
if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY (legacy SUPABASE_SERVICE_ROLE_KEY also supported; server/admin only).");
  process.exit(2);
}
async function promptPin() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("PIN entry requires an interactive terminal.");
  process.stdout.write("Enter a new 4- or 6-digit PIN (hidden): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  let pin = "";
  try {
    await new Promise((resolve, reject) => {
      const onData = chunk => {
        for (const character of chunk.toString()) {
          if (character === "\u0003") { process.stdin.off("data", onData); reject(new Error("Canceled")); return; }
          if (character === "\r" || character === "\n") { process.stdin.off("data", onData); resolve(); return; }
          if (character === "\b" || character === "\u007f") { pin = pin.slice(0, -1); continue; }
          if (/^[0-9]$/.test(character) && pin.length < 6) pin += character;
        }
      };
      process.stdin.on("data", onData);
    });
  } finally { process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n"); }
  if (!/^(?:[0-9]{4}|[0-9]{6})$/.test(pin)) throw new Error("PIN must be exactly 4 or 6 digits.");
  return pin;
}

try {
  const records = await db(`rosie_users?select=id,username,is_active&username=eq.${encodeURIComponent(username)}&limit=1`);
  const found = records[0];
  if (action === "create") {
    if (found) throw new Error("That username is already reserved.");
    const displayName = nameParts.join(" ").trim() || username;
    if (displayName.length > 80) throw new Error("Display name is too long.");
    const pin = await promptPin();
    await db("rosie_users", { method: "POST", returnRows: false, body: {
      username, display_name: displayName, pin_hash: await hashPin(pin), pin_length: pin.length
    }});
    console.log(`Created account ${username} (${displayName}).`);
  } else {
    if (!found) throw new Error("No such account.");
    const patch = action === "reset" ? await (async () => {
      const pin = await promptPin();
      return { pin_hash: await hashPin(pin), pin_length: pin.length, failed_attempts: 0, locked_until: null };
    })() : action === "unlock" ? { failed_attempts: 0, locked_until: null } : { is_active: action === "enable" };
    await db(`rosie_users?id=eq.${found.id}`, { method: "PATCH", body: patch, returnRows: false });
    if (["reset", "disable"].includes(action)) await db(`rosie_sessions?user_id=eq.${found.id}&revoked_at=is.null`, {
      method: "PATCH", body: { revoked_at: new Date().toISOString() }, returnRows: false
    });
    console.log(`${action} complete for ${username}.`);
  }
} catch (error) {
  console.error("Admin action failed:", error.message);
  process.exitCode = 1;
}
