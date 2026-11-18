import tls from "node:tls";
import { randomBytes } from "node:crypto";

const FROM = "RosieVerse750@gmail.com";
const SERVER = "smtp.gmail.com";
const PORT = 465;
const PUBLIC_ORIGIN = "https://rosie-app-git.vercel.app";

export function mailConfigured() {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.ROSIE_GMAIL_ADDRESS || "") &&
    Boolean((process.env.ROSIE_GMAIL_APP_PASSWORD || "").replace(/\s/g, ""));
}
export function mailSender() { return process.env.ROSIE_GMAIL_ADDRESS || FROM; }
export function privateGuestUrl(exchangeId, guestId, token) {
  return PUBLIC_ORIGIN + "/#randomizers?guest=" + exchangeId + "." + guestId + "." + token;
}
function safeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function wrapped64(value) {
  return Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g).join("\r\n");
}
function mimeHeader(value) { return "=?UTF-8?B?" + Buffer.from(String(value), "utf8").toString("base64") + "?="; }
export function composeSecretSantaMail({ exchange, guest, kind, url }) {
  if (!["registration", "draw"].includes(kind)) throw new Error("Unknown mail type.");
  if (typeof guest.email !== "string" || !/^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/.test(guest.email))
    throw new Error("Invalid recipient email.");
  const personName = guest.name || "friend";
  const subject = kind === "registration"
    ? "You're in! Your private Rosie Secret Santa invitation"
    : "Rosie has drawn the names - your Secret Santa envelope is ready";
  const opening = kind === "registration"
    ? "You're registered for " + exchange.title + ". Your private invitation is below. Save it - it also lets you update your wishlist."
    : "The names have been drawn for " + exchange.title + ". Your sealed envelope is ready. Open the link to discover your match and see their wishlist.";
  const button = kind === "registration" ? "Open my private invitation" : "Break the seal";
  const text = "Hello " + personName + ",\n\n" + opening + "\n\n" + button + ":\n" + url +
    "\n\nThis is your personal link. Don't forward it to anyone else.\n\nWith love,\nRosie's Secret Santa";
  const html = '<!doctype html><html><body style="background:#1d1018;margin:0;padding:30px 12px;font-family:Georgia,serif;color:#392331"><div style="max-width:540px;margin:auto;border:1px solid #bc9556;border-radius:13px;background:#fff7e8;padding:34px 27px;text-align:center">' +
    '<p style="color:#997339;font:700 11px Arial,sans-serif;letter-spacing:3px">ROSIE\'S SECRET SANTA</p>' +
    '<h1 style="font-weight:normal;font-size:30px;color:#5d2339;margin:12px 0">A little holiday magic</h1>' +
    '<p style="font-size:17px">Hello ' + safeHtml(personName) + ',</p>' +
    '<p style="font-size:15px;line-height:1.6">' + safeHtml(opening) + '</p>' +
    '<p style="margin:32px 0"><a href="' + safeHtml(url) + '" style="display:inline-block;background:#6b213c;color:#fff8e9;border:1px solid #ae8749;border-radius:22px;padding:15px 25px;text-decoration:none;font:700 13px Arial,sans-serif;letter-spacing:.3px">' + safeHtml(button) + '</a></p>' +
    '<p style="font:12px/1.5 Arial,sans-serif;color:#836c52">This invitation is private. Please do not forward it.</p>' +
    '<div style="border-top:1px solid #d5b98c;padding-top:20px;margin-top:24px;color:#7b5a30;font-style:italic">With love, Rosie</div></div></body></html>';
  const boundary = "rosie_" + randomBytes(12).toString("hex");
  const sender = mailSender();
  const message = [
    "From: " + mimeHeader("Rosie's Secret Santa") + " <" + sender + ">",
    "To: <" + guest.email + ">",
    "Subject: " + mimeHeader(subject),
    "Date: " + new Date().toUTCString(),
    "Message-ID: <" + randomBytes(16).toString("hex") + "@gmail.com>",
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
    "X-Auto-Response-Suppress: All",
    "",
    "--" + boundary,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapped64(text),
    "--" + boundary,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrapped64(html),
    "--" + boundary + "--",
    ""
  ].join("\r\n");
  return { to: guest.email, subject, message };
}

