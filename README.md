# capexlayer-www

Public marketing and demo booking surface for CapEx Layer, served at capexlayer.com.

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

## Copy rules

Any copy added to this repo is customer-facing. It must pass the AI-commodity filter and the no-em-dashes rule documented in the private `capexlayer/docs/playbook.md`. Before editing any page, read the copy rules section.
