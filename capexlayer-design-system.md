# CapexLayer design system

The operational design system for the V2 rollout is:

- `capexlayer-tokens.css`
- `capexlayer-brand-rules.md`
- `assets/capexlayer-site.css`
- `globe.js`

If this file conflicts with the tokens or brand rules, the tokens and brand rules win.

## Page Pattern

Customer-facing pages use the same shell:

- CapexLayer parent wordmark in the top bar.
- V2 lockup where a tagline belongs: `predicting the future by predicting the pain`.
- Live gold signal globe as the hero visual.
- Money-map bars for the capital-before-bid argument.
- `cx-*` cards, tiles, feed rows, terminal blocks, inputs, and buttons.

## Components

- `globe.js` mounts on any `<canvas data-cx-globe>`.
- `cx-bar` is used for the money-map waterfall.
- `cx-tile`, `cx-card`, `cx-feed-row`, `cx-term`, `cx-pill`, and `cx-input` come from `capexlayer-tokens.css`.
