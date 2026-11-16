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
const initialForm = { title: "Rosie's Secret Santa", names: "" };

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
  const [giver, setGiver] = useState("");
  const [recipientChoice, setRecipientChoice] = useState("");
  const [rules, setRules] = useState([]);
  const [rulesDirty, setRulesDirty] = useState(false);

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
    if (hostLink) {
      const match = /^([0-9a-f-]{36})\.([0-9a-f]{64})$/i.exec(hostLink);
      if (match) { openHost(match[1], match[2]); return; }
      setError("This organizer link is incomplete.");
    } else if (guestLink) {
      const match = /^([0-9a-f-]{36})\.([0-9a-f-]{36})\.([0-9a-f]{64})$/i.exec(guestLink);
      if (match) { openGuest(match[1], match[2], match[3]); return; }
      setError("This guest invitation is incomplete.");
    }
    // Tokens in fragments are never sent to the web server. Once accepted,
    // remove the fragment secret from the address bar to prevent casual copying.
  }, []);

  async function createExchange(event) {
    event.preventDefault();
    await act("create", async () => {
      const names = form.names.split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
      const result = await request("create", { title: form.title, names });
      const token = result.hostToken;
      setAuth({ role: "host", id: result.exchange.id, token });
      setExchange(result.exchange);
      setInvitations(result.invitations);
      setRules([]);
      setScreen("host");
      remember({ role: "host", id: result.exchange.id, token, label: result.exchange.title });
      setSaved(readSaved());
      setNotice("Exchange created. Share a separate private invitation with each guest.");
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
      setRules(result.exchange.exclusions || []);
      setRulesDirty(false);
      setNotice(action === "draw" ? "The names are drawn and sealed. Send each guest their private link." :
        action === "rules" ? "Assignment restrictions saved." : "Guest list updated.");
      if (action === "add") setNewGuest("");
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
  const nameOf = id => people.find(p => p.id === id)?.name || "Unknown guest";
  const hostLink = auth?.role === "host" ? urlFor("host", auth.id, auth.token) : "";
  const guestLink = auth?.role === "guest" ? urlFor("guest", auth.id, auth.token, auth.guestId) : "";

  return (
    <section className="ss-shell" aria-label="Rosie's Secret Santa">
      <div className="ss-hero ss-hero--preferred">
        <h2 className="ss-screen-reader-only">Rosie's Secret Santa</h2>
        <img className="ss-hero__banner" src="/randomizers/secret-santa/11-preferred-banner.webp"
          alt="Rosie in her black-and-gold casino tuxedo and Santa hat with the Rosie’s Secret Santa plaque" />
        <div className="ss-hero__mobile" aria-hidden="true">
          <img src="/randomizers/secret-santa/12-preferred-rosie.webp" alt="" />
          <img src="/randomizers/secret-santa/13-preferred-marquee.webp" alt="" />
        </div>
      </div>

      {error && <div role="alert" className="ss-alert ss-alert--error">{error}</div>}
      {notice && <div role="status" className="ss-alert ss-alert--success">{notice}</div>}

      {screen === "create" && <div className="ss-paper ss-inline-create">
        <div className="ss-inline-create__intro">
          <span className="ss-eyebrow">ROSIE'S PRIVATE GIFT EXCHANGE</span>
          <h3>Draw the names.<br/><em>Keep the secret.</em></h3>
          <p>Enter your guests, create the exchange, then send each person their own private reveal link.</p>
          <img src="/randomizers/secret-santa/08-invitation-scroll.webp" alt="" loading="lazy" />
        </div>
        <div className="ss-inline-create__form">
          <form onSubmit={createExchange}>
            <label>EXCHANGE NAME
              <input required maxLength={100} value={form.title}
                onChange={event => setForm(f => ({ ...f, title: event.target.value }))} />
            </label>
            <label>GUESTS <small>3–40 names · one per line</small>
              <textarea required rows={6} value={form.names} maxLength={3000}
                placeholder={"Alex\\nJordan\\nTaylor\\nMorgan"}
                onChange={event => setForm(f => ({ ...f, names: event.target.value }))} />
            </label>
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
        <p className="ss-hint">Keep your organizer link private. Anyone who holds a guest invitation link, including the organizer, can open that person's envelope. Share each link directly and discreetly.</p>
        <div className="ss-section-heading ss-section-heading--sm"><span>THE ENVELOPES</span><h4>Guest invitations</h4></div>
        <div className="ss-invite-list">
          {invitations.map((item, index) => <div className="ss-invite" key={item.id}>
            <span className="ss-invite__number">{String(index + 1).padStart(2, "0")}</span>
            <span className="ss-invite__name">{item.name}</span>
            <span className="ss-invite__status">{exchange.status === "drawn" ? "Sealed" : "Invited"}</span>
            <button type="button" onClick={() => doCopy(urlFor("guest", exchange.id, item.token, item.id), "Invitation copied for " + item.name + ".")}>COPY INVITE</button>
            {exchange.status === "draft" && <button type="button" className="ss-small-remove" aria-label={"Remove " + item.name}
              onClick={() => { if (window.confirm("Remove " + item.name + " from this exchange?")) changeHost("remove", { guestId: item.id }); }}>×</button>}
          </div>)}
        </div>
        {exchange.status === "draft" && <>
          <div className="ss-addguest">
            <input aria-label="New guest name" maxLength={60} value={newGuest} placeholder="Add another guest" onChange={e => setNewGuest(e.target.value)} />
            <button type="button" className="ss-button ss-button--quiet" disabled={busy || !newGuest.trim()} onClick={() => changeHost("add", { name: newGuest })}>ADD GUEST</button>
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
          {rulesDirty && <button type="button" className="ss-button ss-button--quiet ss-save-rules" disabled={busy}
            onClick={() => changeHost("rules", { exclusions: rules })}>SAVE RESTRICTIONS</button>}
          <div className="ss-draw">
            <img src="/randomizers/secret-santa/09-secret-santa-emblem.webp" alt="" aria-hidden="true"/>
            <div>
              <h4>Ready for Rosie's verdict?</h4>
              <p>The draw is permanent. Afterward, names and restrictions are locked and individual invitations reveal recipients.</p>
            </div>
            <button type="button" className="ss-button" disabled={busy || rulesDirty}
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
          </div> :
            guestData.exchange.status === "drawn" ?
              <button type="button" className="ss-button" disabled={busy} onClick={revealName}>{busy ? "OPENING..." : "BREAK THE SEAL"}</button> :
              <p className="ss-waiting">Your envelope is sealed until Rosie draws the names.</p>}
        </div>
      </div>}

      <div className="ss-footer">ROSIE KEEPS HER SECRETS. PLEASE KEEP YOURS.</div>
    </section>
  );
}
