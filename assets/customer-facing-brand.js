(function () {
  if (document.body && document.body.classList.contains('unified-brand-active')) return;
  function mount() {
    document.body.classList.add('unified-brand-active');
    if (!document.querySelector('.platform-backdrop, .unified-brand-backdrop')) {
      ['unified-brand-backdrop', 'unified-brand-atmosphere', 'unified-brand-beam'].forEach(function (className) {
        var el = document.createElement('div');
        el.className = className;
        el.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(el, document.body.firstChild);
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
