/* ============================================
   Slide Transition Animation (ESM)
   Used by wizard panels
   ============================================ */

export function init(rootEl, opts = {}) {
  // Slide is used programmatically by constructor wizard — no auto-init needed.
}

/**
 * Transition from one panel to another.
 * @param {HTMLElement} outEl - current active panel
 * @param {HTMLElement} inEl  - next panel to show
 * @param {'left'|'right'} direction
 */
export function transition(outEl, inEl, direction = 'left') {
  if (!outEl || !inEl) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                  document.body.classList.contains('reduce-motion');

  /* 1. Deactivate outgoing panel immediately */
  outEl.classList.remove('wizard__panel--active');
  outEl.style.opacity = '0';
  outEl.style.pointerEvents = 'none';

  /* 2. Prepare incoming */
  if (!reduced) {
    inEl.style.transform = direction === 'left' ? 'translateX(40px)' : 'translateX(-40px)';
    inEl.style.opacity = '0';
  }
  inEl.classList.add('wizard__panel--active');

  if (reduced) {
    inEl.style.transform = '';
    inEl.style.opacity = '';
    outEl.style.opacity = '';
    outEl.style.pointerEvents = '';
    return;
  }

  /* 3. Animate incoming on next frame */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      inEl.style.transform = '';
      inEl.style.opacity = '';
    });
  });

  /* 4. Clean up outgoing after transition */
  setTimeout(() => {
    outEl.style.opacity = '';
    outEl.style.pointerEvents = '';
  }, 350);
}

export function destroy() {}
