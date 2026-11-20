# Canonical dog artwork direction

**Creative constraint:** Adapt Rosie's approved visual language without transforming the new dog into Rosie. Pet identity always overrides stylistic uniformity.

## Fixed visual DNA
- Elegant, richly detailed, painterly illustration with a warm whimsical tone.
- Tasteful gold ornament and luxurious materials; faithfully reuse existing scenic compositions and control frames.
- Legible hierarchy: art must leave room for existing interactive controls and labels.
- Clear silhouette and readable facial features at iPhone size.
- Lighting and viewpoint consistent with the particular source slot.
- Generate assets at or above the source asset's useful display resolution. Preserve aspect ratio and transparency behavior. Do not manufacture arbitrary dimensions without examining the source.
- Do not bake new text into images unless the source image already requires it and the exact spelling is approved.

## Canonical dog master
Create six no-prop character reference views: head-on, left and right three-quarter, true left profile, seated full-body, standing full-body, plus four expressions as separate approved views. Keep coat marking maps, ear geometry, eyes, muzzle length, tail set, proportions, age, and signature expression consistent. Reject generic breed substitutions.

## Prompt formula for ChatGPT image work
> Use the ten uploaded photographs and the approved canonical reference to depict [PET NAME] in the role of [PAGE / SLOT]. Match the original RosieVerse asset [SOURCE] for framing, painting style, palette, lighting, layering, and interactive safe zones, while replacing Rosie only with the actual pet. Maintain the pet's precise muzzle, ears, coat pattern, tail, proportions, and age. Respect the original art's transparent areas and do not add labels or typography. Deliver the composition as a separate asset that can replace [TARGET] after approval.

Provide the source art as composition reference at creation time. Use an approved canonical reference in every batch. The source filepath is a lookup hint for the operator, not an image attachment.

## Page-specific art briefs

| Page | Character role | Key consistency / integration checks |
|---|---|---|
| Home | Hero portrait and branded navigation art | Do not obscure existing buttons; heading and pet identity distinct |
| Fortune | Character as a regal fortune teller | Preserve centered crystal-ball framing and alternate head-turn pose |
| Cheese | Doctor/examiner and ten reactions | Ten legible, genuinely distinct expressions at small scale |
| Randomizers | Casino host, coin portrait, decorative dice | Coin faces recognizable; six dice faces retain correct values |
| Secret Santa | Holiday host, cards and email portrait | No text drift; festive decorations not covering user text |
| Calculations | Header subject and toolkit mascot | Preserve calculator readability and control safe zones |
| Timekeeper | Operator pulling clock levers in several poses | Consistent scale across lever states; do not redraw clock mechanisms |
| QR Atelier | Four QR portraits and frames | QR aperture remains perfectly unobstructed; preserve quiet zone |
| Recipes | Royal kitchen character and cookbook art | Do not alter the 25 existing food/recipe images |
| Reviews | Character-specific cinema marquee | Preserve header shape and text space |
| Reminders | Executive dog at desk, wide and mobile crops | Subject readable on both devices; reuse actual background |
| Resources | Character or pet-specific crest | Reuse navigation art already created |
| Account | Optional account entry illustration | No personal data in the artwork |

**Hard rule:** No image produced here may be written into Rosie's original `public/` or `src/` directories.
