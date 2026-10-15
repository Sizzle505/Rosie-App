// Pure calendar, backup and export helpers for Rosie's Reminders.
// Storage remains version 1 so existing reminders and backups stay compatible.
export const dateKey = (date = new Date()) => [
  date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0")
].join("-");
export const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = dateFromKey(value);
  return dateKey(date) === value;
};
export function dateFromKey(value) {
  if (typeof value !== "string") return new Date(NaN);
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
export function datePlus(key, days) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}
export function calendarDelta(start, end) {
  // Calendar-day arithmetic avoids local DST changes.
  const day = key => {
    const [year, month, date] = key.split("-").map(Number);
    return Date.UTC(year, month - 1, date) / 86400000;
  };
  return day(end) - day(start);
}
export function isScheduled(item, key) {
  if (!validDate(key) || !validDate(item?.date) || item.date > key) return false;
  if (item.repeat === "daily") return true;
  if (item.repeat === "weekly") return calendarDelta(item.date, key) % 7 === 0;
  if (item.repeat === "monthly") {
    const last = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0).getDate();
    return Number(key.slice(8)) === Math.min(Number(item.date.slice(8)), last);
  }
  if (item.repeat === "yearly") {
    const month = Number(item.date.slice(5, 7));
    const day = Number(item.date.slice(8));
    // Feb 29 reminders use Feb 28 in non-leap years.
    const year = Number(key.slice(0, 4));
    const leap = new Date(year, 2, 0).getDate() === 29;
    return Number(key.slice(5, 7)) === month && Number(key.slice(8)) ===
      (month === 2 && day === 29 && !leap ? 28 : day);
  }
  return item.date === key;
}
export function doneKey(item, key) {
  return item?.repeat && item.repeat !== "none" ? key : "once";
}
export function isDone(item, key) {
  return Array.isArray(item?.completedDates) && item.completedDates.includes(doneKey(item, key));
}
export function isOverdue(item, today = dateKey()) {
  return item?.category !== "shopping" && validDate(item?.date) &&
    item.date < today && (!item.repeat || item.repeat === "none") && !isDone(item, today);
}
export function nextOccurrence(item, from = dateKey(), horizon = 366) {
  if (!validDate(from) || !validDate(item?.date)) return null;
  const stop = Math.min(Math.max(Number(horizon) || 0, 0), 730);
  for (let offset = 0; offset <= stop; offset++) {
    const key = datePlus(from, offset);
    if (isScheduled(item, key) && !isDone(item, key)) return key;
  }
  return null;
}
export function upcomingOccurrences(items, today = dateKey(), days = 14) {
  return (Array.isArray(items) ? items : []).filter(item => item.category !== "shopping")
    .map(item => ({ item, day: nextOccurrence(item, today, days) }))
    .filter(entry => entry.day !== null)
    .sort((a, b) => a.day.localeCompare(b.day) ||
      (a.item.time || "").localeCompare(b.item.time || "") ||
      a.item.title.localeCompare(b.item.title));
}
export function validateBackup(data) {
  if (!data || data.version !== 1 ||
      !["items", "notes", "goals", "gratitude"].every(k => Array.isArray(data[k])))
    throw new Error("This is not a compatible Rosie Reminders backup.");
  if (data.items.length > 5000 || data.notes.length > 2000 ||
      data.goals.length > 1000 || data.gratitude.length > 5000)
    throw new Error("This backup contains too many entries.");
  const str = (v, max = 20000) => typeof v === "string" ? v.slice(0, max) : "";
  const id = v => str(v, 128) || ("import-" + Math.random().toString(36).slice(2));
  return {
    version: 1,
    items: data.items.filter(x => x && typeof x === "object").map(x => ({
      id: id(x.id), category: ["tasks", "shopping", "appointments"].includes(x.category) ? x.category : "tasks",
      title: str(x.title, 140), detail: str(x.detail, 500),
      date: validDate(x.date) ? x.date : "", time: /^([01]\d|2[0-3]):[0-5]\d$/.test(x.time) ? x.time : "",
      repeat: ["none", "daily", "weekly", "monthly", "yearly"].includes(x.repeat) ? x.repeat : "none",
      priority: x.priority === "high" ? "high" : "normal",
      completedDates: Array.isArray(x.completedDates)
        ? x.completedDates.filter(v => v === "once" || validDate(v)).slice(-1500) : []
    })).filter(x => x.title),
    notes: data.notes.filter(x => x && typeof x === "object").map(x => ({
      id: id(x.id), title: str(x.title, 140), body: str(x.body),
      updatedAt: Number.isFinite(x.updatedAt) ? x.updatedAt : Date.now()
    })),
    goals: data.goals.filter(x => x && typeof x === "object").map(x => ({
      id: id(x.id), title: str(x.title, 140),
      progress: Math.min(100, Math.max(0, Math.round(Number(x.progress) || 0)))
    })),
    gratitude: data.gratitude.filter(x => x && typeof x === "object").map(x => ({
      id: id(x.id), date: validDate(x.date) ? x.date : dateKey(), text: str(x.text, 300)
    }))
  };
}
const escapeIcs = text => String(text ?? "").replace(/\\/g, "\\\\")
  .replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const icsDay = value => value.replace(/-/g, "");
function eventLines(item) {
  const start = icsDay(item.date);
  const timed = /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time);
  const dtstart = timed ? "DTSTART:" + start + "T" + item.time.replace(":", "") + "00"
    : "DTSTART;VALUE=DATE:" + start;
  const end = datePlus(item.date, timed ? 0 : 1);
  const base = dateFromKey(item.date);
  const endDate = new Date(base.getFullYear(), base.getMonth(), base.getDate(),
    timed ? Number(item.time.slice(0, 2)) : 0,
    timed ? Number(item.time.slice(3, 5)) + 30 : 0);
  const local = [endDate.getFullYear(),String(endDate.getMonth()+1).padStart(2,"0"),
    String(endDate.getDate()).padStart(2,"0")].join("");
  const finish = timed ? "DTEND:" + local + "T" +
    String(endDate.getHours()).padStart(2, "0") +
    String(endDate.getMinutes()).padStart(2, "0") + "00"
    : "DTEND;VALUE=DATE:" + icsDay(end);
  const rules = {daily:"FREQ=DAILY",weekly:"FREQ=WEEKLY",monthly:"FREQ=MONTHLY",yearly:"FREQ=YEARLY"};
  return ["BEGIN:VEVENT","UID:" + escapeIcs(item.id) + "@rosieverse.app",
    "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""),
    dtstart,finish,"SUMMARY:" + escapeIcs(item.title),
    ...(item.detail ? ["DESCRIPTION:" + escapeIcs(item.detail)] : []),
    ...(rules[item.repeat] ? ["RRULE:" + rules[item.repeat]] : []),
    "END:VEVENT"];
}
export function calendarIcs(items) {
  const events = (Array.isArray(items) ? items : [])
    .filter(item => item.category !== "shopping" && validDate(item.date))
    .flatMap(eventLines);
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//RosieVerse//Reminders//EN",
    "CALSCALE:GREGORIAN","X-WR-CALNAME:Rosie's Reminders",...events,"END:VCALENDAR",""].join("\r\n");
}
