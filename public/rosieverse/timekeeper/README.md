# Rosie’s Timekeeper artwork

Add the approved background as **grand-clockwork-hall.jpg** in this directory.

Source: the user-approved 870×1651 image provided on 2026-10-11, featuring Rosie in the clockwork hall and the empty black central dial. This is a static full-page background asset; no timer digits, buttons or navigation should be baked into it.

The React component at `src/RosieTimekeeper.jsx` expects:

`/rosieverse/timekeeper/grand-clockwork-hall.jpg`

The center of the usable dial is 50% across and 42.35% down the artwork. Stopwatch/countdown readout and controls are real DOM elements, not part of the background.

The current connector can commit text but cannot accept the conversation's binary JPEG/WebP payload. Install the provided original JPEG asset before approving the preview or merging PR #67. Keep this image unchanged in future layout iterations.