function smtpSocket() {
  const socket = tls.connect({ host: SERVER, port: PORT, servername: SERVER, rejectUnauthorized: true });
  socket.setTimeout(20000, () => socket.destroy(new Error("Gmail SMTP timed out.")));
  let raw = "", accumulated = [], reply = null, waiting = null, fatal = null;
  const deliver = item => {
    if (waiting) { const { resolve } = waiting; waiting = null; resolve(item); }
    else reply = item;
  };
  const fail = err => {
    if (!fatal) fatal = err || new Error("Gmail SMTP disconnected.");
    if (waiting) { const { reject } = waiting; waiting = null; reject(fatal); }
  };
  socket.on("error", fail);
  socket.on("close", () => fail(new Error("Gmail SMTP disconnected.")));
  socket.on("data", chunk => {
    raw += chunk.toString("utf8");
    let newline;
    while ((newline = raw.indexOf("\n")) !== -1) {
      const line = raw.slice(0, newline).replace(/\r$/, "");
      raw = raw.slice(newline + 1);
      accumulated.push(line);
      const m = /^(\d{3})([- ])/.exec(line);
      if (m?.[2] === " ") {
        const complete = { status: Number(m[1]), lines: accumulated };
        accumulated = [];
        deliver(complete);
      }
    }
  });
  function read() {
    if (reply) { const r = reply; reply = null; return Promise.resolve(r); }
    if (fatal) return Promise.reject(fatal);
    return new Promise((resolve, reject) => { waiting = { resolve, reject }; });
  }
  function expect(reply, allowed) {
    if (!allowed.includes(reply.status)) throw new Error("Gmail SMTP rejected the operation (" + reply.status + ").");
    return reply;
  }
  async function command(value, statuses) {
    const response = read();
    socket.write(value + "\r\n");
    return expect(await response, statuses);
  }
  return {
    async connect() {
      await new Promise((resolve, reject) => {
        if (socket.authorized) return resolve();
        socket.once("secureConnect", resolve);
        socket.once("error", reject);
      });
      expect(await read(), [220]);
      await command("EHLO rosie-app-git.vercel.app", [250]);
      const password = (process.env.ROSIE_GMAIL_APP_PASSWORD || "").replace(/\s/g, "");
      const credential = Buffer.from("\u0000" + mailSender() + "\u0000" + password).toString("base64");
      await command("AUTH PLAIN " + credential, [235]);
    },
    async send(mail) {
      await command("MAIL FROM:<" + mailSender() + ">", [250]);
      await command("RCPT TO:<" + mail.to + ">", [250, 251]);
      await command("DATA", [354]);
      const response = read();
      // Dot-stuff SMTP DATA even though these multipart payloads normally contain no dot lines.
      socket.write(mail.message.replace(/(^|\r\n)\./g, "$1..") + "\r\n.\r\n");
      expect(await response, [250]);
    },
    async close() {
      if (!socket.destroyed && !fatal) {
        try { await command("QUIT", [221]); } catch { /* best-effort close */ }
      }
      socket.destroy();
    }
  };
}

/** Each callback is invoked after Gmail accepts or rejects the specified message. */
export async function sendGmailBatch(messages, onResult) {
  if (!messages.length) return;
  if (!mailConfigured()) throw new Error("Gmail has not been configured.");
  const smtp = smtpSocket();
  try {
    await smtp.connect();
    for (const entry of messages) {
      try {
        await smtp.send(entry.mail);
        await onResult(entry, true, null);
      } catch (error) {
        await onResult(entry, false, error);
        // SMTP may be in the middle of a transaction. Avoid unsafe reuse.
        break;
      }
    }
  } finally { await smtp.close(); }
}
