# Rosie’s Reminders - implementation handoff

Branch: `work/rosies-reminders-organizer-20261011`

## Scope
- Responsive RosieVerse organizer at `/#reminders`; landing-page entry added without changing the five existing bottom-nav buttons.
- Day timeline and month calendar with dynamic event indicators.
- Create/edit/delete task, appointment, shopping item; mark complete, including per-occurrence completion on daily/weekly/monthly recurrence.
- Optional time, notes and priority fields; high-priority highlight.
- Multiple notes with edit-on-type local autosave; goals with 25%-increment progress and gratitude journal.
- JSON export/import for manual backup and recovery.
- Data stored in `localStorage` under `rosieverse.reminders.v1`; **single-browser only**. No sign-in system, cross-device sync, or background push notifications in this branch.
- No seed/demo items baked into interface or persistent data.

## Installed artwork (committed to this branch)
The approved binary assets are committed at these paths (the ZIP is an optional backup):
- `public/rosieverse/reminders/hero-mobile.webp` - the approved user-supplied hero including title.
- `public/rosieverse/reminders/hero-desktop.webp` - optimized desktop copy.
- `public/rosieverse/reminders/cards/{tasks,shopping,appointments,notes,goals}.webp` - text-free decorative crops.
- `public/rosieverse/reminders/textures/parchment.webp` - seamless texture.
- `public/rosieverse/reminders/icons/{tasks,shopping,appointments,notes,goals}.webp` - five transparent 320 x 320 antique-gold medallion illustrations, separate from live text labels.

The page has graceful CSS fallbacks if assets are unavailable. The shopping vignette includes dog treats, toys, food and accessories. Both hero sizes are selected responsively. The fifth section is **Goals & Gratitude**, not Habits & Goals.

## Manual mobile acceptance checklist
1. Open `/#reminders` on a 320px iPhone viewport and a modern 390px iPhone viewport. Hero shows original Rosie without duplicate titles. Date panel and feature tiles fit without horizontal overflow.
2. Add a reminder due today, edit title/time/priority, complete, reload, confirm saved.
3. Create recurring weekly reminder; navigate to next week and ensure its state is independent of the prior week. Test monthly behavior for a day missing in a shorter month (currently skips it).
4. Add an appointment, shopping item, note, goal and gratitude entry; change notes and goal progress, reload and confirm persistence.
5. Export backup, delete an item, import saved backup and verify restoration.
6. Use browser Back and Home, then existing Fortune/Cheese/Captain/Vault/Random pages; check no regressions.
7. Check native iOS date/time keyboard, scroll safe areas, focus behavior and reduced-motion settings.
8. Confirm new user without data sees empty states, not artificial/sample tasks.

## Integration notes
- Live text and dynamic rows use React and CSS, not baked-in image buttons.
- Frontend-only V1 stores everything on the current browser. Connect to account-scoped storage when the separate PIN/login work is ready, with explicit migration from localStorage.
- The Vercel preview deployment is **READY** and builds successfully with all Rosie Reminders asset paths resolving, verified from build logs. The remaining `/captain2-hero.webp` build-time warning predates this feature and is outside its scope. Preview protection requires Vercel SSO, and no interactive iPhone/browser QA has been performed. Do not merge until that testing passes.
- This is a review branch, not a production deployment.

## Artwork and iPhone readability update
- The five original cropped decorative objects now supply crisp standalone illustrated medallions, replacing all generic glyph placeholders. Live feature-card labels remain ordinary React text.
- Feature cards use two-column grid with image-above-label composition, except the full-width Goals & Gratitude card.
- Added extra footer padding so backup controls and explanatory text clear the fixed navigation / iPhone safe area.
- The original WebKit/Chromium QA at 320px, 390px and 768px passed before this visual refinement. A dedicated updated QA run additionally checks each icon's decoding, art/text geometry and footer visibility.
- Preview build successfully compiles on Vercel. The approved hero is unchanged.
