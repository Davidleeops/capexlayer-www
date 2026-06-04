// CapexLayer Terminal / Facility Dossier
// Renders the full signal timeline + Claude-generated rationale for one facility.
// Reads ?facility_id=<uuid> from the URL. Falls back to /pdm/sample-dossier.json when
// the Supabase config is missing or the API returns no rows.

(function () {
  "use strict";

  const SIGNAL_CLASS_LABELS = {
    edgar_10k_pdm_keyword: "SEC 10-K (PdM keyword)",
    edgar_10q_pdm_keyword: "SEC 10-Q (PdM keyword)",
    edgar_8k_pdm_partnership: "SEC 8-K (PdM partnership)",
    edgar_def14a_pdm_comp: "SEC DEF 14A (PdM comp)",
    edgar_10k_cmms_keyword: "SEC 10-K (CMMS keyword)",
    edgar_10q_cmms_keyword: "SEC 10-Q (CMMS keyword)",
    edgar_8k_cmms_partnership: "SEC 8-K (CMMS partnership)",
    sam_gov_pdm_rfp: "SAM.gov RFP (PdM)",
    sam_gov_cmms_rfp: "SAM.gov RFP (CMMS)",
    usaspending_pdm_award: "USASpending award (PdM)",
    usaspending_cmms_award: "USASpending award (CMMS)",
    ferc_capex_filing: "FERC capex filing",
    epa_echo_enforcement: "EPA ECHO enforcement",
    epa_frs_facility_baseline: "EPA FRS baseline",
    osha_enforcement: "OSHA enforcement",
    phmsa_pipeline_incident: "PHMSA pipeline incident",
    doe_iedo_grant: "DOE IEDO grant",
    earnings_call_pdm_mention: "Earnings call (PdM mention)",
    linkedin_executive_move: "LinkedIn exec move",
    permit_industrial_alteration: "County permit (industrial alteration)",
  };

  const TIER_LABELS = {
    deployment_imminent: "Deployment imminent",
    active_evaluation: "Active evaluation",
    early_interest: "Early interest",
    selection_underway: "Selection underway",
    replacement_evaluation: "Replacement evaluation",
    watch_list: "Watch list",
    noise: "Noise",
  };

  function getFacilityId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("facility_id");
  }

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(d) {
    if (!d) return "";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toISOString().slice(0, 10);
    } catch (_) {
      return String(d);
    }
  }

  function signalClassLabel(cls) {
    if (!cls) return "signal";
    if (SIGNAL_CLASS_LABELS[cls]) return SIGNAL_CLASS_LABELS[cls];
    // state_tx_pdm_rfp → "State TX RFP (PdM)"
    let m = cls.match(/^state_([a-z]{2})_(pdm|cmms)_rfp$/);
    if (m) return "State " + m[1].toUpperCase() + " RFP (" + m[2].toUpperCase() + ")";
    // greenhouse_job_reliability_engineer → "Greenhouse: reliability engineer"
    m = cls.match(/^(greenhouse|lever)_job_(.+)$/);
    if (m) {
      const source = m[1] === "greenhouse" ? "Greenhouse" : "Lever";
      const role = m[2].replace(/_/g, " ");
      return source + " job (" + role + ")";
    }
    return cls.replace(/_/g, " ");
  }

  function clampLayer(layer) {
    const n = parseInt(layer, 10);
    if (n >= 1 && n <= 4) return n;
    return 1;
  }

  function inferWindowFromRationale(rationale, tier) {
    if (rationale) {
      const m = rationale.match(/Suggested outreach window:\s*([^.]+)\./i);
      if (m) return m[1].trim();
    }
    if (tier === "deployment_imminent" || tier === "selection_underway") return "next 21 days";
    if (tier === "active_evaluation" || tier === "replacement_evaluation") return "next 45 days";
    if (tier === "early_interest" || tier === "watch_list") return "next 60 to 90 days";
    return "next 30 days";
  }

  function buildSourceIcon(url) {
    if (!url) return "";
    return (
      '<a class="source-icon" href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer" title="View source">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M14 3h7v7"></path>' +
      '<path d="M10 14L21 3"></path>' +
      '<path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"></path>' +
      "</svg>" +
      "</a>"
    );
  }

  function renderEvent(e, idx) {
    const layer = clampLayer(e.signal_layer);
    const conf = typeof e.classifier_confidence === "number" ? e.classifier_confidence : parseFloat(e.classifier_confidence) || 0;
    const confPct = Math.round(Math.max(0, Math.min(1, conf)) * 100);
    const rawText = e.raw_text || "";
    const TRUNC = 280;
    const isLong = rawText.length > TRUNC;
    const shortText = isLong ? rawText.slice(0, TRUNC).trim() + "..." : rawText;
    const label = e.classifier_label || "";

    return (
      '<div class="event layer-' + layer + '">' +
        '<div class="event-row1">' +
          '<span class="event-date">' + escapeHtml(formatDate(e.event_date)) + "</span>" +
          '<span class="layer-badge layer-' + layer + '">Layer ' + layer + "</span>" +
          '<span class="signal-class">' + escapeHtml(signalClassLabel(e.signal_class)) + "</span>" +
          (label ? '<span class="classifier-label ' + escapeHtml(label) + '">' + escapeHtml(label.replace(/_/g, " ")) + "</span>" : "") +
          buildSourceIcon(e.source_url) +
        "</div>" +
        '<div class="event-meta">' +
          '<span class="weight-pill"><span class="label">PdM</span><span class="val">' + (e.pdm_weight || 0) + "</span></span>" +
          '<span class="weight-pill"><span class="label">CMMS</span><span class="val">' + (e.cmms_weight || 0) + "</span></span>" +
          '<span class="confidence-bar"><span class="label">conf</span>' +
            '<span class="track"><span class="fill" style="width:' + confPct + '%"></span></span>' +
            '<span class="val">' + confPct + "%</span>" +
          "</span>" +
          (e.source ? '<span class="weight-pill"><span class="label">src</span><span class="val">' + escapeHtml(e.source) + "</span></span>" : "") +
        "</div>" +
        '<div class="raw-text ' + (isLong ? "collapsed" : "") + '" id="raw-' + idx + '" data-full="' + escapeHtml(rawText) + '" data-short="' + escapeHtml(shortText) + '">' +
          escapeHtml(isLong ? shortText : rawText) +
        "</div>" +
        (isLong ? '<button class="toggle-more" data-idx="' + idx + '">Show more</button>' : "") +
      "</div>"
    );
  }

  function renderHero(facility) {
    if (!facility) return "";
    const parts = [];
    if (facility.street_address) parts.push(facility.street_address);
    if (facility.city) parts.push(facility.city);
    if (facility.state) parts.push(facility.state);
    if (facility.zip) parts.push(facility.zip);
    const addr = parts.join(", ");

    return (
      '<div class="hero">' +
        "<h1>" + escapeHtml(facility.facility_name || "Unnamed facility") + "</h1>" +
        '<div class="parent">' +
          escapeHtml(facility.parent_company_name || "Unknown parent") +
          (facility.parent_ticker ? '<span class="ticker">' + escapeHtml(facility.parent_ticker) + "</span>" : "") +
          (facility.naics_primary ? '<span class="naics">NAICS ' + escapeHtml(facility.naics_primary) + "</span>" : "") +
        "</div>" +
        '<div class="addr">' + escapeHtml(addr) + "</div>" +
      "</div>"
    );
  }

  function renderScorePanel(score) {
    if (!score) {
      return (
        '<div class="score-panel">' +
          "<h2>Score</h2>" +
          '<div class="empty" style="padding: 20px 0;">No score on file yet.</div>' +
        "</div>"
      );
    }
    const pdmTier = score.pdm_tier || "noise";
    const cmmsTier = score.cmms_tier || "noise";
    const rationale = score.rationale || "";
    const window_ = inferWindowFromRationale(rationale, pdmTier !== "noise" ? pdmTier : cmmsTier);

    return (
      '<div class="score-panel">' +
        "<h2>Score snapshot</h2>" +
        '<div class="score-row">' +
          '<div>' +
            '<div class="label">PdM</div>' +
            '<span class="tier-badge ' + escapeHtml(pdmTier) + '">' + escapeHtml(TIER_LABELS[pdmTier] || pdmTier) + "</span>" +
          "</div>" +
          '<div class="value">' + (score.pdm_score != null ? score.pdm_score : "-") + "</div>" +
        "</div>" +
        '<div class="score-row">' +
          '<div>' +
            '<div class="label">CMMS</div>' +
            '<span class="tier-badge ' + escapeHtml(cmmsTier) + '">' + escapeHtml(TIER_LABELS[cmmsTier] || cmmsTier) + "</span>" +
          "</div>" +
          '<div class="value">' + (score.cmms_score != null ? score.cmms_score : "-") + "</div>" +
        "</div>" +
        '<div class="score-row">' +
          '<div class="label">90-day signals</div>' +
          '<div class="value">' + (score.signal_count_90d != null ? score.signal_count_90d : "-") + "</div>" +
        "</div>" +
        (rationale
          ? '<div class="rationale">' +
              '<div class="rationale-head">Why this facility, right now</div>' +
              escapeHtml(rationale) +
            "</div>"
          : "") +
        '<div class="window-callout">Suggested outreach window: ' + escapeHtml(window_) + "</div>" +
      "</div>"
    );
  }

  function renderPage(facility, score, events) {
    const root = document.getElementById("root");

    if (!facility) {
      root.innerHTML =
        '<div class="empty-card">' +
          "<h2>No facility selected</h2>" +
          "<p>A dossier shows the full signal history for one facility, so it needs to know which facility you want.</p>" +
          "<p>Open the terminal, find an account, and click through. The dossier loads from there with everything filled in.</p>" +
          '<div class="actions">' +
            '<a class="btn" href="/pdm/terminal/">Open the terminal</a>' +
            '<a class="btn secondary" href="/pdm/tracker/">Open the tracker</a>' +
          "</div>" +
        "</div>";
      return;
    }

    const eventsHtml = events && events.length
      ? events.map(renderEvent).join("")
      : '<div class="empty" style="padding: 32px;">No signal events on file for this facility yet.</div>';

    root.innerHTML =
      renderHero(facility) +
      '<div class="layout">' +
        '<div class="timeline">' +
          '<div class="timeline-head">' +
            "<span>Signal timeline</span>" +
            '<span class="count">' + (events ? events.length : 0) + " events</span>" +
          "</div>" +
          eventsHtml +
        "</div>" +
        renderScorePanel(score) +
      "</div>";

    // Bind expand/collapse handlers
    document.querySelectorAll(".toggle-more").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-idx");
        const el = document.getElementById("raw-" + idx);
        if (!el) return;
        const full = el.getAttribute("data-full") || "";
        const short = el.getAttribute("data-short") || "";
        if (el.classList.contains("collapsed")) {
          el.classList.remove("collapsed");
          el.textContent = full;
          btn.textContent = "Show less";
        } else {
          el.classList.add("collapsed");
          el.textContent = short;
          btn.textContent = "Show more";
        }
      });
    });
  }

  function renderFooter() {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("footer").textContent = "Generated " + today + ". Refreshed nightly.";
  }

  function setBanner(msg) {
    const el = document.getElementById("banner");
    if (!msg) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.classList.remove("hidden");
    el.textContent = msg;
  }

  async function fetchFromSupabase(facilityId) {
    const cfg = window.PDMCMMS_CONFIG;
    if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
      return null;
    }
    const headers = {
      apikey: cfg.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
      Accept: "application/json",
    };

    try {
      const [dossierResp, scoreResp] = await Promise.all([
        fetch(
          cfg.SUPABASE_URL.replace(/\/$/, "") +
            "/rest/v1/v_pdm_cmms_facility_dossier?facility_id=eq." +
            encodeURIComponent(facilityId) +
            "&order=event_date.desc&limit=200",
          { headers }
        ),
        fetch(
          cfg.SUPABASE_URL.replace(/\/$/, "") +
            "/rest/v1/v_pdm_cmms_top_facilities?facility_id=eq." +
            encodeURIComponent(facilityId) +
            "&limit=1",
          { headers }
        ),
      ]);

      if (!dossierResp.ok || !scoreResp.ok) return null;

      const dossierRows = await dossierResp.json();
      const scoreRows = await scoreResp.json();

      if (!Array.isArray(dossierRows) || dossierRows.length === 0) return null;

      // First row carries facility identity; some rows may have null event fields
      // (LEFT JOIN), so filter to rows with an event_id when building the timeline.
      const first = dossierRows[0];
      const facility = {
        facility_id: first.facility_id,
        facility_name: first.facility_name,
        parent_company_name: first.parent_company_name,
        parent_ticker: first.parent_ticker,
        naics_primary: first.naics_primary,
        street_address: first.street_address,
        city: first.city,
        state: first.state,
        zip: first.zip,
      };
      const events = dossierRows
        .filter((r) => r.event_id)
        .map((r) => ({
          event_id: r.event_id,
          event_date: r.event_date,
          signal_class: r.signal_class,
          signal_layer: r.signal_layer,
          source: r.source,
          source_url: r.source_url,
          classifier_label: r.classifier_label,
          classifier_confidence: r.classifier_confidence,
          pdm_weight: r.pdm_weight,
          cmms_weight: r.cmms_weight,
          raw_text: r.raw_text,
        }));

      const score = Array.isArray(scoreRows) && scoreRows.length ? scoreRows[0] : null;
      return { facility, score, events };
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to sample:", err);
      return null;
    }
  }

  async function fetchSample() {
    try {
      const resp = await fetch("/pdm/sample-dossier.json", { cache: "no-store" });
      if (!resp.ok) throw new Error("sample fetch HTTP " + resp.status);
      const data = await resp.json();
      return {
        facility: data.facility,
        score: data.score,
        events: data.events || [],
      };
    } catch (err) {
      console.error("Failed to load /pdm/sample-dossier.json:", err);
      return null;
    }
  }

  async function boot() {
    renderFooter();
    const facilityId = getFacilityId();

    if (!facilityId) {
      renderPage(null, null, []);
      return;
    }

    let result = null;
    if (window.PDMCMMS_CONFIG && window.PDMCMMS_CONFIG.SUPABASE_URL) {
      result = await fetchFromSupabase(facilityId);
    }

    if (!result) {
      setBanner("Live data unavailable. Showing sample dossier.");
      result = await fetchSample();
    }

    if (!result) {
      document.getElementById("root").innerHTML =
        '<div class="empty-card">' +
          "<h2>Dossier unavailable</h2>" +
          "<p>Could not load live data or the bundled sample. Try again in a minute, or head back to the terminal.</p>" +
          '<div class="actions">' +
            '<a class="btn" href="/pdm/terminal/">Back to terminal</a>' +
          "</div>" +
        "</div>";
      return;
    }

    renderPage(result.facility, result.score, result.events);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
