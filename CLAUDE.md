# CapexLayer Public Site Agent Instructions

This repo serves the public marketing and demo-request surface at `https://capexlayer.com/`.

## Source of Truth

Read these before editing public funnel pages:

- `README.md`
- `docs/gtm-demo-handoff.md`
- `docs/funnel-instrumentation-spec.md`

## Public UX Flow

1. Public proof on capexlayer.com explains the invitation-only platform and service.
2. `/access/` offers founder booking or a waitlist. `/demo/` preserves old prospect links and uses the same access model.
3. Waitlist requests save to the existing shared backend at `/api/access` with explicit request consent.
4. The optional CapexLayer signals checkbox requests only the dedicated double opt-in list. It never enrolls a reader into editorial newsletters.
5. `/updates/` supports email-only opt-in without an access request.
6. David reviews fit and scope before any invitation or provisioning. Forms do not grant access.
7. Existing customers continue through `/platform/`.

## Hard Rules

- Do not publish bearer demo-token links on public pages.
- Do not put `/dashboard?demo=TOKEN` in HTML, Markdown, screenshots, issues, or public docs.
- Do not route public prospects directly into the platform dashboard.
- Do not change `/platform/` away from the production login bridge unless the platform production URL changes.
- Keep access and updates intent and consent boundaries aligned with `docs/gtm-demo-handoff.md`.

## Canonical Routes

- Homepage: `https://capexlayer.com/`
- Demo request: `https://capexlayer.com/demo/`
- Thank you: `https://capexlayer.com/demo/thanks.html`
- Customer login bridge: `https://capexlayer.com/platform/`
- Platform login target: `https://cg-platform-v2-davidleeops-projects.vercel.app/?redirect=/dashboard&force_gate=1`

## Copy Rules

This is customer-facing copy. Follow the copy rules in `README.md`: no generic AI-commodity positioning, no em dashes, and no public mention of hidden access tokens.
