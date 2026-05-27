// demo-request.js
// Posts a walkthrough request to Supabase via the anon (publishable) key.
// RLS on vendor_demo_requests allows anon INSERT only, no read exposure.
//
// Required config (loaded by ../config.local.js):
//   window.PDMCMMS_CONFIG.SUPABASE_URL
//   window.PDMCMMS_CONFIG.SUPABASE_ANON_KEY
//
// On success: hide the form, show #state-ok.
// On error:   keep the form, show #state-err with a mailto fallback.

(function () {
  "use strict";

  const FREE_EMAIL_DOMAINS = new Set([
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
  ]);

  const form = document.getElementById("demo-form");
  const submitBtn = document.getElementById("submit-btn");
  const emailEl = document.getElementById("work_email");
  const emailHint = document.getElementById("email-hint");
  const stateOk = document.getElementById("state-ok");
  const stateErr = document.getElementById("state-err");

  // Soft warning under the email field for free-mail addresses.
  function checkEmailDomain() {
    const v = (emailEl.value || "").trim().toLowerCase();
    const at = v.lastIndexOf("@");
    if (at < 0) {
      emailHint.classList.add("hidden");
      return;
    }
    const dom = v.slice(at + 1);
    if (FREE_EMAIL_DOMAINS.has(dom)) {
      emailHint.classList.remove("hidden");
    } else {
      emailHint.classList.add("hidden");
    }
  }
  emailEl.addEventListener("blur", checkEmailDomain);
  emailEl.addEventListener("input", checkEmailDomain);

  // Build the JSON body posted to PostgREST. Exposed for tests via
  // window.__buildDemoRequestPayload.
  function buildPayload(formEl) {
    const fd = new FormData(formEl);
    const get = (k) => {
      const v = fd.get(k);
      return v == null ? null : String(v).trim() || null;
    };
    return {
      full_name: get("full_name"),
      work_email: get("work_email"),
      company: get("company"),
      role: get("role"),
      vertical_interest: get("vertical_interest"),
      tier_interest: get("tier_interest"),
      notes: get("notes"),
      source_page: location.pathname,
      user_agent: navigator.userAgent,
    };
  }
  window.__buildDemoRequestPayload = buildPayload;

  function showOk() {
    form.style.display = "none";
    stateErr.classList.remove("show");
    stateOk.classList.add("show");
    stateOk.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showErr() {
    stateErr.classList.add("show");
    stateOk.classList.remove("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "Request walkthrough";
  }

  async function submit(payload) {
    const cfg = window.PDMCMMS_CONFIG || {};
    const url = cfg.SUPABASE_URL;
    const key = cfg.SUPABASE_ANON_KEY;
    if (!url || !key) {
      // No backend wired up. Show error state but make sure David still
      // gets the lead via the mailto fallback.
      throw new Error("config_missing");
    }
    const endpoint = url.replace(/\/+$/, "") + "/rest/v1/vendor_demo_requests";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let detail;
      try { detail = await res.text(); } catch (_) { detail = "<no body>"; }
      throw new Error("post_failed status=" + res.status + " body=" + detail);
    }
    return true;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    const payload = buildPayload(form);
    try {
      await submit(payload);
      showOk();
    } catch (err) {
      // Log to console for debugging. No PII in URL.
      // eslint-disable-next-line no-console
      console.error("demo-request submit error:", err);
      showErr();
    }
  });
})();
