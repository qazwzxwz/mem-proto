/* ============================================
   Reveal Animation (ESM)
   Cards / elements fade up on scroll
   ============================================ */

let observer = null;

export function init(rootEl, opts = {}) {
  if (!rootEl) return;

  const selector = opts.selector || '.cap-card';
  const items = rootEl.querySelectorAll(selector);
  if (!items.length) return;

  /* Respect reduced motion */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduce-motion')) {
    items.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  function reveal() {
    items.forEach(el => el.classList.add('revealed'));
  }

  rootEl.addEventListener('section:enter', reveal, { once: true });

  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reveal();
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });
  observer.observe(rootEl);
}

export function destroy() {
  if (observer) observer.disconnect();
}
