# CapexLayer Public Site Agent Instructions

This repo serves the public marketing and demo-request surface at `https://capexlayer.com/`.

## Source of Truth

Read these before editing public funnel pages:

- `README.md`
- `docs/gtm-demo-handoff.md`
- `docs/funnel-instrumentation-spec.md`

## Public UX Flow

The public site follows the enterprise data-platform pattern:

1. Public proof on `capexlayer.com`.
2. Prospect CTA goes to `/demo/`.
3. Form submission redirects to `/demo/thanks.html`.
4. Sales qualifies the account, territory, CRM, and timeline.
5. Sales privately provisions scoped platform demo access if there is a fit.
6. Existing customers use `/platform/`, which redirects to the production platform login.

## Hard Rules

- Do not publish bearer demo-token links on public pages.
- Do not put `/dashboard?demo=TOKEN` in HTML, Markdown, screenshots, issues, or public docs.
- Do not route public prospects directly into the platform dashboard.
- Do not change `/platform/` away from the production login bridge unless the platform production URL changes.
- Keep request-demo form fields aligned with `docs/gtm-demo-handoff.md`.

## Canonical Routes

- Homepage: `https://capexlayer.com/`
- Demo request: `https://capexlayer.com/demo/`
- Thank you: `https://capexlayer.com/demo/thanks.html`
- Customer login bridge: `https://capexlayer.com/platform/`
- Platform login target: `https://cg-platform-v2-davidleeops-projects.vercel.app/?redirect=/dashboard&force_gate=1`

## Copy Rules

This is customer-facing copy. Follow the copy rules in `README.md`: no generic AI-commodity positioning, no em dashes, and no public mention of hidden access tokens.
