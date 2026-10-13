# Rosie's QR Atelier - Signature Artwork Production Sheet

This document specifies optional premium art assets to extend the functioning, vector-generated QR customization. The hero illustration, large gilded frame, workbench panel, and three stationery finishes already exist and should not be replaced.

## Scanning protection - mandatory

- A regular QR code is a square arrangement of modules. Never stretch, rotate, cover, or distort its three finder patterns.
- Keep at least four *full module widths* of uniformly light, unprinted space around the QR grid. The present generator uses eight.
- Decorative canine elements belong **outside** the protected quiet zone wherever possible.
- Deep Emerald (`#062f27`), Obsidian (`#14202a`), and Burgundy (`#54152e`) are the dark functional inks; gold is used on the outer ornaments and frames.
- A central paw is optional, limited in size, rendered with H error correction and flagged for phone testing. Never assume a code is reliable solely because a browser exports it.
- Test an exported image by scanning with at least two phones, at its intended printed size and under poor lighting, before using for mass circulation.
- At least 25 mm of code width is a useful starting point for ordinary close-range printing. Increase size for longer data or longer viewing distances. Do not represent one print size as universally sufficient.

## Four companion transparent art assets - future luxury enhancement

All should have transparent backgrounds, clean masks with no matte or drop-shadow crop, and generous internal clearance. Produce master PNG or WebP with editable vector equivalents where feasible.

1. **Royal Rosie Seal** - 1024 x 1024 px. Symmetric antique-gold filigree, thin burgundy enamel details, a small Rosie crest *above* a large central transparent square. Central transparent opening at least 67% of width; the QR and its quiet zone are composited later.
2. **Rosie's Paw Print** - 1024 x 1024 px. A gold embossed paw crown above a square central opening and delicate paw touches along the outer corners. Do not surround the actual module matrix with individual random squares that might resemble QR data.
3. **The Golden Bone** - 1600 x 1100 px. Bone silhouette around a central square code inset, antique-gold engraved edges on emerald velvet. The digital renderer positions an untouched square QR with the full quiet margin inside the center.
4. **Atelier Original** - 1024 x 1024 px. Gilded technical engraving frame, small cogwork and precision soldering pen details, warm ivory square central opening. Reference the existing Victorian/steampunk workbench rather than a new visual language.

## Optional identity cameo

- Asset: `qr-rosie-cameo.webp`, transparent 768 x 768 px, tight but complete head silhouette with a subtle gold stroke.
- Must accurately match the selected Rosie artwork used elsewhere on this page.
- Do not automatically place the full portrait in the QR's central data field. Default to the separate ornamental seal until a portrait center overlay passes actual scan tests across dense examples.
- For smaller codes, a tiny machine-drawn paw is the available functioning alternative.

## Functionality already introduced in the signature branch

- Pure browser QR creation from the existing eight QR payload types.
- Five motifs: Classic, Royal Rosie Seal, Paw Print, Golden Bone, and Atelier Original.
- Three high-contrast ink palettes, softened modules and finder eyes, optional small central paw.
- Live QR preview, PNG, SVG, designed printable cards, sharing, saved codes and on-device collection.
- Optional browser QR decode check when `BarcodeDetector` exists; otherwise explicitly require a real phone scan.
- No third-party analytics, QR shortening backend, or redirect service is needed.

## Acceptance criteria for next art pass

- Verify each new asset over both iPhone-sized and desktop previews. Keep title, Rosie and existing gold frame in their present positions.
- Compare all five motifs on a short URL, a Wi-Fi payload, and a contact vCard. Ensure ornate borders have no intrusion into the QR quiet zone.
- Test 1600 px PNG, SVG and printed cards from the actual deployed browser.
- Confirm the saved collection recalls motif, finish, rounded setting and center emblem together.
