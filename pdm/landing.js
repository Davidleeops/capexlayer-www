/* CapexLayer landing page. Lightweight enhancements only. */
(function () {
  "use strict";

  // Smooth-scroll for in-page anchor links.
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Telemetry-lite: log CTA clicks to console so smoke-testing can confirm wiring.
  document.querySelectorAll(".lp-cta").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var label = btn.textContent.trim();
      var href = btn.getAttribute("href") || "";
      // eslint-disable-next-line no-console
      console.log("[cta]", label, href);
    });
  });
})();
