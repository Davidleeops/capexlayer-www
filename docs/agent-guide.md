# CapexLayer Public Site Agent Guide

This is the Claude-accessible public-site guide for `capexlayer.com`.

Read these first:

- `../CLAUDE.md`
- `../README.md`
- `gtm-demo-handoff.md`
- `funnel-instrumentation-spec.md`

The public flow is:

1. Homepage proves the value.
2. Prospects use `/demo/`.
3. Demo forms redirect to `/demo/thanks.html`.
4. Sales qualifies account, territory, CRM, and timeline.
5. Sales privately sends scoped platform demo access if qualified.
6. Existing customers use `/platform/`.

Hard rules:

- Never publish bearer demo-token links.
- Never put `/dashboard?demo=TOKEN` in public HTML or Markdown.
- Never route public prospects directly into the platform dashboard.
- Keep `/platform/` pointed at the production platform login bridge.
- Keep request-demo fields aligned with `gtm-demo-handoff.md`.

Canonical routes:

- `https://capexlayer.com/`
- `https://capexlayer.com/demo/`
- `https://capexlayer.com/demo/thanks.html`
- `https://capexlayer.com/platform/`
- `https://cg-platform-v2-davidleeops-projects.vercel.app/?redirect=/dashboard&force_gate=1`
