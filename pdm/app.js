/* CapexLayer Terminal: PdM/CMMS
 * Static vanilla JS. Reads v_pdm_cmms_top_facilities via Supabase REST.
 * Falls back to SAMPLE_DATA if config is missing or API returns empty.
 */
(function () {
  "use strict";

  // --- Sample fallback dataset (used if config missing or API empty) ---
  const today = new Date();
  const isoDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const SAMPLE_DATA = [
    {
      facility_id: "demo-001",
      facility_name: "Baytown Refinery",
      parent_company_name: "ExxonMobil",
      parent_ticker: "XOM",
      city: "Baytown", state: "TX", naics_primary: "324110",
      pdm_score: 14, cmms_score: 9, pdm_rank: 1, cmms_rank: 8,
      pdm_tier: "deployment_imminent", cmms_tier: "replacement_evaluation",
      signal_count_90d: 11,
      last_signal_date: isoDays(3),
      top_signals: [
        { signal_class: "edgar_10k_pdm_keyword", event_date: isoDays(20) },
        { signal_class: "sam_gov_pdm_rfp", event_date: isoDays(8) },
        { signal_class: "greenhouse_job_reliability_engineer", event_date: isoDays(3) }
      ],
    },
    {
      facility_id: "demo-002",
      facility_name: "Wood River Refinery",
      parent_company_name: "Phillips 66", parent_ticker: "PSX",
      city: "Roxana", state: "IL", naics_primary: "324110",
      pdm_score: 13, cmms_score: 11, pdm_rank: 2, cmms_rank: 1,
      pdm_tier: "deployment_imminent", cmms_tier: "selection_underway",
      signal_count_90d: 13, last_signal_date: isoDays(2),
      top_signals: [
        { signal_class: "edgar_8k_cmms_partnership", event_date: isoDays(14) },
        { signal_class: "state_il_cmms_rfp", event_date: isoDays(6) }
      ],
    },
    {
      facility_id: "demo-003",
      facility_name: "Springdale Poultry Complex",
      parent_company_name: "Tyson Foods", parent_ticker: "TSN",
      city: "Springdale", state: "AR", naics_primary: "311615",
      pdm_score: 12, cmms_score: 10, pdm_rank: 3, cmms_rank: 2,
      pdm_tier: "deployment_imminent", cmms_tier: "selection_underway",
      signal_count_90d: 9, last_signal_date: isoDays(5),
      top_signals: [
        { signal_class: "edgar_10q_pdm_keyword", event_date: isoDays(28) },
        { signal_class: "greenhouse_job_cmms_administrator", event_date: isoDays(5) }
      ],
    },
    {
      facility_id: "demo-004",
      facility_name: "Limerick Generating Station",
      parent_company_name: "Constellation Energy", parent_ticker: "CEG",
      city: "Pottstown", state: "PA", naics_primary: "221113",
      pdm_score: 11, cmms_score: 7, pdm_rank: 4, cmms_rank: 12,
      pdm_tier: "active_evaluation", cmms_tier: "replacement_evaluation",
      signal_count_90d: 8, last_signal_date: isoDays(7),
      top_signals: [
        { signal_class: "ferc_capex_filing", event_date: isoDays(21) },
        { signal_class: "lever_job_vibration_analyst", event_date: isoDays(7) }
      ],
    },
    {
      facility_id: "demo-005",
      facility_name: "Turkey Point Nuclear",
      parent_company_name: "NextEra Energy", parent_ticker: "NEE",
      city: "Homestead", state: "FL", naics_primary: "221113",
      pdm_score: 11, cmms_score: 6, pdm_rank: 5, cmms_rank: 18,
      pdm_tier: "active_evaluation", cmms_tier: "replacement_evaluation",
      signal_count_90d: 7, last_signal_date: isoDays(4),
      top_signals: [
        { signal_class: "edgar_def14a_pdm_comp", event_date: isoDays(30) },
        { signal_class: "state_fl_pdm_rfp", event_date: isoDays(4) }
      ],
    },
    {
      facility_id: "demo-006",
      facility_name: "Freeport Operations",
      parent_company_name: "Dow Inc.", parent_ticker: "DOW",
      city: "Freeport", state: "TX", naics_primary: "325110",
      pdm_score: 10, cmms_score: 9, pdm_rank: 6, cmms_rank: 9,
      pdm_tier: "active_evaluation", cmms_tier: "replacement_evaluation",
      signal_count_90d: 9, last_signal_date: isoDays(6),
      top_signals: [
        { signal_class: "edgar_10k_pdm_keyword", event_date: isoDays(16) },
        { signal_class: "state_tx_cmms_rfp", event_date: isoDays(6) }
      ],
    },
    {
      facility_id: "demo-007",
      facility_name: "Kingsport Chemical Plant",
      parent_company_name: "Eastman Chemical", parent_ticker: "EMN",
      city: "Kingsport", state: "TN", naics_primary: "325199",
      pdm_score: 10, cmms_score: 8, pdm_rank: 7, cmms_rank: 11,
      pdm_tier: "active_evaluation", cmms_tier: "replacement_evaluation",
      signal_count_90d: 7, last_signal_date: isoDays(9),
      top_signals: [
        { signal_class: "epa_echo_enforcement", event_date: isoDays(22) },
        { signal_class: "greenhouse_job_asset_performance_manager", event_date: isoDays(9) }
      ],
    },
    {
      facility_id: "demo-008",
      facility_name: "Garyville Refinery",
      parent_company_name: "Marathon Petroleum", parent_ticker: "MPC",
      city: "Garyville", state: "LA", naics_primary: "324110",
      pdm_score: 9, cmms_score: 10, pdm_rank: 8, cmms_rank: 3,
      pdm_tier: "active_evaluation", cmms_tier: "selection_underway",
      signal_count_90d: 8, last_signal_date: isoDays(5),
      top_signals: [
        { signal_class: "state_la_cmms_rfp", event_date: isoDays(5) },
        { signal_class: "lever_job_maintenance_planner", event_date: isoDays(11) }
      ],
    },
    {
      facility_id: "demo-009",
      facility_name: "Gary Works",
      parent_company_name: "United States Steel", parent_ticker: "X",
      city: "Gary", state: "IN", naics_primary: "331110",
      pdm_score: 9, cmms_score: 8, pdm_rank: 9, cmms_rank: 13,
      pdm_tier: "active_evaluation", cmms_tier: "replacement_evaluation",
      signal_count_90d: 6, last_signal_date: isoDays(10),
      top_signals: [
        { signal_class: "edgar_8k_pdm_partnership", event_date: isoDays(18) },
        { signal_class: "osha_enforcement", event_date: isoDays(10) }
      ],
    },
    {
      facility_id: "demo-010",
      facility_name: "Wickliffe Mill",
      parent_company_name: "Verso Corporation",
      city: "Wickliffe", state: "KY", naics_primary: "322121",
      pdm_score: 9, cmms_score: 6, pdm_rank: 10, cmms_rank: 22,
      pdm_tier: "active_evaluation", cmms_tier: "replacement_evaluation",
      signal_count_90d: 6, last_signal_date: isoDays(12),
      top_signals: [
        { signal_class: "doe_iedo_grant", event_date: isoDays(33) },
        { signal_class: "greenhouse_job_reliability_engineer", event_date: isoDays(12) }
      ],
    },
    {
      facility_id: "demo-011",
      facility_name: "Goose Creek Plant",
      parent_company_name: "Nucor Corporation", parent_ticker: "NUE",
      city: "Huger", state: "SC", naics_primary: "331110",
      pdm_score: 8, cmms_score: 7, pdm_rank: 11, cmms_rank: 15,
      pdm_tier: "active_evaluation", cmms_tier: "replacement_evaluation",
      signal_count_90d: 5, last_signal_date: isoDays(8),
      top_signals: [
        { signal_class: "edgar_10q_pdm_keyword", event_date: isoDays(24) },
        { signal_class: "state_sc_pdm_rfp", event_date: isoDays(8) }
      ],
    },
    {
      facility_id: "demo-012",
      facility_name: "Geismar Olefins",
      parent_company_name: "Westlake Corporation", parent_ticker: "WLK",
      city: "Geismar", state: "LA", naics_primary: "325211",
      pdm_score: 8, cmms_score: 5, pdm_rank: 12, cmms_rank: 31,
      pdm_tier: "active_evaluation", cmms_tier: "watch_list",
      signal_count_90d: 5, last_signal_date: isoDays(14),
      top_signals: [
        { signal_class: "edgar_10k_pdm_keyword", event_date: isoDays(26) },
        { signal_class: "phmsa_pipeline_incident", event_date: isoDays(14) }
      ],
    },
    {
      facility_id: "demo-013",
      facility_name: "Smyrna Vehicle Assembly",
      parent_company_name: "Nissan North America",
      city: "Smyrna", state: "TN", naics_primary: "336111",
      pdm_score: 8, cmms_score: 9, pdm_rank: 13, cmms_rank: 7,
      pdm_tier: "active_evaluation", cmms_tier: "replacement_evaluation",
      signal_count_90d: 6, last_signal_date: isoDays(4),
      top_signals: [
        { signal_class: "greenhouse_job_cmms_administrator", event_date: isoDays(4) },
        { signal_class: "lever_job_maintenance_planner", event_date: isoDays(17) }
      ],
    },
    {
      facility_id: "demo-014",
      facility_name: "Cheyenne Refinery",
      parent_company_name: "HF Sinclair", parent_ticker: "DINO",
      city: "Cheyenne", state: "WY", naics_primary: "324110",
      pdm_score: 7, cmms_score: 7, pdm_rank: 14, cmms_rank: 16,
      pdm_tier: "early_interest", cmms_tier: "replacement_evaluation",
      signal_count_90d: 5, last_signal_date: isoDays(11),
      top_signals: [
        { signal_class: "epa_echo_enforcement", event_date: isoDays(11) },
        { signal_class: "edgar_10k_cmms_keyword", event_date: isoDays(31) }
      ],
    },
    {
      facility_id: "demo-015",
      facility_name: "Plaquemine Complex",
      parent_company_name: "Shintech Inc.",
      city: "Plaquemine", state: "LA", naics_primary: "325211",
      pdm_score: 7, cmms_score: 6, pdm_rank: 15, cmms_rank: 24,
      pdm_tier: "early_interest", cmms_tier: "replacement_evaluation",
      signal_count_90d: 4, last_signal_date: isoDays(15),
      top_signals: [
        { signal_class: "state_la_pdm_rfp", event_date: isoDays(15) }
      ],
    },
    {
      facility_id: "demo-016",
      facility_name: "Beaumont Refinery",
      parent_company_name: "ExxonMobil", parent_ticker: "XOM",
      city: "Beaumont", state: "TX", naics_primary: "324110",
      pdm_score: 7, cmms_score: 5, pdm_rank: 16, cmms_rank: 35,
      pdm_tier: "early_interest", cmms_tier: "watch_list",
      signal_count_90d: 4, last_signal_date: isoDays(13),
      top_signals: [
        { signal_class: "edgar_10q_pdm_keyword", event_date: isoDays(20) },
        { signal_class: "state_tx_pdm_rfp", event_date: isoDays(13) }
      ],
    },
    {
      facility_id: "demo-017",
      facility_name: "Pascagoula Refinery",
      parent_company_name: "Chevron", parent_ticker: "CVX",
      city: "Pascagoula", state: "MS", naics_primary: "324110",
      pdm_score: 6, cmms_score: 8, pdm_rank: 17, cmms_rank: 10,
      pdm_tier: "early_interest", cmms_tier: "replacement_evaluation",
      signal_count_90d: 5, last_signal_date: isoDays(6),
      top_signals: [
        { signal_class: "edgar_8k_cmms_partnership", event_date: isoDays(19) },
        { signal_class: "greenhouse_job_cmms_administrator", event_date: isoDays(6) }
      ],
    },
    {
      facility_id: "demo-018",
      facility_name: "Three Rivers Mill",
      parent_company_name: "International Paper", parent_ticker: "IP",
      city: "Riegelwood", state: "NC", naics_primary: "322121",
      pdm_score: 6, cmms_score: 6, pdm_rank: 18, cmms_rank: 26,
      pdm_tier: "early_interest", cmms_tier: "replacement_evaluation",
      signal_count_90d: 4, last_signal_date: isoDays(17),
      top_signals: [
        { signal_class: "edgar_10k_pdm_keyword", event_date: isoDays(27) },
        { signal_class: "state_nc_pdm_rfp", event_date: isoDays(17) }
      ],
    },
    {
      facility_id: "demo-019",
      facility_name: "Catawba Nuclear Station",
      parent_company_name: "Duke Energy", parent_ticker: "DUK",
      city: "York", state: "SC", naics_primary: "221113",
      pdm_score: 6, cmms_score: 5, pdm_rank: 19, cmms_rank: 38,
      pdm_tier: "early_interest", cmms_tier: "watch_list",
      signal_count_90d: 4, last_signal_date: isoDays(19),
      top_signals: [
        { signal_class: "ferc_capex_filing", event_date: isoDays(34) },
        { signal_class: "lever_job_vibration_analyst", event_date: isoDays(19) }
      ],
    },
    {
      facility_id: "demo-020",
      facility_name: "Mount Vernon Plant",
      parent_company_name: "SABIC Innovative Plastics",
      city: "Mount Vernon", state: "IN", naics_primary: "325211",
      pdm_score: 5, cmms_score: 4, pdm_rank: 20, cmms_rank: 47,
      pdm_tier: "early_interest", cmms_tier: "watch_list",
      signal_count_90d: 3, last_signal_date: isoDays(21),
      top_signals: [
        { signal_class: "state_in_pdm_rfp", event_date: isoDays(21) }
      ],
    },
  ];
  // Fill score_date for sample rows so the "Last scored" date renders.
  SAMPLE_DATA.forEach(r => { r.score_date = isoDays(0); });

  // --- State ---
  const state = {
    rows: [],
    filtered: [],
    sortKey: "pdm_score",
    sortDir: "desc",
    filters: {
      vertical: "both",
      tier: "",
      state: "",
      search: "",
      naics: new Set(),
    },
    usingDemo: false,
  };

  // --- Tier color buckets ---
  const TIER_CLASS = {
    deployment_imminent: "t-red",
    selection_underway: "t-red",
    active_evaluation: "t-amber",
    replacement_evaluation: "t-amber",
    early_interest: "t-blue",
    watch_list: "t-blue",
    noise: "t-gray",
  };

  // --- Helpers ---
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    Object.keys(props).forEach(k => {
      if (k === "class") node.className = props[k];
      else if (k === "html") node.innerHTML = props[k];
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), props[k]);
      else node.setAttribute(k, props[k]);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  };

  function fmtDateShort(s) {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const now = new Date();
    const days = Math.round((now - d) / (1000 * 60 * 60 * 24));
    if (days < 1) return "today";
    if (days < 30) return days + "d ago";
    if (days < 365) return Math.round(days / 30) + "mo ago";
    return d.toISOString().slice(0, 10);
  }

  function pickTier(row) {
    // Pick the more advanced tier of the two (red > amber > blue > gray).
    const order = ["deployment_imminent", "selection_underway", "active_evaluation",
                   "replacement_evaluation", "early_interest", "watch_list", "noise"];
    const candidates = [row.pdm_tier, row.cmms_tier].filter(Boolean);
    candidates.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return candidates[0] || "noise";
  }

  function tierLabel(t) {
    if (!t) return "";
    return t.replace(/_/g, " ");
  }

  // --- Data fetch ---
  const CACHE_KEY = "pdmcmms_top_v1";
  const CACHE_TTL_MS = 60 * 1000;

  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch (e) { return null; }
  }
  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) { /* ignore */ }
  }

  async function loadData() {
    const cached = readCache();
    if (cached) return cached;
    const cfg = window.PDMCMMS_CONFIG;
    if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || window.__pdmConfigMissing) {
      return null;
    }
    const url = `${cfg.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/v_pdm_cmms_top_facilities?select=*&order=pdm_score.desc&limit=500`;
    try {
      const res = await fetch(url, {
        headers: {
          apikey: cfg.SUPABASE_ANON_KEY,
          Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
        },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      writeCache(data);
      return data;
    } catch (e) {
      console.warn("Supabase fetch failed:", e);
      return null;
    }
  }

  // --- Filter / sort ---
  function applyFilters() {
    const f = state.filters;
    state.filtered = state.rows.filter(r => {
      if (f.vertical === "pdm" && !(r.pdm_score > 0)) return false;
      if (f.vertical === "cmms" && !(r.cmms_score > 0)) return false;
      if (f.tier && r.pdm_tier !== f.tier && r.cmms_tier !== f.tier) return false;
      if (f.state && r.state !== f.state) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        const hay = ((r.parent_company_name || "") + " " + (r.facility_name || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.naics.size > 0 && !f.naics.has((r.naics_primary || "").slice(0, 3))) return false;
      return true;
    });
    sortRows();
    render();
  }

  function sortRows() {
    const key = state.sortKey;
    const dir = state.sortDir === "asc" ? 1 : -1;
    state.filtered.sort((a, b) => {
      let av, bv;
      if (key === "rank") { av = a.pdm_rank || 9999; bv = b.pdm_rank || 9999; }
      else if (key === "facility") { av = a.facility_name || ""; bv = b.facility_name || ""; }
      else if (key === "parent") { av = a.parent_company_name || ""; bv = b.parent_company_name || ""; }
      else if (key === "naics") { av = a.naics_primary || ""; bv = b.naics_primary || ""; }
      else if (key === "tier") { av = pickTier(a); bv = pickTier(b); }
      else if (key === "last_signal_date") { av = a.last_signal_date || ""; bv = b.last_signal_date || ""; }
      else { av = a[key] || 0; bv = b[key] || 0; }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  // --- Render ---
  function render() {
    const body = $("#terminal-body");
    body.innerHTML = "";
    $("#row-count").textContent = state.filtered.length + " facilities";

    if (state.filtered.length === 0 && state.rows.length === 0) {
      $("#table-wrap").style.display = "none";
      $("#empty-state").style.display = "block";
      return;
    }
    $("#table-wrap").style.display = "";
    $("#empty-state").style.display = "none";

    state.filtered.forEach((r, i) => {
      const tier = pickTier(r);
      const tierEl = el("span", { class: "tier " + (TIER_CLASS[tier] || "t-gray") }, tierLabel(tier));
      const facilityCell = el("td", { class: "facility" });
      facilityCell.appendChild(document.createTextNode(r.facility_name || "(unnamed)"));
      facilityCell.appendChild(el("span", { class: "loc" }, " (" + (r.city || "") + ", " + (r.state || "") + ")"));

      const dossierUrl = "/pdm/dossier/?facility_id=" + encodeURIComponent(r.facility_id || "");
      const action = el("a", { class: "fkey", href: dossierUrl }, "Open Dossier");

      const tr = el("tr", {}, [
        el("td", { class: "rank" }, String(i + 1)),
        facilityCell,
        el("td", { class: "parent" }, r.parent_company_name || ""),
        el("td", { class: "naics" }, r.naics_primary || ""),
        el("td", { class: "score" + (!r.pdm_score ? " zero" : "") }, String(r.pdm_score || 0)),
        el("td", { class: "score" + (!r.cmms_score ? " zero" : "") }, String(r.cmms_score || 0)),
        el("td", {}, tierEl),
        el("td", { class: "signals" }, String(r.signal_count_90d || 0)),
        el("td", { class: "last" }, fmtDateShort(r.last_signal_date)),
        el("td", {}, action),
      ]);
      body.appendChild(tr);
    });

    // Update sort indicator
    document.querySelectorAll("th[data-sort]").forEach(th => {
      const ind = th.querySelector(".sort-ind");
      if (ind) ind.remove();
      if (th.getAttribute("data-sort") === state.sortKey) {
        const arrow = el("span", { class: "sort-ind" }, state.sortDir === "asc" ? "^" : "v");
        th.appendChild(arrow);
      }
    });
  }

  // --- Init filters from data ---
  function initStateFilter() {
    const sel = $("#f-state");
    const states = Array.from(new Set(state.rows.map(r => r.state).filter(Boolean))).sort();
    states.forEach(s => sel.appendChild(el("option", { value: s }, s)));
  }

  function initNaicsChips() {
    const wrap = $("#f-naics");
    wrap.innerHTML = "";
    const counts = {};
    state.rows.forEach(r => {
      const n3 = (r.naics_primary || "").slice(0, 3);
      if (!n3) return;
      counts[n3] = (counts[n3] || 0) + 1;
    });
    const ordered = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 8);
    const labels = {
      "221": "221 Utilities",
      "311": "311 Food",
      "322": "322 Paper",
      "324": "324 Petro",
      "325": "325 Chem",
      "331": "331 Metals",
      "332": "332 Fab",
      "333": "333 Machinery",
      "336": "336 Transport",
      "211": "211 Oil & Gas",
    };
    ordered.forEach(n => {
      const chip = el("span", {
        class: "chip", "data-n": n,
        onclick: () => {
          if (state.filters.naics.has(n)) state.filters.naics.delete(n);
          else state.filters.naics.add(n);
          chip.classList.toggle("active");
          applyFilters();
        }
      }, labels[n] || (n + " (" + counts[n] + ")"));
      wrap.appendChild(chip);
    });
  }

  // --- Wiring ---
  function bindUI() {
    $("#f-vertical").addEventListener("change", (e) => {
      state.filters.vertical = e.target.value; applyFilters();
    });
    $("#f-tier").addEventListener("change", (e) => {
      state.filters.tier = e.target.value; applyFilters();
    });
    $("#f-state").addEventListener("change", (e) => {
      state.filters.state = e.target.value; applyFilters();
    });
    $("#f-search").addEventListener("input", (e) => {
      state.filters.search = e.target.value; applyFilters();
    });
    $("#reset-btn").addEventListener("click", () => {
      state.filters = { vertical: "both", tier: "", state: "", search: "", naics: new Set() };
      $("#f-vertical").value = "both";
      $("#f-tier").value = "";
      $("#f-state").value = "";
      $("#f-search").value = "";
      document.querySelectorAll("#f-naics .chip.active").forEach(c => c.classList.remove("active"));
      applyFilters();
    });
    document.querySelectorAll("th[data-sort]").forEach(th => {
      th.addEventListener("click", () => {
        const k = th.getAttribute("data-sort");
        if (state.sortKey === k) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        else { state.sortKey = k; state.sortDir = (k === "facility" || k === "parent" || k === "naics") ? "asc" : "desc"; }
        sortRows(); render();
      });
    });
  }

  function setHeaderMeta() {
    const now = new Date();
    $("#today-date").textContent = now.toISOString().slice(0, 10) + " " +
      now.toTimeString().slice(0, 5) + " local";
    const scoredDates = state.rows.map(r => r.score_date).filter(Boolean).sort();
    const last = scoredDates.length ? scoredDates[scoredDates.length - 1] : "n/a";
    $("#last-scored").textContent = last;
  }

  async function start() {
    let data = await loadData();
    if (!data || data.length === 0) {
      data = SAMPLE_DATA;
      state.usingDemo = true;
      $("#demo-banner").classList.remove("hidden");
    }
    state.rows = data;
    state.filtered = data.slice();
    initStateFilter();
    initNaicsChips();
    bindUI();
    setHeaderMeta();
    sortRows();
    render();
  }

  document.addEventListener("DOMContentLoaded", start);
})();
