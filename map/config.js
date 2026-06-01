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

// Per-feed row caps for the live pull (keeps the graph renderable; the tables
// hold far more — projects ~11k, capex ~55k — so we take the top-ranked slice).
window.GRAPHIFY_CAPS = { projects: 400, signals: 600, crane: 250, prospects: 250, dc_opps: 400, dc_signals: 200 };
