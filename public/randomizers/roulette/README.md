# Luxury roulette module

This change uses separately addressable vector assets:
- `frame.svg` - stationary ornamental frame.
- `pointer.svg` - stationary ruby-and-gold pointer.
- `crimson-brocade.svg` and `onyx-brocade.svg` - tileable textures clipped to each dynamically generated segment.
- `divider.svg` - reusable gold divider source.

The original Rosie R signet at `/randomizers/rosie-signet.webp` remains the central crest. `RosieRouletteFace.jsx` renders arbitrary wedge paths directly from the number of editable entries; names remain DOM text. The face rotates using the **existing** angle, duration and winning-choice computation. Frame, crest, and pointer do not rotate. This is a scalable vector adaptation of the previously produced modular art package; it does not embed a static full-wheel screenshot.
