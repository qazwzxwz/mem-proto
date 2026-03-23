/* ============================================
   Technical Passport — Проблемы и решения
   Desktop: animated tab switcher + content panels
   Mobile:  accordion node scheme
   ============================================ */

const DESKTOP_BP = 900; // px — matches CSS breakpoint

export function init(section) {
  if (!section) return;

  /* ── Shared refs ── */
  const tabs      = Array.from(section.querySelectorAll('.tp-tab'));
  const panels    = Array.from(section.querySelectorAll('.tp-panel'));
  const nodes     = Array.from(section.querySelectorAll('.tp-node'));

  let currentIdx  = 0;
  let exitTimer   = null;

  /* Edge tabs: CSS uses data-edge only for .tp-tab__line origin (no longer needed for borders) */

  /* ── Accent-word animation (reuse hero logic) ── */
  function animateAccent(container) {
    const accents = container.querySelectorAll('.hero__accent');
    accents.forEach(word => {
      // Unwrap any existing spans first
      word.textContent = word.textContent;
      const text = word.textContent;
      word.textContent = '';
      [...text].forEach(ch => {
        const s = document.createElement('span');
        s.textContent = ch;
        word.appendChild(s);
      });
      word.querySelectorAll('span').forEach((s, i) => {
        setTimeout(() => s.classList.add('accented'), 400 + i * 80);
      });
    });
  }

  /* ════════════════════════════════
     DESKTOP — Tab switching
     ════════════════════════════════ */
  function desktopGoTo(idx) {
    if (idx === currentIdx) return;
    const prev = currentIdx;
    currentIdx = idx;

    /* — OLD TAB: side borders slide down (top→bottom), bottom line reappears — */
    const prevTab = tabs[prev];
    prevTab.classList.add('tp-tab--leaving');     // changes transform-origin to top → scaleY(0)
    prevTab.classList.remove('tp-tab--active');   // bottom line (.tp-tab__line) returns (scaleX 1)
    prevTab.setAttribute('aria-selected', 'false');
    clearTimeout(exitTimer);
    exitTimer = setTimeout(() => prevTab.classList.remove('tp-tab--leaving'), 320);

    /* — NEW TAB: bottom line splits away, side borders slide up from bottom — */
    tabs[idx].classList.add('tp-tab--active');
    tabs[idx].setAttribute('aria-selected', 'true');

    /* — OLD PANEL: fade out — */
    const oldPanel = panels[prev];
    oldPanel.classList.remove('tp-panel--active');

    /* — NEW PANEL: redraw animation — */
    const newPanel = panels[idx];
    newPanel.classList.add('tp-panel--active');

    const inner = newPanel.querySelector('.tp-panel__inner');
    if (inner) {
      inner.style.animation = 'none';
      void inner.offsetHeight;
      inner.style.animation = '';
    }
  }

  /* ════════════════════════════════
     MOBILE — Accordion nodes
     ════════════════════════════════ */
  function mobileToggle(idx) {
    const node = nodes[idx];
    const body = node.querySelector('.tp-node__body');
    const trigger = node.querySelector('.tp-node__trigger');

    const isOpen = node.classList.contains('tp-node--open');

    if (isOpen) {
      /* Close */
      node.classList.remove('tp-node--open');
      trigger.setAttribute('aria-expanded', 'false');
      body.setAttribute('aria-hidden', 'true');
    } else {
      /* Close any open node first */
      nodes.forEach((n, i) => {
        if (i !== idx && n.classList.contains('tp-node--open')) {
          n.classList.remove('tp-node--open');
          const t = n.querySelector('.tp-node__trigger');
          const b = n.querySelector('.tp-node__body');
          if (t) t.setAttribute('aria-expanded', 'false');
          if (b) b.setAttribute('aria-hidden', 'true');
        }
      });

      /* Open this node */
      node.classList.add('tp-node--open');
      trigger.setAttribute('aria-expanded', 'true');
      body.setAttribute('aria-hidden', 'false');

      /* Scroll node into view smoothly */
      setTimeout(() => {
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  }

  /* ── Event listeners ── */
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      if (window.innerWidth > DESKTOP_BP) desktopGoTo(i);
    });
  });

  nodes.forEach((node, i) => {
    const trigger = node.querySelector('.tp-node__trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        if (window.innerWidth <= DESKTOP_BP) mobileToggle(i);
      });
    }
  });

  /* ── Keyboard navigation on desktop tabs ── */
  tabs.forEach((tab, i) => {
    tab.addEventListener('keydown', e => {
      if (window.innerWidth <= DESKTOP_BP) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); desktopGoTo(Math.min(i + 1, tabs.length - 1)); tabs[currentIdx].focus(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); desktopGoTo(Math.max(i - 1, 0)); tabs[currentIdx].focus(); }
      if (e.key === 'Home')       { e.preventDefault(); desktopGoTo(0); tabs[0].focus(); }
      if (e.key === 'End')        { e.preventDefault(); desktopGoTo(tabs.length - 1); tabs[tabs.length - 1].focus(); }
    });
  });

  /* ── Animate accent words on section enter ── */
  section.addEventListener('section:enter', () => {
    animateAccent(section.querySelector('.tp-header'));
  });

  /* ── Init state ── */
  if (tabs[0])   tabs[0].setAttribute('aria-selected', 'true');
  if (panels[0]) panels[0].classList.add('tp-panel--active');
}
