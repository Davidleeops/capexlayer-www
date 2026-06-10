/* CapexLayer Terminal: LatAm maintenance signals (additive layer).
 *
 * Reads the anon view v_pdm_cmms_latam_opportunities via Supabase REST with the
 * publishable key (same client config as app.js). Fully additive: it renders a
 * separate section below the US facility terminal and NEVER touches that view.
 * Fails safe in every path: on missing config or any fetch error the section
 * stays hidden and the US terminal is unaffected.
 */
(function () {
  "use strict";

  var VIEW = "v_pdm_cmms_latam_opportunities";
  var COUNTRY_LABELS = {
    BR: "Brazil", MX: "Mexico", CL: "Chile", CO: "Colombia",
    PE: "Peru", AR: "Argentina", CR: "Costa Rica", PA: "Panama",
  };

  var rows = [];
  var filters = { country: "", rel: "" };

  function $(sel) { return document.querySelector(sel); }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      if (k === "class") node.className = props[k];
      else if (k === "html") node.innerHTML = props[k];
      else node.setAttribute(k, props[k]);
    });
    (Array.isArray(children) ? children : [children]).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function fmtDate(s) {
    if (!s) return "";
    var d = new Date(s);
    if (isNaN(d.getTime())) return String(s).slice(0, 10);
    var days = Math.round((Date.now() - d.getTime()) / 86400000);
    if (days < 1) return "today";
    if (days < 30) return days + "d ago";
    if (days < 365) return Math.round(days / 30) + "mo ago";
    return d.toISOString().slice(0, 10);
  }

  function relLabel(r) {
    return r === "maintenance_primary" ? "Primary" : "Adjacent";
  }

  async function load() {
    var cfg = window.PDMCMMS_CONFIG;
    if (!cfg || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return null;
    var base = cfg.SUPABASE_URL.replace(/\/$/, "");
    var headers = {
      apikey: cfg.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
    };
    var cols = "project_id,country,city,buyer_name,latest_signal_date," +
      "maintenance_relevance,pdm_signal_count,signal_summary,signal_age_days,source_url";
    var url = base + "/rest/v1/" + VIEW +
      "?select=" + cols + "&order=latest_signal_date.desc&limit=500";
    try {
      var res = await fetch(url, { headers: headers });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      return Array.isArray(data) ? data : null;
    } catch (e) {
      console.warn("LatAm signals fetch failed:", e);
      return null;
    }
  }

  function initCountryFilter() {
    var sel = $("#latam-country");
    if (!sel) return;
    var seen = {};
    rows.forEach(function (r) { if (r.country) seen[r.country] = true; });
    Object.keys(seen).sort().forEach(function (c) {
      sel.appendChild(el("option", { value: c }, COUNTRY_LABELS[c] || c));
    });
  }

  function filtered() {
    return rows.filter(function (r) {
      if (filters.country && r.country !== filters.country) return false;
      if (filters.rel && r.maintenance_relevance !== filters.rel) return false;
      return true;
    });
  }

  function render() {
    var body = $("#latam-body");
    if (!body) return;
    body.innerHTML = "";
    var view = filtered();
    var countEl = $("#latam-count");
    if (countEl) countEl.textContent = view.length + " opportunities";

    view.forEach(function (r, i) {
      var relClass = r.maintenance_relevance === "maintenance_primary"
        ? "lt-primary" : "lt-adjacent";
      var src = r.source_url
        ? el("a", { class: "fkey", href: r.source_url, target: "_blank", rel: "noopener noreferrer" }, "View")
        : el("span", { class: "latam-nosrc" }, "n/a");
      var summ = (r.signal_summary || "").slice(0, 120);
      var tr = el("tr", {}, [
        el("td", { class: "rank" }, String(i + 1)),
        el("td", {}, COUNTRY_LABELS[r.country] || r.country || ""),
        el("td", {}, r.city || ""),
        el("td", { class: "latam-buyer" }, r.buyer_name || "(unnamed)"),
        el("td", { class: "latam-summ", title: r.signal_summary || "" }, summ),
        el("td", {}, el("span", { class: "tier " + relClass }, relLabel(r.maintenance_relevance))),
        el("td", { class: "signals" }, String(r.pdm_signal_count || 0)),
        el("td", { class: "last" }, fmtDate(r.latest_signal_date)),
        el("td", {}, src),
      ]);
      body.appendChild(tr);
    });
  }

  function bind() {
    var c = $("#latam-country");
    if (c) c.addEventListener("change", function (e) { filters.country = e.target.value; render(); });
    var rel = $("#latam-rel");
    if (rel) rel.addEventListener("change", function (e) { filters.rel = e.target.value; render(); });
  }

  async function start() {
    var data = await load();
    if (!data || data.length === 0) return; // fail safe: stay hidden
    rows = data;
    var section = $("#latam-section");
    if (section) section.style.display = "";
    initCountryFilter();
    bind();
    render();
  }

  document.addEventListener("DOMContentLoaded", start);
})();
