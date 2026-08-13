/* graphify-build.js  -  build the capital-movement graph in the browser.
 *
 * A faithful JS port of scripts/graphify/{model,geo,build}.py build_live, so the
 * explorer can read the public Supabase views live with the anon key and build
 * the same graph client-side. Output shape matches the Python graph.to_dict(),
 * so the renderer does not care whether data came from data.json or live.
 *
 * window.GraphifyBuild.buildLive({projects, signals, crane, prospects,
 *   dc_opps, dc_signals, capex}) -> {meta, nodes, edges}
 */
(function (global) {
  const PALETTE = {
    navy: "#080e1a", navy_2: "#0f1828", navy_3: "#16223a", gold: "#c9a84c",
    green: "#4cc98a", red: "#c95a4c", text: "#f4f1e6", text_dim: "#a4a59c",
    border: "#1f2c47"
  };
  const NODE_TYPES = {
    motion: { color: "#c9a84c", tag: "motion" }, segment: { color: "#e0c878", tag: "segment" },
    account: { color: "#7fb2ff", tag: "account" }, facility: { color: "#4cc98a", tag: "facility" },
    signal: { color: "#c95a4c", tag: "signal" }, source: { color: "#9a6bd6", tag: "source" },
    tier: { color: "#d68a3a", tag: "tier" }, territory: { color: "#5ad0d0", tag: "territory" },
    pipeline_stage: { color: "#a4a59c", tag: "stage" }, project: { color: "#7fb2ff", tag: "project" },
    opportunity: { color: "#4cc98a", tag: "opportunity" }, prospect: { color: "#e07fb2", tag: "prospect" },
    vertical: { color: "#d68a3a", tag: "vertical" }, metro: { color: "#5ad0d0", tag: "metro" },
    trade: { color: "#e0a06b", tag: "trade" }
  };
  const STATE_CENTROIDS = {
    AL: [32.8, -86.8], AK: [64.0, -152.0], AZ: [34.2, -111.9], AR: [34.9, -92.4], CA: [37.2, -119.4],
    CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [39.0, -75.5], FL: [28.6, -82.4], GA: [32.6, -83.4],
    HI: [20.3, -156.4], ID: [44.4, -114.6], IL: [40.0, -89.2], IN: [39.9, -86.3], IA: [42.0, -93.5],
    KS: [38.5, -98.4], KY: [37.5, -85.3], LA: [31.0, -92.0], ME: [45.4, -69.2], MD: [39.0, -76.8],
    MA: [42.3, -71.8], MI: [44.3, -85.4], MN: [46.3, -94.3], MS: [32.7, -89.7], MO: [38.4, -92.5],
    MT: [47.0, -109.6], NE: [41.5, -99.8], NV: [39.3, -116.6], NH: [43.7, -71.6], NJ: [40.2, -74.7],
    NM: [34.4, -106.1], NY: [42.9, -75.5], NC: [35.5, -79.4], ND: [47.5, -100.5], OH: [40.3, -82.8],
    OK: [35.6, -97.5], OR: [44.0, -120.6], PA: [40.9, -77.8], RI: [41.7, -71.5], SC: [33.9, -80.9],
    SD: [44.4, -100.2], TN: [35.9, -86.4], TX: [31.5, -99.3], UT: [39.3, -111.7], VT: [44.1, -72.7],
    VA: [37.5, -78.9], WA: [47.4, -120.5], WV: [38.6, -80.6], WI: [44.6, -89.9], WY: [43.0, -107.6],
    DC: [38.9, -77.0], PR: [18.2, -66.4], BC: [53.7, -125.0], ON: [50.0, -85.0], AB: [54.0, -114.0],
    QC: [52.0, -72.0], MB: [54.0, -97.0], SK: [54.0, -106.0]
  };
  // Country centroids (ISO alpha-2) for the international tender feeds (UK FTS,
  // TED EU, LatAm portals). Fallback when a row has no lat/lng and no US/Canada
  // state match, so non-US tenders land on the right country instead of dropping.
  const COUNTRY_CENTROIDS = {
    GB: [54.0, -2.0], IE: [53.2, -8.0], FR: [46.6, 2.4], DE: [51.2, 10.4], ES: [40.2, -3.7],
    PT: [39.6, -8.0], IT: [42.8, 12.6], NL: [52.2, 5.3], BE: [50.6, 4.6], LU: [49.8, 6.1],
    CH: [46.8, 8.2], AT: [47.6, 14.1], CZ: [49.8, 15.5], SK: [48.7, 19.7], PL: [52.1, 19.4],
    HU: [47.2, 19.4], RO: [45.9, 24.9], BG: [42.7, 25.3], HR: [45.1, 15.5], SI: [46.1, 14.8],
    GR: [39.1, 22.9], SE: [62.0, 15.0], NO: [61.0, 8.5], DK: [56.0, 9.5], FI: [64.0, 26.0],
    EE: [58.7, 25.5], LV: [56.9, 24.9], LT: [55.2, 23.9], MT: [35.9, 14.4], CY: [35.0, 33.2],
    MX: [23.6, -102.5], CL: [-35.7, -71.5], BR: [-10.0, -52.0], CO: [4.6, -74.1],
    AR: [-38.4, -63.6], PE: [-9.2, -75.0], CR: [9.7, -83.8], PA: [8.5, -80.1],
    EC: [-1.8, -78.2],
    AU: [-25.3, 133.8], NZ: [-40.9, 174.9], SG: [1.35, 103.8], IN: [22.9, 79.6],
    JP: [36.2, 138.3], KR: [36.5, 127.9],
    ZA: [-30.6, 22.9], NG: [9.1, 8.7], KE: [0.2, 37.9],
    AE: [24.4, 54.3], SA: [23.9, 45.1], QA: [25.3, 51.2],
    CA: [56.0, -106.0]
  };
  function normCountry(v) {
    v = String(v || "").trim().toUpperCase();
    return (v.length === 2 && /^[A-Z]{2}$/.test(v)) ? v : "";
  }
  function isForeign(country) {
    const cc = normCountry(country);
    return !!cc && cc !== "US" && cc !== "CA" && !!COUNTRY_CENTROIDS[cc];
  }
  const STATE_ABBR = {
    "british columbia": "BC", "ontario": "ON", "alberta": "AB", texas: "TX", california: "CA",
    "new york": "NY", florida: "FL", illinois: "IL", virginia: "VA", "north carolina": "NC",
    pennsylvania: "PA", ohio: "OH", georgia: "GA", washington: "WA", arizona: "AZ", nevada: "NV",
    colorado: "CO", tennessee: "TN", indiana: "IN", missouri: "MO", "south carolina": "SC"
  };

  function slugify(v) {
    let out = "";
    for (const ch of String(v || "").trim().toLowerCase()) {
      if (/[a-z0-9]/.test(ch)) out += ch;
      else if (" -_/.,&".includes(ch)) out += "-";
    }
    while (out.includes("--")) out = out.replace(/--/g, "-");
    return out.replace(/^-+|-+$/g, "") || "x";
  }
  function normState(v) {
    v = String(v || "").trim(); if (!v) return "";
    if (v.length <= 3) return v.toUpperCase();
    return STATE_ABBR[v.toLowerCase()] || v.slice(0, 2).toUpperCase();
  }
  function jitter(key) {
    let h = 2166136261;
    for (const c of String(key)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    const a = ((h >>> 0) % 10000) / 10000 - 0.5, b = ((h >>> 8) % 10000) / 10000 - 0.5;
    return [a * 2.4, b * 2.4];
  }
  function locate(lat, lng, state, key, country) {
    const la = parseFloat(lat), lo = parseFloat(lng);
    if (!isNaN(la) && !isNaN(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180 && (la || lo))
      return [la, lo];
    const cc = normCountry(country);
    // Foreign rows place by country centroid even when a state is present, since
    // LatAm/EU subnational codes collide with US state codes.
    if (isForeign(country)) {
      const c = COUNTRY_CENTROIDS[cc];
      const [dy, dx] = jitter(key || state || cc);
      return [Math.round((c[0] + dy) * 1e4) / 1e4, Math.round((c[1] + dx) * 1e4) / 1e4];
    }
    const c = STATE_CENTROIDS[normState(state)] || COUNTRY_CENTROIDS[cc];
    if (!c) return [null, null];
    const [dy, dx] = jitter(key || normState(state) || cc);
    return [Math.round((c[0] + dy) * 1e4) / 1e4, Math.round((c[1] + dx) * 1e4) / 1e4];
  }
  function clean(s, limit) {
    s = String(s == null ? "" : s).replace(/\*/g, "").trim().replace(/\s+/g, " ");
    if (limit && s.length > limit) s = s.slice(0, limit).trim() + "…";
    return s || "?";
  }
  const date10 = v => (v ? String(v).slice(0, 10) : "");
  const num = v => { const f = parseFloat(v); return isNaN(f) ? null : f; };

  function Graph() {
    this.nodes = new Map(); this.edges = new Map();
  }
  Graph.prototype.node = function (type, label, id, props) {
    const nid = id || (type + ":" + slugify(label));
    let n = this.nodes.get(nid);
    if (!n) { n = { id: nid, type, label: clean(label, 70), props: Object.assign({}, props) }; this.nodes.set(nid, n); }
    else if (props) for (const k in props) { const v = props[k]; if (v !== null && v !== undefined && v !== "") n.props[k] = v; }
    return nid;
  };
  Graph.prototype.edge = function (s, t, rel) {
    if (s === t) return; const k = s + "|" + t + "|" + rel;
    if (!this.edges.has(k)) this.edges.set(k, { source: s, target: t, rel });
  };
  Graph.prototype.get = function (id) { return this.nodes.get(id); };

  function buildLive(snap) {
    const g = new Graph();
    function deriveCountryAgg(projects) {
      const byCountry = new Map();
      (projects || []).forEach(p => {
        const cc = normCountry(p.country);
        if (!cc || cc === "US" || cc === "CA") return;
        if (!COUNTRY_CENTROIDS[cc]) return;
        let row = byCountry.get(cc);
        if (!row) {
          row = { country: cc, project_count: 0, signal_count: 0, pipeline_usd: 0, sources: [] };
          byCountry.set(cc, row);
        }
        row.project_count += 1;
        const val = num(p.estimated_value);
        if (val != null) row.pipeline_usd += val;
        if (p.source_name && !row.sources.includes(p.source_name)) row.sources.push(p.source_name);
      });
      return [...byCountry.values()];
    }
    function entity(type, label, o) {
      o = o || {};
      const vertical = o.vertical ? o.vertical.charAt(0).toUpperCase() + o.vertical.slice(1) : "";
      let st, cc;
      if (isForeign(o.country)) { st = ""; cc = normCountry(o.country); }
      else { st = normState(o.state); cc = st ? "" : normCountry(o.country); }
      const [la, lo] = locate(o.lat, o.lng, o.state, o.id, o.country);
      const props = Object.assign({
        kind: type, vertical, signal_type: o.signal_type || "", value_usd: o.value_usd != null ? o.value_usd : null,
        score: o.score != null ? o.score : null, date: o.date || "", state: st || cc, metro: o.metro || "",
        country: normCountry(o.country) || cc || "", lat: la, lng: lo, narrative: clean(o.narrative || "", 240),
        source: o.source || "", source_name: o.source || ""
      }, o.extra || {});
      const nid = g.node(type, label, o.id, props);
      if (st) {
        const terr = g.node("territory", st, undefined, { kind: "territory" });
        const c = STATE_CENTROIDS[st];
        if (c) { const tn = g.get(terr); if (tn.props.lat == null) { tn.props.lat = c[0]; tn.props.lng = c[1]; } }
        g.edge(nid, terr, "in_territory");
      } else if (cc) {
        const terr = g.node("territory", cc, undefined, { kind: "territory" });
        const c = COUNTRY_CENTROIDS[cc];
        if (c) { const tn = g.get(terr); if (tn.props.lat == null) { tn.props.lat = c[0]; tn.props.lng = c[1]; } }
        g.edge(nid, terr, "in_territory");
      }
      if (o.metro) g.edge(nid, g.node("metro", clean(o.metro, 40), undefined, { kind: "metro" }), "in_metro");
      if (vertical) g.edge(nid, g.node("vertical", vertical, "vertical:" + slugify(vertical), { kind: "vertical" }), "in_vertical");
      if (o.source) g.edge(nid, g.node("source", clean(o.source, 36), "source:" + slugify(o.source), { kind: "source" }), "from_source");
      return nid;
    }
    (snap.projects || []).forEach(p => {
      entity("project", p.project_name || "project", {
        id: "project:" + p.id, vertical: clean(p.project_type || "", 30),
        value_usd: num(p.estimated_value), state: p.state, country: p.country, source: clean(p.source_name || "", 36),
        extra: { city: clean(p.city || "", 40) }
      });
    });
    (snap.signals || []).forEach(s => {
      const nid = entity("signal", s.signal_type || "signal", {
        id: "signal:" + s.id, signal_type: clean(s.signal_type || "", 30), score: num(s.signal_strength),
        date: date10(s.signal_date), source: clean(s.source_name || "", 36), narrative: s.summary || ""
      });
      if (s.project_id && g.get("project:" + s.project_id)) g.edge(nid, "project:" + s.project_id, "of_project");
    });
    (snap.crane || []).forEach(c => {
      const nid = entity("project", c.project_name || "crane project", {
        id: "crane:" + c.project_key, vertical: "Crane", value_usd: num(c.estimated_spend_proxy),
        score: num(c.demand_score), date: date10(c.latest_signal_date), state: c.state,
        metro: clean(c.metro || "", 40), lat: c.hq_lat, lng: c.hq_lng, source: "CraneGenius signals",
        extra: { project_type: clean(c.project_type || "", 30), crane_relevance: num(c.crane_relevance_score), timing_score: num(c.timing_score), confidence_score: num(c.confidence_score), signal_count: c.signal_count }
      });
      const company = clean(c.company_name || "", 50);
      if (company && company !== "?") g.edge(nid, g.node("account", company, undefined, { kind: "account" }), "for_account");
    });
    (snap.prospects || []).forEach(h => {
      const nid = entity("prospect", h.company_name || "prospect", {
        id: "prospect:" + h.prospect_id, signal_type: clean(h.top_event_type || "", 30),
        score: num(h.max_severity_score), date: date10(h.top_event_date), metro: clean(h.hq_city || "", 40),
        lat: h.hq_lat, lng: h.hq_lng, narrative: h.teaser || h.teaser_narrative || "", source: "Trigger prospects",
        extra: { trigger_count: h.trigger_count }
      });
      const tier = clean(h.icp_tier || "", 30);
      if (tier && tier !== "?") {
        const t = g.node("tier", tier.replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase()), "tier:" + slugify(tier), { kind: "tier" });
        g.edge(nid, t, "at_tier");
      }
    });
    (snap.dc_opps || []).forEach(d => {
      const nid = entity("opportunity", d.project_name || "data center", {
        id: "dcopp:" + d.id, vertical: "Data Center", value_usd: num(d.estimated_crane_spend_usd),
        score: num(d.composite_score), date: date10(d.latest_signal_date), state: d.state,
        lat: d.cluster_lat, lng: d.cluster_lng, source: "Data center pipeline",
        extra: { capacity_mw: num(d.estimated_capacity_mw), construction_value_usd: num(d.estimated_construction_value_usd) }
      });
      const cust = clean(d.estimated_end_customer || "", 40);
      if (cust && cust !== "?") g.edge(nid, g.node("account", cust, undefined, { kind: "account" }), "for_account");
    });
    (snap.dc_signals || []).forEach(s => {
      const nid = entity("signal", s.equipment_type || s.source_type || "signal", {
        id: "dcsig:" + s.id, vertical: "Data Center", signal_type: clean(s.source_type || "", 30),
        score: (num(s.confidence_score) || 0) * 100, date: date10(s.event_date), state: s.state,
        lat: s.latitude, lng: s.longitude, source: "Data center pipeline", narrative: clean(s.probable_project || "", 80),
        extra: { equipment_type: clean(s.equipment_type || "", 30), equipment_size_mva: num(s.equipment_size_mva) }
      });
      [s.consignee, s.probable_end_customer].forEach(w => {
        w = clean(w || "", 40); if (w && w !== "?") g.edge(nid, g.node("account", w, undefined, { kind: "account" }), "for_account");
      });
    });
    (snap.pdm || []).forEach(f => {
      const nid = entity("facility", f.facility_name || "facility", {
        id: "facility:" + (f.facility_id != null ? f.facility_id : slugify(f.facility_name || "")),
        vertical: clean(f.naics_primary || "Maintenance", 30),
        score: num(f.pdm_score), date: date10(f.latest_signal_date), state: f.state,
        metro: clean(f.city || "", 40), lat: f.headquarters_lat, lng: f.headquarters_lng,
        source: "PdM/CMMS scores",
        extra: { cmms_score: num(f.cmms_score), pdm_tier: clean(f.pdm_tier || "", 20), signal_count: f.signal_count_90d }
      });
      const co = clean(f.parent_company || "", 50);
      if (co && co !== "?") g.edge(nid, g.node("account", co, undefined, { kind: "account" }), "operated_by");
    });
    // trades: per-(project x trade) demand windows (trade_demand_windows_public).
    // Annotates project nodes with props.trades for the lens filter, creates the
    // project node from the window row when the capped projects feed missed it,
    // and links each project to its trade node (network mode shows the ICP web).
    (snap.trades || []).forEach(w => {
      const pid = "project:" + w.project_id;
      if (!g.get(pid)) {
        entity("project", w.project_name || "project", {
          id: pid, vertical: clean(w.project_type || "", 30), state: w.state,
          date: date10(w.latest_signal_date), source: "Trade demand windows",
          extra: { city: clean(w.city || "", 40) }
        });
      }
      const n = g.get(pid);
      const arr = n.props.trades || (n.props.trades = []);
      if (!arr.includes(w.trade)) arr.push(w.trade);
      if (!n.props.date) n.props.date = date10(w.latest_signal_date);
      if (!n.props["window_" + w.trade]) n.props["window_" + w.trade] = date10(w.window_open_estimate);
      const tn = g.node("trade", w.trade_display_name || w.trade, "trade:" + w.trade, { kind: "trade", icp_tier: w.icp_tier });
      g.edge(pid, tn, "needs_trade");
    });
    (snap.capex || []).forEach(x => {
      const nid = entity("signal", x.account_name || x.signal_type || "capex", {
        id: "capex:" + x.id, vertical: clean(x.vertical || "Capex", 30), signal_type: clean(x.signal_type || "", 30),
        date: date10(x.signal_date), state: x.state, metro: clean(x.metro || "", 40), source: "Capex signals",
        narrative: clean(x.theme || "", 80), extra: { days_to_rfp: x.days_to_estimated_rfp }
      });
      const a = clean(x.account_name || "", 40);
      if (a && a !== "?") g.edge(nid, g.node("account", a, undefined, { kind: "account" }), "at_account");
    });

    // country-aggregate layer: one marker per international country from the
    // v_intl_signals_by_country view, so every country with data always renders
    // on the map even if its individual projects fell outside the value-ranked
    // caps. Placed at the country centroid. Skips US (home market, drawn as
    // states) and CA (already dense from per-source permit feeds). Uses a
    // dedicated node id ("country:CC") so it never collides with a project or
    // territory node. Sized by project_count via value_usd so the dot scales.
    const countryRows = (snap.country_agg && snap.country_agg.length)
      ? snap.country_agg
      : deriveCountryAgg(snap.projects);
    countryRows.forEach(c => {
      const cc = normCountry(c.country);
      if (!cc || cc === "US" || cc === "CA") return;
      if (!COUNTRY_CENTROIDS[cc]) return;
      const pc = num(c.project_count) || 0;
      const sc = num(c.signal_count) || 0;
      const pipe = num(c.pipeline_usd);
      const sources = Array.isArray(c.sources) ? c.sources.filter(Boolean).slice(0, 8).join(", ") : "";
      const ctr = COUNTRY_CENTROIDS[cc];
      const [dy, dx] = jitter("country:" + cc);
      const la = Math.round((ctr[0] + dy) * 1e4) / 1e4;
      const lo = Math.round((ctr[1] + dx) * 1e4) / 1e4;
      const id = "country:" + cc;
      g.node("project", cc + " pipeline", id, {
        kind: "country", vertical: "International", signal_type: "country rollup",
        value_usd: pipe != null ? pipe : null, score: null, date: date10(c.latest_signal),
        state: cc, metro: "", lat: la, lng: lo,
        narrative: pc + " projects, " + sc + " signals tracked in " + cc + (sources ? " from " + sources + "." : "."),
        source: "International rollup",
        project_count: pc, signal_count: sc, pipeline_usd: pipe != null ? pipe : null
      });
      const terr = g.node("territory", cc, undefined, { kind: "territory" });
      const tn = g.get(terr);
      if (tn.props.lat == null) { tn.props.lat = ctr[0]; tn.props.lng = ctr[1]; }
      g.edge(id, terr, "in_territory");
    });

    // serialize like Python graph.to_dict()
    const deg = {};
    for (const e of g.edges.values()) { deg[e.source] = (deg[e.source] || 0) + 1; deg[e.target] = (deg[e.target] || 0) + 1; }
    const counts = {};
    const nodes = [...g.nodes.values()].map(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
      return { id: n.id, type: n.type, label: n.label, color: (NODE_TYPES[n.type] || {}).color || "#888", degree: deg[n.id] || 0, props: n.props };
    });
    const edges = [...g.edges.values()];
    return { meta: { node_count: nodes.length, edge_count: edges.length, counts, palette: PALETTE, node_types: NODE_TYPES }, nodes, edges };
  }

  // ---- live Supabase loader (anon key, same pattern as the terminals) ----
  async function loadFromSupabase(sb, caps) {
    caps = caps || {};
    const cap = (k, d) => caps[k] || d;
    async function q(table, cols, orderCol, limit) {
      let b = sb.from(table).select(cols);
      if (orderCol) b = b.order(orderCol, { ascending: false, nullsFirst: false });
      if (limit) b = b.limit(limit);
      const { data, error } = await b;
      if (error) { console.warn("graphify live: " + table + " -> " + error.message); return []; }
      return data || [];
    }
    // International feeds are pulled PER SOURCE so no single high-volume feed
    // (e.g. Canada permits) crowds the others out of a global value ranking. The
    // source list is discovered from v_signal_coverage_by_source, so every new
    // non-US collector that lands in the DB starts feeding the map without a JS
    // release. The static list is only an insurance path when the coverage view
    // is absent or still migrating.
    const PROJECT_COLS = "id,project_name,city,state,country,project_type,estimated_value,source_name";
    const FALLBACK_INTL_SOURCES = ["eu_ted", "uk_find_a_tender", "uk_planning",
      "ted_de", "ted_fr", "ted_nordic", "ted_pl",
      "ae_tejari", "sa_etimad", "qa_mof", "za_etenders", "ng_bpp", "ke_ppip",
      "pncp", "aneel_siga", "ibama_sislic", "bndes", "caged",
      "br_comprasgov", "comprasmx", "mx_compranet", "mx_cdmx_permits", "inegi_imss",
      "secop", "cl_mercadopublico", "seia", "chilecompra",
      "seace", "comprar", "sicop", "panamacompra", "sercop",
      "ca_calgary_permits", "ca_vancouver_permits", "ca_toronto_permits",
      "ca_montreal_permits", "ca_edmonton_permits", "ca_ottawa_permits",
      "ca_canadabuys", "west_kelowna_building_permits",
      "bc_infrastructure_projects", "vancouver_building_permits",
      "au_austender", "au_nsw_da", "au_plansa", "sg_gebiz", "nz_gets",
      "in_cppp", "jp_jetro", "kr_koneps"];
    function hasExpandedCountry(row) {
      const countries = Array.isArray(row.countries) ? row.countries : [];
      return countries.some(c => {
        const cc = normCountry(c);
        return cc && cc !== "US" && cc !== "USA";
      });
    }
    async function qCoverageSources(limit) {
      const { data, error } = await sb.from("v_signal_coverage_by_source")
        .select("source_name,project_count,countries")
        .order("project_count", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) {
        console.warn("graphify live: v_signal_coverage_by_source -> " + error.message);
        return FALLBACK_INTL_SOURCES;
      }
      const names = (data || []).filter(hasExpandedCountry).map(r => r.source_name).filter(Boolean);
      return names.length ? names : FALLBACK_INTL_SOURCES;
    }
    async function qProjectsIntl(perSource, sourceLimit) {
      const sources = await qCoverageSources(sourceLimit);
      const pulls = await Promise.all(sources.map(async (src) => {
        const { data, error } = await sb.from("projects").select(PROJECT_COLS)
          .eq("source_name", src)
          .order("estimated_value", { ascending: false, nullsFirst: false }).limit(perSource);
        if (error) { console.warn("graphify live: projects(" + src + ") -> " + error.message); return []; }
        return data || [];
      }));
      return pulls.flat();
    }
    function mergeProjects(main, intl) {
      const seen = new Set(main.map(r => r.id));
      for (const r of intl) if (!seen.has(r.id)) { seen.add(r.id); main.push(r); }
      return main;
    }
    // pdm: the maintenance-intelligence ICP (Vertical 02). Reads an anon-readable
    // public view of facility scores; only queried when caps.pdm > 0, so the
    // explorer never errors before the backend creates the view.
    const pdmCap = cap("pdm", 0);
    // trades: per-trade demand windows; only queried when caps.trades > 0 (same
    // guard pattern as pdm) so the explorer never errors before migration 027.
    const tradesCap = cap("trades", 0);
    const [projects, projectsIntl, signals, crane, prospects, dc_opps, dc_signals, pdm, trades] = await Promise.all([
      q("projects", PROJECT_COLS, "estimated_value", cap("projects", 400)),
      qProjectsIntl(cap("projects_intl_per_source", 150), cap("intl_source_limit", 120)),
      q("signals", "id,project_id,signal_type,signal_strength,signal_date,source_name,summary", "signal_date", cap("signals", 600)),
      q("cranegenius_project_signals_public", "project_key,project_name,project_type,vertical,company_name,city,state,metro,signal_count,estimated_spend_proxy,crane_relevance_score,demand_score,timing_score,confidence_score,hq_lat,hq_lng,latest_signal_date", "demand_score", cap("crane", 250)),
      q("trigger_hot_prospects_public", "prospect_id,company_name,icp_tier,max_severity_score,trigger_count,top_event_type,top_event_date,hq_city,hq_lat,hq_lng,teaser_narrative", "max_severity_score", cap("prospects", 250)),
      q("dc_opportunities", "id,project_name,state,estimated_end_customer,estimated_capacity_mw,composite_score,estimated_crane_spend_usd,estimated_construction_value_usd,cluster_lat,cluster_lng,latest_signal_date", "composite_score", cap("dc_opps", 400)),
      q("dc_signals", "id,source_type,equipment_type,equipment_size_mva,shipper,consignee,probable_project,probable_end_customer,state,latitude,longitude,confidence_score,event_date", "event_date", cap("dc_signals", 200)),
      pdmCap > 0
        ? q("pdm_cmms_facilities_public", "facility_id,facility_name,parent_company,naics_primary,state,city,headquarters_lat,headquarters_lng,pdm_score,cmms_score,pdm_tier,signal_count_90d,latest_signal_date", "pdm_score", pdmCap)
        : Promise.resolve([]),
      tradesCap > 0
        ? q("trade_demand_windows_public", "project_id,project_name,city,state,project_type,trade,trade_display_name,icp_tier,matched_signal_count,latest_signal_date,window_open_estimate", "matched_signal_count", tradesCap)
        : Promise.resolve([])
    ]);
    // country aggregate: one row per international country from the anon-readable
    // v_intl_signals_by_country view. This guarantees every country with data gets
    // a marker on the map even when its individual projects fall outside the
    // value-ranked per-feed caps (e.g. Costa Rica has null project values, Panama
    // is small-nominal). Additive only: it does not replace the project/signal feeds.
    const country_agg = await q("v_intl_signals_by_country",
      "country,project_count,signal_count,pipeline_usd,sources,latest_signal", "project_count", 200);
    return { projects: mergeProjects(projects, projectsIntl), signals, crane, prospects, dc_opps, dc_signals, pdm, trades, country_agg, capex: [] };
  }

  global.GraphifyBuild = { buildLive, loadFromSupabase, NODE_TYPES, PALETTE };
})(window);
