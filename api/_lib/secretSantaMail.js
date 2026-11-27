import tls from "node:tls";
import { randomBytes } from "node:crypto";

const FROM = "RosieVerse750@gmail.com";
const SERVER = "smtp.gmail.com";
const PORT = 465;
const PUBLIC_ORIGIN = "https://rosie-app-git.vercel.app";
// TeddyVerse piggybacks on this same Gmail service (Mitchell, 2026-11-26):
// same sender account, Teddy-branded copy, art and guest links. The brand is
// derived from the host the request arrived on (see api/secret-santa.js).
const BRANDS = {
  rosie: {
    origin: PUBLIC_ORIGIN, pet: "Rosie", possessive: "Rosie's",
    banner: "rosie-holiday-banner.jpg",
    bannerAlt: "Rosie in her festive Secret Santa tuxedo and Santa hat",
    crestAlt: "Rosie's holiday seal",
    envelopeAlt: "Rosie's golden sealed envelope",
    giftsAlt: "Rosie's festive collection of beautifully wrapped Christmas presents",
    expressionLine: "Rosie will maintain a perfectly inscrutable expression.",
    wagLine: "Warm wishes and a very discreet wag,",
    fromName: "Rosie's Secret Santa"
  },
  teddy: {
    origin: "https://teddyverse26.vercel.app", pet: "Teddy", possessive: "Teddy's",
    banner: "teddy-holiday-banner.jpg",
    bannerAlt: "Teddy in his festive Secret Santa tuxedo and Santa hat",
    crestAlt: "Teddy's holiday seal",
    envelopeAlt: "Teddy's golden sealed envelope",
    giftsAlt: "Teddy's festive collection of beautifully wrapped Christmas presents",
    expressionLine: "Teddy will be grinning far too hard to give anything away \u2014 the secret is still safe.",
    wagLine: "Warm wishes and a very joyful tail-wave,",
    fromName: "Teddy's Secret Santa"
  }
};
export function santaBrand(value) { return value === "teddy" ? "teddy" : "rosie"; }
function brandOf(value) { return BRANDS[santaBrand(value)]; }

export function mailConfigured() {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.ROSIE_GMAIL_ADDRESS || "") &&
    Boolean((process.env.ROSIE_GMAIL_APP_PASSWORD || "").replace(/\s/g, ""));
}
export function mailSender() { return process.env.ROSIE_GMAIL_ADDRESS || FROM; }
export function privateGuestUrl(exchangeId, guestId, token, brand) {
  return brandOf(brand).origin + "/#randomizers?guest=" + exchangeId + "." + guestId + "." + token;
}
function safeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function wrapped64(value) {
  return Buffer.from(value, "utf8").toString("base64").match(/.{1,76}/g).join("\r\n");
}
function mimeHeader(value) { return "=?UTF-8?B?" + Buffer.from(String(value), "utf8").toString("base64") + "?="; }
function emailArt(file, alt, width, extraStyle = "", base = PUBLIC_ORIGIN + "/randomizers/secret-santa/email/") {
  return '<img src="' + base + file + '" width="' + width + '" alt="' + safeHtml(alt) +
    '" border="0" style="display:block;width:100%;max-width:' + width +
    'px;height:auto;border:0;outline:none;text-decoration:none;' + extraStyle + '">';
}

/**
 * Plain-text and hosted-image HTML renditions share exactly the same guest
 * capability. This renderer intentionally NEVER includes assignment names.
 */
