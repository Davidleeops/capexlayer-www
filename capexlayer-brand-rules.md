# CapexLayer brand rules (hard rules for humans and agents)

## The system
- Palette, type, components come from capexlayer-tokens.css. Use var(--token). Never hardcode a hex or font on a customer-facing surface. Missing value -> add it to the tokens file.

## Palette (use tokens, not literals)
- Surfaces: near-black #050810, base navy #080e1a, panel #060c18, card #0b1426.
- Accents: gold #c9a84c (primary), light gold #ffe8a0 (highlight/glow only), cream #efe7d3 (Fraunces headlines), signal green #74dc87 (verified/positive ONLY).
- Text: #eaf0fb primary, #aab6cd body, #5f6f8c muted. Hairlines #1b2740.

## Type
- Bebas Neue: wordmark, big stat numbers, numeric kickers.
- Fraunces (serif): editorial / money headlines, in cream; italic = gold gradient.
- DM Sans: body. DM Mono: labels, kickers, API/data, tagline lockup.
- Sentence case in body and headlines. Mono labels may be uppercase.

## Company tag (V2 - current)
- The tag is: predicting the future by predicting the pain
- This REPLACES the retired "the money moves before the bid." Never reintroduce the old tag.
- Secondary lockup allowed: "not a single source of truth. a single source of trust."

## Brand architecture (load-bearing)
- CapexLayer is the PARENT brand on every customer-facing surface.
- CraneGenius is "vertical one" only (crane / rigging / lift-planning / heavy-equipment).
- Never make a first-touch buyer reconcile two brands. No CraneGenius branding, logos, or screenshots on a CapexLayer surface.
- Approved bridge phrase, verbatim: "CraneGenius is the crane and equipment vertical from CapexLayer."

## Copy rules
- No em dashes or en dashes. Use commas, periods, or rewrite.
- No business-speak: leverage, seamless, robust, unlock, empower, streamline, transform.
- Reads like a person typed it. Never narrate the reader's business back as fact.

## Imagery
- Abstract capital-scapes only: live capital map, faint navy map-grids, gold money-bars, gold glow-points, mono code overlays. Deep navy, heavy negative space.
- No photos of cranes, equipment, sites, hard hats on CapexLayer surfaces.
- Real captures only. No mockups. Modeled numbers carry "WORKED EXAMPLE · CAPEX FROM REAL DATA".
- The live capital map (or gold globe) is the hero. The blob/map/app.html explorer is support-only, never a lead/hero.

## QA checklist (run before every merge into design-v2)
- [ ] No hardcoded hex/font on customer-facing surfaces; everything via tokens.
- [ ] Gold on navy; green only for verified/positive; cream only for serif headlines.
- [ ] V2 tag present where a tagline lockup belongs; old tag absent anywhere.
- [ ] CapexLayer is the visible parent; no CraneGenius bleed on CapexLayer pages.
- [ ] No em/en dashes; no business-speak words.
- [ ] Hero is the live map/gold globe; no blob-explorer in a lead slot.
- [ ] Body text on navy passes AA contrast.
- [ ] Hairlines 0.5-1px; corners use --r-md/--r-lg; no stray bright borders.
- [ ] Page builds and renders with no console errors.
