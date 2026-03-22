/* ============================================
   Hero Assemble Animation (ESM)
   Elements fly in from edges, logo appears center
   ============================================ */

let observer = null;

export function init(rootEl, opts = {}) {
  if (!rootEl) return;

  const title    = rootEl.querySelector('.hero__title');
  const subtitle = rootEl.querySelector('.hero__subtitle');
  const product  = rootEl.querySelector('.hero__product');
  const actions  = rootEl.querySelector('.hero__actions');
  const elements = [title, subtitle, product, actions].filter(Boolean);

  /* Respect reduced motion */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.body.classList.contains('reduce-motion')) {
    elements.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  function animate() {
    elements.forEach(el => el.classList.add('animated'));
  }

  if (opts.immediate) {
    animate();
    return;
  }

  /* Trigger on section enter */
  rootEl.addEventListener('section:enter', animate, { once: true });

  /* Fallback: IntersectionObserver */
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate();
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });
  observer.observe(rootEl);
}

export function destroy() {
  if (observer) observer.disconnect();
}