export function renderSecretSantaEmail({ exchange, guest, kind, url, brand }) {
  const B = brandOf(brand);
  const ART = B.origin + "/randomizers/secret-santa/email/";
  if (!["registration", "draw"].includes(kind)) throw new Error("Unknown mail type.");
  if (typeof guest.email !== "string" || !/^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/.test(guest.email))
    throw new Error("Invalid recipient email.");
  if (typeof url !== "string" || !url.startsWith(B.origin + "/#randomizers?guest="))
    throw new Error("A private guest invitation link is required.");

  const name = String(guest.name || "friend").trim().slice(0, 60);
  const exchangeName = String(exchange.title || B.possessive + " Secret Santa").slice(0, 100);
  const registration = kind === "registration";
  const subject = registration
    ? B.pet + " has a holiday secret. You're on the list."
    : "The names are drawn. " + B.pet + " isn't telling.";
  const preheader = registration
    ? "Your place is reserved. Your private Secret Santa envelope is inside."
    : "One sealed envelope. One very important secret. Open yours inside.";
  const eyebrow = registration ? "AN OFFICIAL HOLIDAY WELCOME" : "A VERY PRIVATE HOLIDAY DISPATCH";
  const headline = registration ? "You're on the list." : "The names are drawn.";
  const italicLine = registration
    ? B.pet + " checked it twice. The paperwork was mostly ceremonial."
    : B.pet + " knows. " + B.pet + " isn't telling.";
  const intro = registration
    ? "Your place in " + exchangeName + " is officially reserved. The stockings are under surveillance, and " + B.pet + " has set aside a private envelope with your name on it."
    : "The draw for " + exchangeName + " is complete. One very special name is waiting inside your sealed envelope. " + B.pet + " has been entrusted with the secret and is taking the responsibility rather seriously.";
  const next = registration
    ? "Your envelope keeps your wishlist safe and lets you change your gift ideas whenever inspiration strikes. After the drawing, return to the same link to learn whose holiday you'll brighten."
    : "Open your envelope to discover who you're shopping for, along with their personal wishlist and product links. " + B.expressionLine;
  const noteHeading = registration ? "A NOTE FROM THE NORTH PAW" : "YOUR MISSION, SHOULD YOU ACCEPT IT";
  const note = registration
    ? "The names have not been drawn yet. Your private link is yours to keep, and it will be ready for the big reveal."
    : "Make one person's holiday a little brighter. Protect the secret at all costs. Especially from the group chat.";
  const button = registration ? "OPEN MY PRIVATE ENVELOPE" : "BREAK THE SEAL";
  const small = registration
    ? "Your personal link also lets you update your wishlist. Please keep it private."
    : "Your assignment is visible only through your personal link. Please don't forward it.";
  const signoff = registration
    ? "A little mystery makes the holidays brighter."
    : "Discretion is the greatest gift. After the actual gift, of course.";

  const text = [
    B.pet.toUpperCase() + "'S SECRET SANTA", "",
    "Hello " + name + ",", "",
    headline, italicLine, "", intro, "", next, "",
    noteHeading, note, "", button + ":", url, "",
    small, "", signoff, "", B.wagLine, B.pet
  ].join("\n");

  // Layout is a narrow, single-column table with inline styles. Every essential
  // message remains readable when mail clients block external images.
  const mainArt = emailArt(
    registration ? "invitation-scroll.png" : "sealed-envelope.png",
    registration ? "An elegant holiday invitation scroll" : B.envelopeAlt,
    registration ? 374 : 440, "", ART
  );
  const giftsArt = emailArt(
    "holiday-gifts.png",
    B.giftsAlt,
    405, "", ART
  );
  const html = '<!doctype html><html lang="en"><head>' +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">' +
    '<title>' + safeHtml(subject) + '</title></head>' +
    '<body style="margin:0;padding:0;background-color:#1f1420;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">' +
    '<div style="display:none!important;font-size:1px;line-height:1px;color:#1f1420;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">' + safeHtml(preheader) + '</div>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#1f1420" style="border-collapse:collapse;background-color:#1f1420"><tr>' +
    '<td align="center" style="padding:8px 7px 28px">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="680" style="width:100%;max-width:680px;border-collapse:separate;border:1px solid #b99257;background-color:#fff7e9">' +
    '<tr><td align="center" bgcolor="#2e1729" style="background-color:#2e1729;line-height:0;padding:0;">' +
    emailArt(B.banner, B.bannerAlt, 680, "", ART) +
    '</td></tr>' +
    '<tr><td bgcolor="#2e1729" align="center" style="background-color:#2e1729;padding:7px 12px 8px;border-bottom:2px solid #c4a164">' +
    '<span style="font:700 11px/1.6 Arial,Helvetica,sans-serif;letter-spacing:2.4px;color:#f5d9a3">' + B.pet.toUpperCase() + '&#39;S SECRET SANTA &nbsp; &#10022; &nbsp; 2026</span>' +
    '</td></tr>' +
    '<tr><td align="center" bgcolor="#fff7e9" style="background-color:#fff7e9;padding:17px 20px 1px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td align="center">' +
    '<span style="color:#997340;font:700 10px/1.6 Arial,Helvetica,sans-serif;letter-spacing:2.5px">' + safeHtml(eyebrow) + '</span>' +
    '<h1 style="font:normal 41px/1.13 Georgia,\'Times New Roman\',serif;letter-spacing:-.6px;margin:8px 0 5px;color:#642840">' + safeHtml(headline) + '</h1>' +
    '<p style="font:italic 16px/1.6 Georgia,\'Times New Roman\',serif;color:#936f47;margin:0 0 3px">' + safeHtml(italicLine) + '</p>' +
    '</td></tr></table></td></tr>' +
    '<tr><td align="center" bgcolor="#fff7e9" style="padding:0 8px 2px;background-color:#fff7e9">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center">' +
    mainArt +
    '</td></tr></table></td></tr>' +
    '<tr><td bgcolor="#fff7e9" style="background-color:#fff7e9;padding:4px 34px 1px">' +
    '<p style="font:18px/1.5 Georgia,\'Times New Roman\',serif;color:#6a3047;margin:0 0 17px">Dear ' + safeHtml(name) + ',</p>' +
    '<p style="font:16px/1.7 Georgia,\'Times New Roman\',serif;color:#443238;margin:0 0 17px">' + safeHtml(intro) + '</p>' +
    '<p style="font:16px/1.7 Georgia,\'Times New Roman\',serif;color:#443238;margin:0 0 20px">' + safeHtml(next) + '</p>' +
    '</td></tr>' +
    '<tr><td bgcolor="#fff7e9" style="background-color:#fff7e9;padding:3px 34px 4px">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f5e9d0" style="border-collapse:collapse;background-color:#f5e9d0;border-top:1px solid #e5cda7;border-bottom:1px solid #e5cda7">' +
    '<tr><td align="center" style="padding:20px 18px">' +
    '<p style="color:#7b5741;font:700 10px/1.5 Arial,Helvetica,sans-serif;letter-spacing:1.6px;margin:0 0 7px">' + safeHtml(noteHeading) + '</p>' +
    '<p style="color:#664d45;font:15px/1.6 Georgia,\'Times New Roman\',serif;margin:0">' + safeHtml(note) + '</p>' +
    '</td></tr></table></td></tr>' +
    '<tr><td bgcolor="#fff7e9" align="center" style="background-color:#fff7e9;padding:0 18px 0">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center">' +
    giftsArt + '</td></tr></table></td></tr>' +
    '<tr><td bgcolor="#fff7e9" align="center" style="background-color:#fff7e9;padding:4px 22px 10px">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td align="center" bgcolor="#692e48" style="background-color:#692e48;border:1px solid #d3ad69;border-radius:5px">' +
    '<a href="' + safeHtml(url) + '" target="_blank" style="display:inline-block;padding:17px 27px;text-decoration:none;color:#fff9e9;font:700 13px/1.5 Arial,Helvetica,sans-serif;letter-spacing:1.05px">' + safeHtml(button) + '</a>' +
    '</td></tr></table></td></tr>' +
    '<tr><td bgcolor="#fff7e9" align="center" style="background-color:#fff7e9;padding:5px 28px 27px">' +
    '<p style="color:#846e63;font:13px/1.6 Arial,Helvetica,sans-serif;margin:7px 0 12px">' + safeHtml(small) + '</p>' +
    '<p style="color:#94734e;font:12px/1.6 Arial,Helvetica,sans-serif;margin:0">Button not opening? <a href="' + safeHtml(url) + '" style="color:#6c314c;text-decoration:underline">Use your private link</a>.</p>' +
    '</td></tr>' +
    '<tr><td bgcolor="#291624" align="center" style="background-color:#291624;border-top:3px solid #bc925b;padding:22px 26px 25px">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">' +
    emailArt("rosie-crest.png", B.crestAlt, 84, "", ART) + '</td></tr></table>' +
    '<p style="color:#f1d6a2;font:italic 16px/1.5 Georgia,\'Times New Roman\',serif;margin:12px 0 7px">' + safeHtml(signoff) + '</p>' +
    '<p style="font:12px/1.6 Georgia,\'Times New Roman\',serif;color:#e9d2be;margin:0">' + safeHtml(B.wagLine) + '<br><strong style="font:italic 19px Georgia,\'Times New Roman\',serif;color:#f8e6bf">' + B.pet + '</strong></p>' +
    '</td></tr></table>' +
    '<p style="color:#c9b7bd;font:11px/1.5 Arial,Helvetica,sans-serif;text-align:center;padding:16px 7px 0;max-width:570px;margin:0">' +
    'This message was sent to you because you joined a private gift exchange. ' +
    'If this wasn&#39;t you, simply disregard it.</p>' +
    '</td></tr></table></body></html>';
  return { subject, preheader, text, html };
}
export function composeSecretSantaMail({ exchange, guest, kind, url, brand }) {
  const B = brandOf(brand);
  const { subject, text, html } = renderSecretSantaEmail({ exchange, guest, kind, url, brand });
  const boundary = santaBrand(brand) + "_" + randomBytes(12).toString("hex");
  const sender = mailSender();
  const message = [
    "From: " + mimeHeader(B.fromName) + " <" + sender + ">",
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
