/**
 * counters.js — Animated number counters on scroll
 * Works with .spec-card elements that have data-counter-target attribute.
 * data-counter-target: numeric target value
 * data-counter-text: suffix text appended after the number (e.g. " кВт")
 * data-counter-prefix: prefix text before the number (e.g. "до ")
 * data-counter-decimals: number of decimal places (default 0)
 * data-counter-static: skip animation, keep text as-is
 *
 * Exports: init(containerEl), destroy()
 */

let observer = null;
let animated = false;

function animateValue(el, target, prefix, suffix, decimals, duration) {
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current = eased * target;
    const display = decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString('ru-RU');
    el.textContent = (prefix || '') + display + (suffix || '');
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
}

export function init(containerEl) {
  if (!containerEl) {
    // Try by ID
    containerEl = document.getElementById('about-specs');
  }
  if (!containerEl) return;

  const cards = containerEl.querySelectorAll('.spec-card[data-counter-target]');
  if (!cards.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function runCounters() {
    if (animated) return;
    animated = true;

    cards.forEach((card, i) => {
      const valueEl = card.querySelector('.spec-card__value');
      if (!valueEl) return;

      const target = parseFloat(card.dataset.counterTarget) || 0;
      const suffix = card.dataset.counterText || '';
      const prefix = card.dataset.counterPrefix || '';
      const decimals = parseInt(card.dataset.counterDecimals, 10) || 0;

      if (reducedMotion) {
        const display = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('ru-RU');
        valueEl.textContent = prefix + display + suffix;
        return;
      }

      setTimeout(() => {
        const duration = target > 100 ? 1800 : 1200;
        animateValue(valueEl, target, prefix, suffix, decimals, duration);
      }, i * 150);
    });
  }

  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
        runCounters();
        observer.disconnect();
      }
    }
  }, { threshold: 0.3 });

  observer.observe(containerEl);
}

export function destroy() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  animated = false;
}
