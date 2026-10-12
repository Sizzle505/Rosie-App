// Wall-clock helpers shared by the Cheese Board Exam's timed mode.
export const CHEESE_PREVIEW_MS = 3000;
export const CHEESE_SPRINT_MS = 30000;
export function secondsUntilDeadline(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function beforeDeadline(deadline, now = Date.now()) {
  return Number.isFinite(deadline) && deadline > 0 && now < deadline;
}
