/* ============================================
   Fullpage-like scroll manager
   CSS scroll-snap + JS IntersectionObserver

   On mobile (≤768px): fullpage scroll is DISABLED.
   Sections get natural height, native scroll works freely.
   Only IntersectionObserver fires section:enter events.
   ============================================ */

export function init(containerSelector = '.fullpage', dotSelector = '.fp-dots') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const sections = Array.from(container.querySelectorAll('.fp-section'));
  const dotsWrap = document.querySelector(dotSelector);
  let currentIndex = 0;
  let isTransitioning = false;
  let lockTimeout = null;

  /* ── Detect mobile ── */
  const MOBILE_BP = 768;
  function isMobile() {
    return window.innerWidth <= MOBILE_BP;
  }

  /* ── Section labels for dots ── */
  const sectionLabels = ['Главная', 'Возможности', 'Конструктор', 'Проблемы и решения', 'Сравнение', 'Видео'];

  /* ── Create dots ── */
  if (dotsWrap) {
    sections.forEach((sec, i) => {
      const dot = document.createElement('button');
      dot.className = 'fp-dot' + (i === 0 ? ' fp-dot--active' : '');
      dot.setAttribute('aria-label', sectionLabels[i] || `Секция ${i + 1}`);
      dot.setAttribute('data-label', sectionLabels[i] || `${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  /* ── Intersection Observer for dot updates + section:enter ──
     On mobile we use window as root (container is no longer scroll host).
     On desktop we keep container as root. */
  function createObserver() {
    const mobile = isMobile();
    return new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > (mobile ? 0.2 : 0.5)) {
          const idx = sections.indexOf(entry.target);
          if (idx !== -1) {
            currentIndex = idx;
            updateDots(idx);
            entry.target.dispatchEvent(new CustomEvent('section:enter'));
          }
        }
      });
    }, {
      root: mobile ? null : container,
      threshold: mobile ? 0.2 : 0.5
    });
  }

  let observer = createObserver();
  sections.forEach(s => observer.observe(s));

  /* Re-create observer on resize (root changes between mobile/desktop) */
  let prevMobile = isMobile();
  window.addEventListener('resize', () => {
    const nowMobile = isMobile();
    if (nowMobile !== prevMobile) {
      prevMobile = nowMobile;
      observer.disconnect();
      observer = createObserver();
      sections.forEach(s => observer.observe(s));
    }
  });

  /* ── Navigate ── */
  function goTo(index) {
    if (index < 0 || index >= sections.length || isTransitioning) return;
    isTransitioning = true;
    currentIndex = index;
    sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateDots(index);
    clearTimeout(lockTimeout);
    lockTimeout = setTimeout(() => { isTransitioning = false; }, 900);
  }

  function updateDots(idx) {
    if (!dotsWrap) return;
    const dots = dotsWrap.querySelectorAll('.fp-dot');
    dots.forEach((d, i) => d.classList.toggle('fp-dot--active', i === idx));
  }

  /* ── Keyboard (desktop only) ── */
  document.addEventListener('keydown', e => {
    if (isMobile()) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      goTo(currentIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      goTo(currentIndex - 1);
    }
  });

  /* ── Ignore scroll inside interactive panels ── */
  const scrollBlockSelectors = '.wizard-sidebar, .sidebar__items, .gs-content, .gs-nav, .f1-scroll-area'; /* .model-info, .model3d-embed__canvas — временно убраны (3D скрыт) */
  function isInsideScrollBlock(target) {
    return target && target.closest && target.closest(scrollBlockSelectors);
  }

  /* ── Wheel debounce (desktop only) ── */
  let wheelAccum = 0;
  let wheelTimer = null;
  container.addEventListener('wheel', e => {
    if (isMobile()) return;
    /* Inside a scrollable panel — block fullpage but allow internal scroll */
    const scrollBlock = e.target && e.target.closest && e.target.closest(scrollBlockSelectors);
    if (scrollBlock) {
      /* Find the nearest scrollable ancestor within the block */
      let el = e.target;
      while (el && el !== scrollBlock.parentElement) {
        if (el.scrollHeight > el.clientHeight + 1) {
          const atTop = el.scrollTop <= 0 && e.deltaY < 0;
          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
          if (!atTop && !atBottom) {
            /* Still has room to scroll — let native scroll work */
            return;
          }
        }
        el = el.parentElement;
      }
      /* At boundary or not scrollable — eat the event so fullpage doesn't fire */
      e.preventDefault();
      return;
    }
    e.preventDefault();
    wheelAccum += e.deltaY;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      if (Math.abs(wheelAccum) > 30) {
        goTo(currentIndex + (wheelAccum > 0 ? 1 : -1));
      }
      wheelAccum = 0;
    }, 80);
  }, { passive: false });

  /* ── Touch swipe (desktop only — on mobile native scroll works) ── */
  let touchStartY = 0;
  container.addEventListener('touchstart', e => {
    if (isMobile()) return;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  container.addEventListener('touchend', e => {
    if (isMobile()) return;
    if (isInsideScrollBlock(e.target)) return;
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      goTo(currentIndex + (diff > 0 ? 1 : -1));
    }
  }, { passive: true });

  return { goTo, getCurrentIndex: () => currentIndex, destroy: () => observer.disconnect() };
}
