import React, { useEffect, useMemo, useState } from "react";
import "./RosieSecretSanta.css";

const ENDPOINT = "/api/secret-santa";
const SAVE_KEY = "rosie-secret-santa-links-v1";

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(item => item && item.id && item.token).slice(0, 20) : [];
  } catch { return []; }
}
function remember(entry) {
  try {
    const before = readSaved();
    const updated = [entry, ...before.filter(item => !(item.id === entry.id && item.role === entry.role && item.guestId === entry.guestId))].slice(0, 20);
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
  } catch { /* Browsers can disable storage; copied links still work. */ }
}
async function request(action, payload = {}) {
  const response = await fetch(ENDPOINT, {
    method: "POST", cache: "no-store", credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The exchange is temporarily unavailable.");
  return result;
}
function urlFor(type, id, token, guestId) {
  const path = window.location.origin + window.location.pathname;
  return type === "host"
    ? path + "#randomizers?host=" + id + "." + token
    : type === "join"
      ? path + "#randomizers?join=" + id + "." + token
      : path + "#randomizers?guest=" + id + "." + guestId + "." + token;
}
async function copyValue(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const success = document.execCommand("copy");
  input.remove();
  if (!success) throw new Error("Unable to copy. Select the address manually.");
}
const initialForm = { title: "Rosie's Secret Santa", names: "", registration: false, passcode: "" };

function emailDraftsFor(exchange) {
  return Object.fromEntries((exchange?.participants || []).map(person => [person.id, person.email || ""]));
}
function invitationEmailLink(email, name, exchangeTitle, privateLink) {
  const subject = exchangeTitle + " - Your Secret Santa invitation";
  const body = "Hi " + name + ",\n\nYou are invited to " + exchangeTitle +
    ". Here is your personal invitation:\n\n" + privateLink +
    "\n\nPlease keep your assignment secret!";
  return "mailto:" + encodeURIComponent(email) +
    "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}



function blankWish() { return { title: "", url: "" }; }
function GiftRows({ items, onChange }) {
  const rows = items.length ? items : [blankWish()];
  const change = (index, key, value) => onChange(rows.map((item, i) =>
    i === index ? { ...item, [key]: value } : item));
  return <div className="ss-wish-editor">
    {rows.map((item, index) => <div className="ss-wish-editor__row" key={index}>
      <label>Gift idea
        <input maxLength={140} value={item.title} placeholder="A book, favorite snack, or gift idea"
          onChange={event => change(index, "title", event.target.value)} />
      </label>
      <label>Product link (optional)
        <input type="url" maxLength={1000} inputMode="url" value={item.url}
          placeholder="https://..." onChange={event => change(index, "url", event.target.value)} />
      </label>
      <button type="button" aria-label={"Remove gift idea " + (index + 1)}
        className="ss-remove-wish" onClick={() => onChange(rows.filter((_, i) => i !== index))}>×</button>
    </div>)}
    <button type="button" className="ss-button ss-button--quiet ss-add-wish" disabled={rows.length >= 20}
      onClick={() => onChange([...rows, blankWish()])}>+ ADD GIFT IDEA</button>
  </div>;
}
function GiftList({ items }) {
  if (!items?.length) return <p className="ss-hint">No gift ideas added yet.</p>;
  return <ul className="ss-wish-list">{items.map((item, index) =>
    <li key={index}>{item.url
      ? <a href={item.url} target="_blank" rel="noopener noreferrer nofollow">{item.title}</a>
      : <span>{item.title}</span>}</li>)}</ul>;
}
function cleanWishDraft(items) {
  return items.filter(item => item.title.trim() || item.url.trim());
}
function SealedEnvelope({ phase = "sealed" }) {
  const states = {
    sealed: "03-sealed-envelope.webp",
    breaking: "04-breaking-paw-seal.webp",
    open: "05-opened-envelope.webp"
  };
  return <div className={`ss-envelope-art ss-envelope-art--${phase}`} aria-hidden="true">
    <img src={"/randomizers/secret-santa/" + states[phase]} className="ss-envelope-art__image" alt="" loading="lazy" />
  </div>;
}
function ExchangeMeta({ exchange }) {
  return <div className="ss-metadata">
    <span><b>STATUS</b>{exchange?.status === "drawn" ? "Names drawn" : "Awaiting draw"}</span>
  </div>;
}

export default function RosieSecretSanta() {
  const [screen, setScreen] = useState("create");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(initialForm);
  const [saved, setSaved] = useState(readSaved);
  const [auth, setAuth] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [guestData, setGuestData] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [sealPhase, setSealPhase] = useState("sealed");
  const [newGuest, setNewGuest] = useState("");
  const [emailDrafts, setEmailDrafts] = useState({});
  const [giver, setGiver] = useState("");
  const [recipientChoice, setRecipientChoice] = useState("");
  const [rules, setRules] = useState([]);
  const [rulesDirty, setRulesDirty] = useState(false);
  const [joinToken, setJoinToken] = useState(null);
  const [joinAuth, setJoinAuth] = useState(null);
  const [joinMeta, setJoinMeta] = useState(null);
  const [joinForm, setJoinForm] = useState({ name: "", email: "", passcode: "",
    wishlist: [blankWish()] });
  const [guestEmail, setGuestEmail] = useState("");
  const [guestWishes, setGuestWishes] = useState([blankWish()]);
  const [setupCode, setSetupCode] = useState("");

  async function act(operation, callback) {
    setBusy(true); setError(""); setNotice("");
    try { await callback(); }
    catch (err) { setError(err?.message || "Rosie could not complete that operation."); }
    finally { setBusy(false); }
  }
  async function openHost(id, token) {
    await act("dashboard", async () => {
      const result = await request("dashboard", { exchangeId: id, hostToken: token });
      setAuth({ role: "host", id, token });
      setExchange(result.exchange);
      setInvitations(result.invitations || []);
      setJoinToken(result.joinToken || null);
      setEmailDrafts(emailDraftsFor(result.exchange));
      setRules(result.exchange.exclusions || []);
      setRulesDirty(false);
      setRecipient(null);
      setScreen("host");
      remember({ role: "host", id, token, label: result.exchange.title });
      setSaved(readSaved());
    });
  }
  async function openGuest(id, guestId, token) {
    await act("guest", async () => {
      const data = await request("guest", { exchangeId: id, guestId, guestToken: token });
      setAuth({ role: "guest", id, guestId, token });
      setGuestData(data);
      setGuestEmail(data.guest.email || "");
      setGuestWishes(data.guest.wishlist?.length ? data.guest.wishlist : [blankWish()]);
      setRecipient(null);
      setSealPhase("sealed");
      setScreen("guest");
      remember({ role: "guest", id, guestId, token, label: data.exchange.title + " - " + data.guest.name });
      setSaved(readSaved());
    });
  }
  useEffect(() => {
    const fragment = window.location.hash.replace(/^#/, "");
    const query = fragment.includes("?") ? fragment.slice(fragment.indexOf("?") + 1) : "";
    const params = new URLSearchParams(query);
    const hostLink = params.get("host");
    const guestLink = params.get("guest");
    const joinLink = params.get("join");
    if (hostLink) {
      const match = /^([0-9a-f-]{36})\.([0-9a-f]{64})$/i.exec(hostLink);
      if (match) { openHost(match[1], match[2]); return; }
      setError("This organizer link is incomplete.");
    } else if (guestLink) {
      const match = /^([0-9a-f-]{36})\.([0-9a-f-]{36})\.([0-9a-f]{64})$/i.exec(guestLink);
      if (match) { openGuest(match[1], match[2], match[3]); return; }
      setError("This guest invitation is incomplete.");
    } else if (joinLink) {
      const match = /^([0-9a-f-]{36})\.([0-9a-f]{64})$/i.exec(joinLink);
      if (match) { openJoin(match[1], match[2]); return; }
      setError("This shared invitation is incomplete.");
    }
    // Tokens in fragments are never sent to the web server. Once accepted,
    // remove the fragment secret from the address bar to prevent casual copying.
  }, []);

  async function createExchange(event) {
    event.preventDefault();
    await act("create", async () => {
      const names = form.names.split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
      const result = await request("create", { title: form.title, names,
        registration: form.registration, passcode: form.registration ? form.passcode : undefined });
      const token = result.hostToken;
      setAuth({ role: "host", id: result.exchange.id, token });
      setExchange(result.exchange);
      setInvitations(result.invitations);
      setJoinToken(result.joinToken || null);
      setEmailDrafts(emailDraftsFor(result.exchange));
      setRules([]);
      setScreen("host");
      remember({ role: "host", id: result.exchange.id, token, label: result.exchange.title });
      setSaved(readSaved());
      setNotice(form.registration
        ? "Exchange created. Copy the shared invitation below and share the passcode separately."
        : "Exchange created. Share a separate private invitation with each guest.");
    });
  }
  async function refreshHost() {
    if (!auth) return;
    await openHost(auth.id, auth.token);
  }
  async function changeHost(action, params) {
    if (!auth) return;
    await act(action, async () => {
      const result = await request(action, { exchangeId: auth.id, hostToken: auth.token, ...params });
      setExchange(result.exchange);
      setInvitations(result.invitations || []);
      if (result.joinToken) setJoinToken(result.joinToken);
      if (action !== "emails") {
        setRules(result.exchange.exclusions || []);
        setRulesDirty(false);
      }
      if (action === "emails") setEmailDrafts(emailDraftsFor(result.exchange));
      setNotice(action === "draw" ? "The names are drawn and sealed. Send each guest their private link." :
        action === "configureJoin" ? "Shared sign-ups enabled. Copy your invitation link and share its passcode separately." :
        action === "emails" ? "Guest email addresses saved." :
        action === "rules" ? "Assignment restrictions saved." : "Guest list updated.");
      if (action === "add") setNewGuest("");
    });
  }
  async function openJoin(id, token) {
    await act("joinInfo", async () => {
      const result = await request("joinInfo", { exchangeId: id, joinToken: token });
      setJoinAuth({ id, token });
      setJoinMeta(result.exchange);
      setScreen("join");
    });
  }
  async function registerGuest(event) {
    event.preventDefault();
    if (!joinAuth) return;
    await act("join", async () => {
      const data = await request("join", { exchangeId: joinAuth.id, joinToken: joinAuth.token,
        name: joinForm.name, email: joinForm.email, passcode: joinForm.passcode,
        wishlist: cleanWishDraft(joinForm.wishlist) });
      setAuth({ role: "guest", id: data.exchangeId, guestId: data.guest.id, token: data.guestToken });
      setGuestData({ exchange: data.exchange, guest: data.guest });
      setGuestEmail(data.guest.email || "");
      setGuestWishes(data.guest.wishlist?.length ? data.guest.wishlist : [blankWish()]);
      setRecipient(null);
      setScreen("guest");
      remember({ role: "guest", id: data.exchangeId, guestId: data.guest.id,
        token: data.guestToken, label: data.exchange.title + " - " + data.guest.name });
      setSaved(readSaved());
      setNotice("You're registered! Your personal invitation is saved on this device. Copy it for safekeeping.");
    });
  }
  async function saveGuestWishlist(event) {
    event.preventDefault();
    if (!auth || auth.role !== "guest") return;
    await act("saveWishlist", async () => {
      const data = await request("saveWishlist", {
        exchangeId: auth.id, guestId: auth.guestId, guestToken: auth.token,
        email: guestEmail, wishlist: cleanWishDraft(guestWishes)
      });
      setGuestData(data);
      setGuestWishes(data.guest.wishlist?.length ? data.guest.wishlist : [blankWish()]);
      setNotice("Your wishlist and email were saved privately.");
    });
  }
  function addRule() {
    if (!giver || !recipientChoice || giver === recipientChoice) {
      setError("Select two different guests for a restriction."); return;
    }
    if (rules.some(rule => rule.giver === giver && rule.recipient === recipientChoice)) {
      setError("That restriction is already listed."); return;
    }
    setError("");
    setRules(value => [...value, { giver, recipient: recipientChoice }]);
    setRulesDirty(true);
  }
  async function doCopy(value, message) {
    try { await copyValue(value); setNotice(message); setError(""); }
    catch { setError("Copy failed. You can open the link and copy it from your browser address bar."); }
  }
  async function revealName() {
    if (!auth || !guestData) return;
    await act("reveal", async () => {
      const result = await request("reveal", {
        exchangeId: auth.id, guestId: auth.guestId, guestToken: auth.token
      });
      if (!result.recipient) throw new Error("Rosie has not drawn the names yet.");
      setSealPhase("breaking");
      await new Promise(resolve => window.setTimeout(resolve, 650));
      setRecipient(result.recipient);
      setSealPhase("open");
    });
  }
  const people = exchange?.participants || [];
  const unsavedEmailUpdates = people.filter(person =>
    (emailDrafts[person.id] ?? person.email ?? "").trim() !== (person.email || "")
  ).map(person => ({ id: person.id, email: (emailDrafts[person.id] ?? "").trim() }));
  const hasUnsavedEmails = unsavedEmailUpdates.length > 0;
  const nameOf = id => people.find(p => p.id === id)?.name || "Unknown guest";
  const hostLink = auth?.role === "host" ? urlFor("host", auth.id, auth.token) : "";
  const guestLink = auth?.role === "guest" ? urlFor("guest", auth.id, auth.token, auth.guestId) : "";
  const sharedLink = auth?.role === "host" && joinToken ? urlFor("join", auth.id, joinToken) : "";

  return (
    <section className="ss-shell" data-layout-target="randomizers-santa" aria-label="Rosie's Secret Santa">
      <div className="ss-hero ss-hero--preferred">
        <h2 className="ss-screen-reader-only">Rosie's Secret Santa</h2>
        <img className="ss-hero__banner" src="/randomizers/secret-santa/11-preferred-banner.webp"
          alt="Rosie in her black-and-gold casino tuxedo and Santa hat with the Rosie’s Secret Santa plaque" />
        <div className="ss-hero__mobile" aria-hidden="true">
          <div className="ss-hero__mobile-rosie">
            <img src="/randomizers/secret-santa/12-preferred-rosie.webp" alt="" />
          </div>
          <div className="ss-hero__mobile-marquee">
            <img src="/randomizers/secret-santa/13-preferred-marquee.webp" alt="" />
          </div>
          <div className="ss-hero__mobile-props">
            <img className="ss-hero__mobile-gifts" src="/randomizers/secret-santa/07-gift-collection.webp" alt="" loading="lazy" />
            <img className="ss-hero__mobile-envelope" src="/randomizers/secret-santa/03-sealed-envelope.webp" alt="" loading="lazy" />
            <img className="ss-hero__mobile-scroll" src="/randomizers/secret-santa/08-invitation-scroll.webp" alt="" loading="lazy" />
          </div>
        </div>
      </div>

      {error && <div role="alert" className="ss-alert ss-alert--error">{error}</div>}
      {notice && <div role="status" className="ss-alert ss-alert--success">{notice}</div>}

      {screen === "create" && <div className="ss-paper ss-inline-create">
        <img className="ss-inline-create__emblem" src="/randomizers/secret-santa/09-secret-santa-emblem.webp"
          alt="" aria-hidden="true" loading="lazy" />
        <div className="ss-inline-create__intro">
          <span className="ss-eyebrow">ROSIE'S PRIVATE GIFT EXCHANGE</span>
          <h3>Draw the names.<br/>{" "}<em>Keep the secret.</em></h3>
          <p>Enter your guests, create the exchange, then send each person their own private reveal link.</p>
          <img src="/randomizers/secret-santa/08-invitation-scroll.webp" alt="" loading="lazy" />
        </div>
        <div className="ss-inline-create__form">
          <form onSubmit={createExchange}>
            <label>EXCHANGE NAME
              <input required maxLength={100} value={form.title}
                onChange={event => setForm(f => ({ ...f, title: event.target.value }))} />
            </label>
            <label>GUESTS <small>{form.registration ? "Optional - guests can add themselves" : "3–40 names · one per line"}</small>
              <textarea required={!form.registration} rows={5} value={form.names} maxLength={3000}
                placeholder="One guest per line…"
                onChange={event => setForm(f => ({ ...f, names: event.target.value }))} />
            </label>
            <label className="ss-registration-switch">
              <input type="checkbox" checked={form.registration}
                onChange={event => setForm(f => ({ ...f, registration: event.target.checked }))} />
              Let guests join using one shared invitation link
            </label>
            {form.registration && <label>SHARED INVITATION PASSCODE
              <input type="text" inputMode="numeric" autoComplete="off"
                pattern="[0-9]{2,12}" minLength={2} maxLength={12} required
                placeholder="Passcode to give your guests" value={form.passcode}
                onChange={event => setForm(f => ({ ...f, passcode: event.target.value }))} />
            </label>}
            <div className="ss-inline-create__footer">
              <p>No registration required. Each recipient is revealed individually.</p>
              <button className="ss-button" type="submit" disabled={busy}>
                {busy ? "CREATING…" : "CREATE EXCHANGE"}
              </button>
            </div>
          </form>
          {saved.length > 0 && <details className="ss-recent ss-recent--compact">
            <summary>Your saved exchanges ({saved.length})</summary>
            <div className="ss-recent__items">
              {saved.map((entry, i) => <button key={i} type="button" disabled={busy}
                onClick={() => entry.role === "host"
                  ? openHost(entry.id, entry.token)
                  : openGuest(entry.id, entry.guestId, entry.token)}>
                <span>{entry.label || "Secret Santa"}</span>
                <small>{entry.role === "host" ? "Organizer" : "Invitation"}</small>
              </button>)}
            </div>
          </details>}
        </div>
      </div>}


      {screen === "join" && joinMeta && <div className="ss-paper ss-join-card">
        <span className="ss-eyebrow">YOU'RE INVITED</span>
        <h3>{joinMeta.title}</h3>
        {joinMeta.open ? <form onSubmit={registerGuest} className="ss-join-form">
          <p>Enter the invitation passcode, introduce yourself, and add the gifts Rosie should whisper to your Secret Santa.</p>
          <div className="ss-join-fields">
            <label>Your name
              <input required maxLength={60} autoComplete="name" value={joinForm.name}
                onChange={event => setJoinForm(p => ({ ...p, name: event.target.value }))} />
            </label>
            <label>Your email
              <input type="email" required maxLength={254} autoComplete="email" value={joinForm.email}
                onChange={event => setJoinForm(p => ({ ...p, email: event.target.value }))} />
            </label>
            <label>Invitation passcode
              <input type="text" required inputMode="numeric" autoComplete="off" pattern="[0-9]{2,12}"
                value={joinForm.passcode} onChange={event => setJoinForm(p => ({ ...p, passcode: event.target.value }))} />
            </label>
          </div>
          <h4>My gift wishlist</h4>
          <p className="ss-hint">Optional. Add ideas and direct links to products. You can edit these later using your personal invitation.</p>
          <GiftRows items={joinForm.wishlist}
            onChange={wishlist => setJoinForm(p => ({ ...p, wishlist }))} />
          <button className="ss-button ss-join-submit" disabled={busy} type="submit">
            {busy ? "REGISTERING…" : "JOIN ROSIE'S SECRET SANTA"}
          </button>
        </form> : <p>Registration has closed. If you're already participating, use your private invitation link.</p>}
      </div>}

      {screen === "host" && exchange && <div className="ss-paper">
        <div className="ss-section-heading">
          <span>ORGANIZER'S PRIVATE LEDGER</span>
          <h3>{exchange.title}</h3>
          <img className="ss-host-crest" src="/randomizers/secret-santa/09-secret-santa-emblem.webp" alt="" aria-hidden="true" loading="lazy" />
          <ExchangeMeta exchange={exchange} />
        </div>
        <div className="ss-host-tools">
          <p><strong>{people.length} guests</strong> · {exchange.status === "drawn" ? "Assignments sealed" : "Draw not yet conducted"}</p>
          <button type="button" className="ss-button ss-button--quiet" onClick={() => doCopy(hostLink, "Private organizer link copied.")}>COPY ORGANIZER LINK</button>
          <button type="button" className="ss-button ss-button--quiet" onClick={refreshHost} disabled={busy}>REFRESH</button>
        </div>
        <div className="ss-shared-invite">
          <div>
            <span className="ss-eyebrow">ONE LINK FOR EVERYONE</span>
            <h4>Guest self-registration</h4>
            <p>{exchange.joinEnabled
              ? "Guests can join, enter their email, and create gift wishlists. Share the passcode separately."
              : "Enable a reusable invitation so guests can sign themselves up."}</p>
          </div>
          {sharedLink && <div className="ss-shared-invite__link">
            <input readOnly aria-label="Shared guest invitation link" value={sharedLink}
              onFocus={event => event.target.select()} />
            <button className="ss-button" type="button" onClick={() => doCopy(sharedLink, "Shared invitation link copied.")}>
              COPY GUEST INVITE
            </button>
          </div>}
          {exchange.status === "draft" && <div className="ss-shared-invite__code">
            <label>{exchange.joinEnabled ? "Change invitation passcode" : "Choose invitation passcode"}
              <input value={setupCode} type="text" inputMode="numeric" autoComplete="off"
                pattern="[0-9]{2,12}" maxLength={12} placeholder="2-12 digits"
                onChange={event => setSetupCode(event.target.value)} />
            </label>
            <button type="button" className="ss-button ss-button--quiet" disabled={busy || !/^[0-9]{2,12}$/.test(setupCode)}
              onClick={() => { changeHost("configureJoin", { passcode: setupCode }); setSetupCode(""); }}>
              {exchange.joinEnabled ? "UPDATE PASSCODE" : "ENABLE GUEST SIGN-UPS"}
            </button>
          </div>}
        </div>
        <p className="ss-hint">Keep your organizer link private. Anyone who holds a guest invitation link, including the organizer, can open that person's envelope. Share each link directly and discreetly.</p>
        <div className="ss-section-heading ss-section-heading--sm"><span>THE ENVELOPES</span><h4>Guest invitations</h4></div>
        <div className="ss-invite-list">
          {invitations.map((item, index) => {
            const person = people.find(p => p.id === item.id);
            const email = person?.email || "";
            const guestLink = urlFor("guest", exchange.id, item.token, item.id);
            return <div className="ss-invite ss-invite--emails" key={item.id}>
              <div className="ss-invite__identity">
                <span className="ss-invite__number">{String(index + 1).padStart(2, "0")}</span>
                <span className="ss-invite__name">{item.name}</span>
              </div>
              <label className="ss-invite__email">
                <span className="ss-screen-reader-only">Optional email for {item.name}</span>
                <input type="email" inputMode="email" autoComplete="off"
                  aria-label={"Optional email for " + item.name} placeholder="Email (optional)"
                  maxLength={254} disabled={busy || exchange.status !== "draft"}
                  value={emailDrafts[item.id] ?? email}
                  onChange={event => setEmailDrafts(previous => ({ ...previous, [item.id]: event.target.value }))} />
              </label>
              <div className="ss-invite__actions">
                <button type="button" disabled={busy}
                  onClick={() => doCopy(guestLink, "Invitation copied for " + item.name + ".")}>COPY LINK</button>
                {!!email && !hasUnsavedEmails && <a className="ss-invite__mailto"
                  href={invitationEmailLink(email, item.name, exchange.title, guestLink)}
                  aria-label={"Draft invitation email for " + item.name}>DRAFT EMAIL</a>}
                {exchange.status === "draft" && <button type="button" className="ss-small-remove"
                  disabled={busy || hasUnsavedEmails} aria-label={"Remove " + item.name}
                  onClick={() => { if (window.confirm("Remove " + item.name + " from this exchange?")) changeHost("remove", { guestId: item.id }); }}>×</button>}
              </div>
            </div>;
          })}
        </div>
        {people.some(p => p.wishlist?.length) && <div className="ss-host-wishlists">
          <div className="ss-section-heading ss-section-heading--sm">
            <span>WISHES FOR ROSIE</span><h4>Guest wishlists</h4>
          </div>
          {people.filter(p => p.wishlist?.length).map(p => <details key={p.id} className="ss-host-wish">
            <summary>{p.name} · {p.wishlist.length} gift {p.wishlist.length === 1 ? "idea" : "ideas"}</summary>
            <GiftList items={p.wishlist}/>
          </details>)}
        </div>}
        {exchange.status === "draft" && <div className="ss-email-tools">
          <p>Emails are optional and visible only in the organizer's ledger. Save your changes before drawing names or drafting invitations.</p>
          <button type="button" className="ss-button ss-button--quiet"
            disabled={busy || !hasUnsavedEmails}
            onClick={() => changeHost("emails", { updates: unsavedEmailUpdates })}>
            {busy ? "SAVING…" : "SAVE GUEST EMAILS"}
          </button>
        </div>}
        {exchange.status === "draft" && <>
          <div className="ss-addguest">
            <input aria-label="New guest name" maxLength={60} value={newGuest} placeholder="Add another guest" onChange={e => setNewGuest(e.target.value)} />
            <button type="button" className="ss-button ss-button--quiet" disabled={busy || hasUnsavedEmails || !newGuest.trim()} onClick={() => changeHost("add", { name: newGuest })}>ADD GUEST</button>
          </div>
          <div className="ss-section-heading ss-section-heading--sm"><span>02 / HOUSE RULES</span><h4>Who cannot draw whom?</h4></div>
          <p className="ss-hint">Optional directional restrictions. To keep a couple from drawing each other, add both directions.</p>
          <div className="ss-rule-input">
            <select aria-label="Guest who draws" value={giver} onChange={e => setGiver(e.target.value)}>
              <option value="">Person drawing...</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span>cannot draw</span>
            <select aria-label="Excluded recipient" value={recipientChoice} onChange={e => setRecipientChoice(e.target.value)}>
              <option value="">Recipient...</option>
              {people.filter(p => p.id !== giver).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="button" onClick={addRule}>ADD</button>
          </div>
          {rules.length > 0 && <div className="ss-rules">
            {rules.map((rule, index) => <div key={rule.giver + rule.recipient}>
              <span>{nameOf(rule.giver)} cannot draw {nameOf(rule.recipient)}</span>
              <button type="button" aria-label="Remove restriction" onClick={() => { setRules(r => r.filter((_, i) => i !== index)); setRulesDirty(true); }}>×</button>
            </div>)}
          </div>}
          {rulesDirty && <button type="button" className="ss-button ss-button--quiet ss-save-rules" disabled={busy || hasUnsavedEmails}
            onClick={() => changeHost("rules", { exclusions: rules })}>SAVE RESTRICTIONS</button>}
          <div className="ss-draw">
            <img src="/randomizers/secret-santa/09-secret-santa-emblem.webp" alt="" aria-hidden="true"/>
            <div>
              <h4>Ready for Rosie's verdict?</h4>
              <p>The draw is permanent. Afterward, names and restrictions are locked and individual invitations reveal recipients.</p>
            </div>
            <button type="button" className="ss-button" disabled={busy || rulesDirty || hasUnsavedEmails}
              onClick={() => { if (window.confirm("Draw and lock the assignments for all " + people.length + " guests?")) changeHost("draw", {}); }}>
              {busy ? "DRAWING..." : "DRAW THE NAMES"}
            </button>
          </div>
        </>}
        {exchange.status === "drawn" && <div className="ss-finished">
          <img src="/randomizers/secret-santa/07-gift-collection.webp" alt="" aria-hidden="true" loading="lazy"/>
          <strong>✦ THE HOUSE HAS SPOKEN ✦</strong>
          <p>Every person has one recipient. Individual assignments are only disclosed through private invitation links.</p>
        </div>}
        <button type="button" className="ss-text-link" onClick={() => { setScreen("create"); setAuth(null); }}>BACK TO SECRET SANTA</button>
      </div>}

      {screen === "guest" && guestData && <div className="ss-guest">
        <div className="ss-paper ss-guest__details">
          <span className="ss-eyebrow">A PRIVATE ENVELOPE FOR</span>
          <h3>{guestData.guest.name}</h3>
          <p>You're part of <strong>{guestData.exchange.title}</strong>.</p>
          <ExchangeMeta exchange={guestData.exchange} />
          <p className="ss-hint">Only the holder of this invitation link can open this envelope. Keep it to yourself.</p>
          <button type="button" className="ss-button ss-button--quiet" onClick={() => doCopy(guestLink, "Your private link was copied.")}>COPY MY LINK</button>
          <p className="ss-hint">Your personal link lets you return and edit your gifts from another device. Keep it private.</p>
          <button type="button" className="ss-text-link" onClick={() => openGuest(auth.id, auth.guestId, auth.token)} disabled={busy}>REFRESH EXCHANGE</button>
        </div>
        <div className="ss-reveal">
          <img className="ss-reveal__frame" src="/randomizers/secret-santa/10-ornamental-frame.webp" alt="" aria-hidden="true" loading="lazy" />
          <span className="ss-eyebrow">SEALED BY ROSIE</span>
          <SealedEnvelope phase={sealPhase} />
          {recipient ? <div className="ss-recipient" aria-live="polite">
            <img src="/randomizers/secret-santa/06-recipient-card.webp" alt="" aria-hidden="true" loading="lazy" />
            <small>YOU ARE SHOPPING FOR</small>
            <strong>{recipient.name}</strong>
            <p>A secret worth keeping. Happy gifting!</p>
            <div className="ss-recipient__wishes"><strong>THEIR WISHLIST</strong>
              <GiftList items={recipient.wishlist} /></div>
          </div> :
            guestData.exchange.status === "drawn" ?
              <button type="button" className="ss-button" disabled={busy} onClick={revealName}>{busy ? "OPENING..." : "BREAK THE SEAL"}</button> :
              <p className="ss-waiting">Your envelope is sealed until Rosie draws the names.</p>}
        </div>
      </div>}

      {screen === "guest" && guestData && <div className="ss-paper ss-guest-wishlist">
        <span className="ss-eyebrow">ROSIE'S GIFT LEDGER</span>
        <h3>My private wishlist</h3>
        <p>Your ideas are shown to the person who draws your name once the exchange is drawn.</p>
        <form onSubmit={saveGuestWishlist}>
          <label>Email address
            <input type="email" maxLength={254} autoComplete="email" value={guestEmail}
              placeholder="Your email (optional)" onChange={event => setGuestEmail(event.target.value)} />
          </label>
          <GiftRows items={guestWishes} onChange={setGuestWishes} />
          <button className="ss-button" type="submit" disabled={busy}>{busy ? "SAVING…" : "SAVE MY WISHLIST"}</button>
        </form>
      </div>}
      <div className="ss-footer">ROSIE KEEPS HER SECRETS. PLEASE KEEP YOURS.</div>
    </section>
  );
}
