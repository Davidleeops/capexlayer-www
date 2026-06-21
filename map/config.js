// Capital Movement Explorer — default live config (committed).
//
// This makes LIVE mode the default wherever the explorer is deployed: it reads
// the public Supabase views in the browser and builds the graph client-side.
//
// The key below is the project's PUBLISHABLE key. By design it is safe to ship
// in browser code: every row it can reach is gated by row-level security, and
// these feeds carry deliberate anon SELECT policies because they are the public
// teaser layer for the GTM motions. The secret service_role key is never used
// here. To point at a different project or override caps, drop a config.local.js
// next to this file (gitignored); it loads after this and wins.
window.SUPABASE_URL = "https://qdnaglhailuflynirqtt.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_B8SfhndBe7JUg0j_CtwgDA_uRJc95Ln";

// Per-feed row caps for the live pull. Higher = a denser, more alive map across
// every ICP; the tables hold far more (projects ~11k, capex ~55k) so these are
// top-ranked slices. Map mode handles thousands of points; the graph-mode lenses
// already filter, so the higher caps do not bog them down.
//
// pdm = the PdM/CMMS maintenance-intelligence ICP (Vertical 02). Live as of the
// pdm_cmms_facilities_public view (anon-readable, created 2026-06-03). ~134 scored
// facilities today; cap 500 pulls them all. The maintenance lens now renders real
// plants (ExxonMobil Baytown, Dow Freeport, Constellation, ...) on the same map as
// every other ICP — no longer a silo.
window.GRAPHIFY_CAPS = {
  projects: 3000,
  projects_intl_per_source: 220,
  intl_source_limit: 120,
  signals: 5000,
  crane: 1200,
  prospects: 1000,
  dc_opps: 1500,
  dc_signals: 900,
  pdm: 500,
  trades: 5000
};
