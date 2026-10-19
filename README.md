# capexlayer-www

Public marketing and demo booking surface for CapexLayer, served at capexlayer.com.

## Tree

```
/                  # investor + marketing home (index.html)
/investor          # investor deck
/demo              # prospect booking page, linked from cold email
```

## Ownership

- Investor site content: David Lee
- Demo booking page content: David Lee, must match cold email copy rules in the private `capexlayer` repo (`docs/playbook.md`)

## Deployment

Current: GitHub Pages from `main` branch root at https://davidleeops.github.io/capexlayer-www/

Target: `capexlayer.com` via CNAME once DNS is configured. Drop a `CNAME` file at root containing `capexlayer.com` and set the DNS A record per GitHub Pages docs.

## Related

Operational codebase: **private** repo `Davidleeops/capexlayer`. See that repo's `ARCHITECTURE.md` for the full system map.

## Access flow

CapexLayer is an invitation-only platform and service. The public site remains visible.

- `/access/` offers the verified existing founder booking calendar and an access waitlist.
- `/demo/` routes existing prospect links into a founder conversation or the waitlist.
- `/updates/` is the separate CapexLayer Signals & Updates opt-in. It does not request access.
- The waitlist stores company, role, market and use case. An unchecked email option never enrolls a person in marketing.
- Email opt-in is confirmed separately through the existing owned Listmonk service.
- Editorial subscriptions remain independent on `/newsletters/`.
- Existing customers still use `/platform/`. Public forms never provision platform access.
- Do not publish bearer demo-token links. Invitations remain a qualification and provisioning operation.
- Current handoff details live in `docs/gtm-demo-handoff.md`.

## Copy rules

Any copy added to this repo is customer-facing. It must pass the AI-commodity filter and the no-em-dashes rule documented in the private `capexlayer/docs/playbook.md`. Before editing any page, read the copy rules section.
