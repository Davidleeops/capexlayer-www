# CapexLayer funnel instrumentation spec

Date: 2026-06-21
Owner: Swarm D, Analytics and Conversion Instrumentation

## Existing analytics findings

No product analytics framework is currently wired on the public CapexLayer site.

Public site findings:

- `index.html`, `demo/index.html`, `demo/thanks.html`, and `platform/index.html` are static HTML.
- Request-demo forms post directly to Formspree at `https://formspree.io/f/xgegvkyr`.
- Public forms already carry hidden `source` values on `/` and `/demo/`.
- `/platform/` is a static redirect to the hosted platform login.
- No `gtag`, Google Tag Manager, PostHog, Segment, Mixpanel, Plausible, Amplitude, Heap, RudderStack, `dataLayer`, or local tracking helper was found.

Platform app findings from `/Users/lemueldavidleejr/cranegenius/apps/platform-v2`:

- Sentry is configured for error and replay-on-error capture only.
- `lib/engagementTracker.ts` is a local lead-gate state machine, not an analytics sink.
- `components/EngagementGateModal.tsx` explicitly notes that tracking and analytics are out of scope.
- No product analytics dependency or event helper was found in `package.json` or source search.

Because no analytics sink exists, this change documents the event contract rather than inventing a vendor or introducing a new event framework.

## Funnel model

Enterprise flow:

1. Public proof
2. Request demo
3. Thank-you
4. Sales qualification
5. Scoped platform demo
6. Activation

## Event contract

All events should include these base properties when an analytics sink is selected:

```json
{
  "event": "event_name",
  "occurred_at": "ISO-8601 timestamp",
  "page_url": "current URL",
  "page_path": "current path",
  "referrer": "document.referrer when available",
  "surface": "homepage | demo_page | thank_you | platform_redirect | platform_app",
  "session_id": "anonymous session id from chosen analytics tool",
  "utm_source": "optional",
  "utm_medium": "optional",
  "utm_campaign": "optional",
  "utm_content": "optional",
  "utm_term": "optional"
}
```

### `request_demo_click`

Meaning: visitor clicked a CTA that moves from proof into demo intent.

Current trigger points:

- `/` nav link: `index.html` primary nav `Request demo`
- `/` hero CTA: `index.html` hero `Request demo`
- `/demo/` nav link: `demo/index.html` primary nav `Request demo`
- `/demo/` hero CTA: `demo/index.html` hero `Request demo`

Recommended properties:

```json
{
  "event": "request_demo_click",
  "surface": "homepage | demo_page",
  "cta_text": "Request demo",
  "cta_location": "nav | hero",
  "destination": "/demo/ | #book"
}
```

### `demo_form_submit`

Meaning: visitor submitted a request-demo form.

Current trigger points:

- `/` homepage request form with `source=capexlayer_home_request_access`
- `/demo/` request form with `source=capexlayer_demo_request`
- `/pdm/demo-request/` legacy CRM signal access form

Recommended properties:

```json
{
  "event": "demo_form_submit",
  "surface": "homepage | demo_page | pdm_demo_request",
  "form_source": "capexlayer_home_request_access | capexlayer_demo_request | pdm_demo_request",
  "has_company": true,
  "has_role": true,
  "has_territory": true,
  "has_accounts": true,
  "crm": "Salesforce | HubSpot | Microsoft Dynamics | Other | unknown",
  "timeline": "Now | This quarter | Exploring | unknown"
}
```

Do not send raw free-text `accounts`, `territory`, `notes`, name, or email to product analytics unless the selected vendor is approved for PII.

### `login_click`

Meaning: visitor clicked a customer-login path from a public page.

Current trigger points:

- `/` nav `Log in`
- `/` hero `Customer login`
- `/demo/` nav `Log in`
- `/demo/` hero `Customer login`
- `/demo/thanks.html` `Customer login`
- `/platform/` fallback `Continue to login`

Recommended properties:

```json
{
  "event": "login_click",
  "surface": "homepage | demo_page | thank_you | platform_redirect",
  "cta_text": "Log in | Customer login | Continue to login",
  "cta_location": "nav | hero | thank_you_actions | redirect_card",
  "destination": "/platform/ | platform_app_url"
}
```

### `platform_demo_entry`

Meaning: a qualified prospect entered scoped platform-demo mode after sales qualification.

Current trigger points:

- Platform app route `/dashboard` when `demo_mode=1` or equivalent demo-mode state is active.
- Platform app `lib/demoMode.ts` owns demo-mode detection.

Recommended properties:

```json
{
  "event": "platform_demo_entry",
  "surface": "platform_app",
  "route": "/dashboard",
  "demo_mode": true,
  "demo_source": "query_param | session_storage | sales_link",
  "scope_type": "territory | account_list | crm_segment | unknown"
}
```

Do not include bearer tokens or scoped access tokens in analytics properties.

### `activation_cta_click`

Meaning: demo or gated user clicked an activation path that asks sales/account owner to turn on paid/persistent access.

Current likely trigger points:

- `components/DemoModeBanner.tsx` copy references account activation.
- `components/MonitorEnrollmentPanel.tsx` blocks persistent monitor activation in demo mode.
- `components/ExportSheetButton.tsx` blocks full export in demo mode.
- `components/GateLockOverlay.tsx` and `components/EngagementGateModal.tsx` render unlock/access CTAs.

Recommended properties:

```json
{
  "event": "activation_cta_click",
  "surface": "platform_app",
  "cta_text": "Activate account | Get access | Unlock | Request activation",
  "cta_location": "demo_banner | monitor_panel | export_button | gate_modal | gate_overlay",
  "blocked_feature": "persistent_monitor | crm_action | export | report_unlock | unknown",
  "demo_mode": true
}
```

## Implementation notes for the next code change

- Choose the analytics sink first: for example, Segment, PostHog, Plausible custom events, or a first-party `/api/analytics/events` endpoint.
- Add one small shared event helper after the sink is chosen. Keep the public-site helper no-op safe when the vendor is absent.
- On the public site, prefer declarative attributes such as `data-analytics-event` only after there is a script that consumes them.
- On platform-v2, emit `platform_demo_entry` from the demo-mode detection path and `activation_cta_click` directly in CTA handlers.
- Keep PII out of analytics by default. Capture boolean completeness flags and selected option values instead of free-text fields.
