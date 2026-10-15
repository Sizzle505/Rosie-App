import assert from "node:assert/strict";
import test from "node:test";
import {calendarDelta, isScheduled, isDone, isOverdue, nextOccurrence,
  upcomingOccurrences, calendarIcs, validateBackup, datePlus} from "../src/reminderLogic.js";

const item = (overrides = {}) => ({
  id:"test", category:"tasks", title:"Check on Rosie", detail:"",
  date:"2026-10-14", time:"", repeat:"none", priority:"normal",
  completedDates:[], ...overrides
});

test("recurrence uses calendar dates, not DST-sensitive milliseconds", () => {
  assert.equal(calendarDelta("2026-10-31","2026-11-07"),7);
  assert.equal(isScheduled(item({date:"2026-10-31", repeat:"weekly"}),"2026-11-07"),true);
  assert.equal(isScheduled(item({date:"2026-10-31", repeat:"weekly"}),"2026-11-06"),false);
  assert.equal(datePlus("2026-12-31",1),"2027-01-01");
});
test("monthly 29th, 30th and 31st recur on the last available day", () => {
  const scheduled = day => item({date:"2026-01-"+day,repeat:"monthly"});
  assert.equal(isScheduled(scheduled("31"),"2026-02-28"),true);
  assert.equal(isScheduled(scheduled("30"),"2026-02-28"),true);
  assert.equal(isScheduled(scheduled("29"),"2026-02-28"),true);
  assert.equal(isScheduled(scheduled("30"),"2026-03-30"),true);
  assert.equal(isScheduled(scheduled("30"),"2026-03-31"),false);
});
test("yearly leap-day reminders do not disappear", () => {
  const leap = item({date:"2024-02-29",repeat:"yearly"});
  assert.equal(isScheduled(leap,"2026-02-28"),true);
  assert.equal(isScheduled(leap,"2028-02-29"),true);
  assert.equal(isScheduled(leap,"2027-03-01"),false);
});
test("one-time completion remains complete; repeating completion is occurrence-specific", () => {
  assert.equal(isDone(item({completedDates:["once"]}),"2027-01-01"),true);
  assert.equal(isDone(item({repeat:"daily",completedDates:["2026-10-14"]}),"2026-10-15"),false);
});
test("overdue tasks are recoverable and excluded from upcoming", () => {
  const late = item({date:"2026-10-10"});
  assert.equal(isOverdue(late,"2026-10-14"),true);
  assert.equal(nextOccurrence(late,"2026-10-14",14),null);
  assert.equal(isOverdue({...late,completedDates:["once"]},"2026-10-14"),false);
  assert.equal(upcomingOccurrences([late,item({id:"tomorrow",date:"2026-10-15"})],
    "2026-10-14",14).length,1);
});
test("calendar export escapes text and preserves local times", () => {
  const result = calendarIcs([item({title:"Milk, bread; Rosie",detail:"One\nTwo",time:"23:45"})]);
  assert.match(result,/SUMMARY:Milk\\, bread\\; Rosie/);
  assert.match(result,/DESCRIPTION:One\\nTwo/);
  assert.match(result,/DTSTART:20261014T234500/);
  assert.match(result,/DTEND:20261015T001500/);
  assert.match(result,/END:VCALENDAR/);
});
test("v1 backups are sanitized without erasing valid content", () => {
  const restored = validateBackup({version:1,items:[item()],notes:[{id:"a",title:"Idea",body:"Good"}],
    goals:[{id:"b",title:"Run",progress:135}],gratitude:[]});
  assert.equal(restored.items[0].title,"Check on Rosie");
  assert.equal(restored.goals[0].progress,100);
  assert.throws(()=>validateBackup({version:2,items:[],notes:[],goals:[],gratitude:[]}));
});

test("exported monthly and leap-year events keep last-day behavior", () => {
  const endMonth = calendarIcs([item({date:"2026-01-30",repeat:"monthly"})]);
  assert.match(endMonth,/RRULE:FREQ=MONTHLY;BYMONTHDAY=30,-1;BYSETPOS=1/);
  const leap = calendarIcs([item({date:"2024-02-29",repeat:"yearly"})]);
  assert.match(leap,/RRULE:FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=28,29;BYSETPOS=-1/);
  const alarm = calendarIcs([item({time:"14:30"})]);
  assert.match(alarm,/TRIGGER:-PT10M/);
});
