/**
 * spec-pulse.js — Micro-animation: spec card icons pulse/wobble when entering viewport
 * Exports: init(containerSelector), destroy()
 */

let observer = null;

export function init(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const icons = container.querySelectorAll('.spec-card__icon');
  if (!icons.length) return;

  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        // Stagger the animations
        const icon = entry.target;
        const card = icon.closest('.spec-card');
        const allCards = Array.from(container.querySelectorAll('.spec-card'));
        const idx = allCards.indexOf(card);
        const delay = idx * 100;

        setTimeout(() => {
          icon.classList.add('spec-card__icon--animate');
          // Remove class after animation so it can retrigger
          icon.addEventListener('animationend', () => {
            icon.classList.remove('spec-card__icon--animate');
          }, { once: true });
        }, delay);

        observer.unobserve(icon);
      }
    }
  }, { threshold: 0.5 });

  icons.forEach(icon => observer.observe(icon));
}

export function destroy() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
