# Current invitation-only access flow

Updated October 19, 2026. This section supersedes the historical demo-form flow below for the homepage and `/demo/`.

- Platform and service access is by invitation after fit review.
- The primary path is a founder conversation using the existing verified 15-minute calendar linked from `/access/` and `/demo/`.
- The alternative is `/access/#waitlist`. Requests persist in `capexlayer_access_requests` in the existing shared research-site database.
- Waitlist requests are `waiting`. Email-only requests are `updates_only`. Neither grants platform access.
- Collect name, work email, company, optional role, market and use case, and explicit access-request permission.
- The separate, unchecked product-updates option requests only `capexlayer-updates`.
- `/updates/` permits email-only signup without adding a person to the waitlist.
- Public form submission uses the existing shared `/api/access` endpoint. No admin credentials are exposed in public source.
- Confirmed Listmonk membership is authoritative for email eligibility. A stored request or email option is not confirmed consent.
- Public-facing receipts distinguish saved access, accepted email requests, and pending delivery. Do not claim instant access or invented waitlist positions.
- Existing customer login and private scoped invitations remain unchanged.

## CapexLayer signals nurture

List: CapexLayer Signals & Updates. Slug: `capexlayer-updates`. Public, double opt-in. This is separate from Signal Over Noise, Uptime Economics and The Reliability Report.

Use the opt-in population for relevant commercial signals, product updates and access invitations. A useful signal includes what changed, a primary source and date, the commercial implication, what is still an inference, and the decision or account worth validating. Close with one appropriate next action, normally the founder/access path. Do not present publicity, views or opens as buying intent.

A waitlist request alone authorizes discussion of that access request, not recurring marketing. Never import cold prospects or automatically enroll LinkedIn followers. Honor Listmonk unsubscribes and suppression before any campaign. Handpick relevance using the submitted role, company, market and use case. No campaign or outbound nurture sequence is activated by this website change.

Owner review: inspect the access-request table through the existing authenticated Sites database viewer. Select only confirmed members of the dedicated list when preparing an email campaign. Do not publish a public export endpoint.

## Historical demo-form implementation

The historical contract below is retained for context and any legacy PDM surface. It is not the current homepage or `/demo/` intake.

# CapexLayer demo request handoff

Purpose: keep the public request-demo motion aligned with the operating model:
public visitors request a demo, sales qualifies the account, and sales sends
scoped dashboard access only after the scope is approved.

## Current form destination

All public CapexLayer request forms currently submit to Formspree:

`https://formspree.io/f/xgegvkyr`

Current public form surfaces:

- `/` homepage request form, source `capexlayer_home_request_access`
- `/demo/` request form, source `capexlayer_demo_request`
- `/pdm/demo-request/` CRM signal access form, source `capexlayer_pdm_demo_request`

These forms redirect to:

`https://capexlayer.com/demo/thanks.html`

## Current fields

Homepage, `/demo/`, and `/pdm/demo-request/` aligned payload:

- `source`
- `_subject`
- `_redirect`
- `name`
- `email`
- `company`
- `role`
- `territory`
- `accounts`
- `crm`
- `timeline`

## Gaps

- Formspree is the current destination, not a CRM-native endpoint.
- No public page should include a bearer demo token or a tokenized demo URL.
- Demo access scope is still a sales operation: qualify, define account set,
  provision access, then send the scoped link.

## Target lead payload

Use these fields when Formspree is replaced by a CRM, webhook, or API endpoint:

```json
{
  "lead_source": "capexlayer_demo_request",
  "submitted_at": "ISO-8601 timestamp",
  "page_url": "https://capexlayer.com/demo/",
  "name": "Prospect name",
  "email": "prospect@company.com",
  "company": "Company",
  "role": "Role or title",
  "territory": "Sales territory or market focus",
  "accounts": "Named accounts, CRM segment, or project types to check",
  "crm": "Salesforce | HubSpot | Microsoft Dynamics | Other",
  "timeline": "Now | This quarter | Exploring",
  "qualification_status": "new",
  "owner": "sales",
  "requested_demo_scope": {
    "scope_type": "territory | account_list | crm_segment",
    "scope_notes": "Sales-entered scope notes",
    "approved_by": "Sales owner"
  },
  "next_action": "qualify_before_access"
}
```

Required before sales follow-up:

- `email`
- `company`
- `territory` or `accounts`

## Handoff flow

1. Visitor submits `/demo/` or homepage request form.
2. Formspree receives the lead and sends notification to the sales inbox.
3. Sales reviews fit: company type, territory, named accounts, CRM, and timeline.
4. Sales replies with a qualification question if scope is unclear.
5. Sales prepares the walkthrough around the submitted territory or account set.
6. If qualified, sales provisions scoped dashboard access in the platform.
7. Sales sends a scoped dashboard link. The link must be created in the private
   system and must not be committed to this repo.
8. Sales logs the sent link, scope, expiration, and owner in the CRM or operating
   tracker.

## Demo follow-up email template

Subject: CapexLayer demo access for {{territory_or_account_set}}

Hi {{first_name}},

Thanks for sharing the account context. I scoped the demo around
{{territory_or_account_set}} so you can review the signal trail without opening
the full platform.

Use this link:

{{scoped_demo_dashboard_url}}

Scope:
{{scope_summary}}

Suggested path:

1. Open the dashboard.
2. Review the first five ranked accounts.
3. Check the source trail on any account that looks real to your team.
4. Send me the account that best matches your current sales motion, and I will
   show how it would route into {{crm_or_workflow}}.

The link is scoped to this demo and should not be forwarded outside your team.

David

## Scoped dashboard path

Sales should generate the actual scoped URL from the private platform. The public
path pattern is:

`https://cg-platform-v2-davidleeops-projects.vercel.app/?redirect=/dashboard&force_gate=1`

Add any account, territory, expiration, or token parameters only in the private
sales workflow. Do not write those values into public docs, public pages, GitHub
issues, or screenshots.
