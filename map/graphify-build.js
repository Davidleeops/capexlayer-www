/* graphify-build.js — build the capital-movement graph in the browser.
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
    vertical: { color: "#d68a3a", tag: "vertical" }, metro: { color: "#5ad0d0", tag: "metro" }
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
  function locate(lat, lng, state, key) {
    const la = parseFloat(lat), lo = parseFloat(lng);
    if (!isNaN(la) && !isNaN(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180 && (la || lo))
      return [la, lo];
    const c = STATE_CENTROIDS[normState(state)];
    if (!c) return [null, null];
    const [dy, dx] = jitter(key || state);
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
    function entity(type, label, o) {
      o = o || {};
      const vertical = o.vertical ? o.vertical.charAt(0).toUpperCase() + o.vertical.slice(1) : "";
      const st = normState(o.state);
      const [la, lo] = locate(o.lat, o.lng, st, o.id);
      const props = Object.assign({
        kind: type, vertical, signal_type: o.signal_type || "", value_usd: o.value_usd != null ? o.value_usd : null,
        score: o.score != null ? o.score : null, date: o.date || "", state: st, metro: o.metro || "",
        lat: la, lng: lo, narrative: clean(o.narrative || "", 240), source: o.source || ""
      }, o.extra || {});
      const nid = g.node(type, label, o.id, props);
      if (st) {
        const terr = g.node("territory", st, undefined, { kind: "territory" });
        const c = STATE_CENTROIDS[st];
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
        value_usd: num(p.estimated_value), state: p.state, source: clean(p.source_name || "", 36),
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
    (snap.capex || []).forEach(x => {
      const nid = entity("signal", x.account_name || x.signal_type || "capex", {
        id: "capex:" + x.id, vertical: clean(x.vertical || "Capex", 30), signal_type: clean(x.signal_type || "", 30),
        date: date10(x.signal_date), state: x.state, metro: clean(x.metro || "", 40), source: "Capex signals",
        narrative: clean(x.theme || "", 80), extra: { days_to_rfp: x.days_to_estimated_rfp }
      });
      const a = clean(x.account_name || "", 40);
      if (a && a !== "?") g.edge(nid, g.node("account", a, undefined, { kind: "account" }), "at_account");
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
    const [projects, signals, crane, prospects, dc_opps, dc_signals] = await Promise.all([
      q("projects", "id,project_name,city,state,project_type,estimated_value,source_name", "estimated_value", cap("projects", 400)),
      q("signals", "id,project_id,signal_type,signal_strength,signal_date,source_name,summary", "signal_date", cap("signals", 600)),
      q("cranegenius_project_signals_public", "project_key,project_name,project_type,vertical,company_name,city,state,metro,signal_count,estimated_spend_proxy,crane_relevance_score,demand_score,timing_score,confidence_score,hq_lat,hq_lng,latest_signal_date", "demand_score", cap("crane", 250)),
      q("trigger_hot_prospects_public", "prospect_id,company_name,icp_tier,max_severity_score,trigger_count,top_event_type,top_event_date,hq_city,hq_lat,hq_lng,teaser_narrative", "max_severity_score", cap("prospects", 250)),
      q("dc_opportunities", "id,project_name,state,estimated_end_customer,estimated_capacity_mw,composite_score,estimated_crane_spend_usd,estimated_construction_value_usd,cluster_lat,cluster_lng,latest_signal_date", "composite_score", cap("dc_opps", 400)),
      q("dc_signals", "id,source_type,equipment_type,equipment_size_mva,shipper,consignee,probable_project,probable_end_customer,state,latitude,longitude,confidence_score,event_date", "event_date", cap("dc_signals", 200))
    ]);
    return { projects, signals, crane, prospects, dc_opps, dc_signals, capex: [] };
  }

  global.GraphifyBuild = { buildLive, loadFromSupabase, NODE_TYPES, PALETTE };
})(window);
