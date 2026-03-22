/**
 * parallax.js — Lightweight parallax for hero section elements
 * Elements with [data-parallax] move at different speeds when scrolling.
 * data-parallax-speed: float (0 = no movement, 1 = full scroll speed)
 * Exports: init(heroEl), destroy()
 */

let rafId = null;
let heroEl = null;
let items = [];
let active = false;

function onScroll() {
  if (!active) return;
  rafId = requestAnimationFrame(() => {
    const scrollY = window.scrollY || window.pageYOffset;
    const heroBottom = heroEl.offsetTop + heroEl.offsetHeight;

    // Only apply parallax while hero section is partially visible
    if (scrollY > heroBottom) return;

    for (const { el, speed } of items) {
      const yOffset = -(scrollY * speed);
      el.style.transform = `translate3d(0, ${yOffset}px, 0)`;
    }
  });
}

export function init(el) {
  if (!el) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  heroEl = el;
  items = [];

  const parallaxEls = el.querySelectorAll('[data-parallax]');
  parallaxEls.forEach(pel => {
    const speed = parseFloat(pel.dataset.parallaxSpeed) || 0.2;
    items.push({ el: pel, speed });
  });

  if (!items.length) return;

  active = true;
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function destroy() {
  active = false;
  window.removeEventListener('scroll', onScroll);
  if (rafId) cancelAnimationFrame(rafId);
  for (const { el } of items) {
    el.style.transform = '';
  }
  items = [];
}
