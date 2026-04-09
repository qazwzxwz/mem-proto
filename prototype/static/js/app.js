/* ============================================
   App — global init (header, motion toggle)
   ============================================ */

export function initHeader() {
  /* Burger toggle */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.header__nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const opening = !nav.classList.contains('header__nav--open');
      nav.classList.toggle('header__nav--open', opening);
      burger.classList.toggle('burger--active', opening);
      burger.setAttribute('aria-expanded', opening);
    });

    // Close menu when a nav link is clicked
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('header__nav--open');
        burger.classList.remove('burger--active');
        burger.setAttribute('aria-expanded', false);
      });
    });
  }

  /* Header scroll shadow + dark/light mode based on section */
  const header = document.querySelector('.header');
  if (header) {
    const check = () => header.classList.toggle('header--scrolled', window.scrollY > 10);
    window.addEventListener('scroll', check, { passive: true });
    check();

    /* Detect if header overlaps any dark section (hero only now) */
    const darkSections = document.querySelectorAll('.hero');
    if (darkSections.length) {
      const updateHeaderTheme = () => {
        const headerRect = header.getBoundingClientRect();
        const headerMid = headerRect.top + headerRect.height / 2;
        let onDark = false;
        darkSections.forEach(sec => {
          const r = sec.getBoundingClientRect();
          if (r.top < headerMid && r.bottom > headerMid) {
            onDark = true;
          }
        });
        header.classList.toggle('header--on-dark', onDark);
      };

      // Use fullpage container's scroll or window scroll
      const fpContainer = document.querySelector('.fullpage, #fullpage');
      if (fpContainer) {
        fpContainer.addEventListener('scroll', updateHeaderTheme, { passive: true });
      }
      window.addEventListener('scroll', updateHeaderTheme, { passive: true });

      document.querySelectorAll('.fp-section').forEach(sec => {
        sec.addEventListener('section:enter', updateHeaderTheme);
      });

      updateHeaderTheme();
    }
  }

  /* Motion toggle */
  const motionBtn = document.querySelector('.motion-toggle');
  if (motionBtn) {
    const stored = localStorage.getItem('mem_reduce_motion');
    if (stored === '1') {
      document.body.classList.add('reduce-motion');
      motionBtn.classList.add('motion-toggle--active');
      motionBtn.textContent = 'Анимации OFF';
    }

    motionBtn.addEventListener('click', () => {
      const active = document.body.classList.toggle('reduce-motion');
      motionBtn.classList.toggle('motion-toggle--active', active);
      motionBtn.textContent = active ? 'Анимации OFF' : 'Анимации';
      localStorage.setItem('mem_reduce_motion', active ? '1' : '0');
    });
  }

  /* Active nav link */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage) a.classList.add('active');
  });

  /* Logout */
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('mem_user');
      window.location.href = 'login.html';
    });
  });

  /* Grid hover — красная сетка под курсором.
     Обновляем CSS-переменные --mouse-x / --mouse-y сразу на двух уровнях:
     1) на .fp-section под курсором — для чёткой красной сетки (::after секции)
     2) на .f1-table-wrap / .tp-wrap / .contact-card под курсором — для
        размытой версии (::before этих элементов, filter: blur)
     rAF-throttle, чтобы не триггерить лишние style recalc.
     Только для устройств с настоящей мышью — на тач пропускаем. */
  const hasFineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && window.matchMedia('(min-width: 769px)').matches;
  const sections = hasFineHover ? [...document.querySelectorAll('.fp-section:not(.hero)')] : [];
  const innerTargets = hasFineHover ? [...document.querySelectorAll('.f1-table-wrap, .tp-wrap, .contact-card')] : [];
  if (sections.length || innerTargets.length) {
    let pending = false;
    let lastEv = null;
    let lastSection = null;
    let lastInner = null;

    const hide = (el) => {
      if (!el) return;
      el.style.setProperty('--mouse-x', '-9999px');
      el.style.setProperty('--mouse-y', '-9999px');
    };

    const update = (el, x, y) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${x - r.left}px`);
      el.style.setProperty('--mouse-y', `${y - r.top}px`);
    };

    // Акцентному элементу также пишем смещение относительно его
    // секции — чтобы background-position подвинул tile origin и
    // паттерн совпал с секционной сеткой.
    const updateInnerOffset = (el) => {
      const section = el.closest('.fp-section');
      if (!section) return;
      const sr = section.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      el.style.setProperty('--bg-off-x', `${sr.left - r.left}px`);
      el.style.setProperty('--bg-off-y', `${sr.top - r.top}px`);
    };

    const findHit = (list, x, y) => {
      for (const el of list) {
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el;
      }
      return null;
    };

    const flush = () => {
      pending = false;
      if (!lastEv) return;
      const x = lastEv.clientX;
      const y = lastEv.clientY;

      const currentInner = findHit(innerTargets, x, y);
      const currentSection = findHit(sections, x, y);

      // Акцентный элемент: обновляем его локальные координаты +
      // смещение паттерна относительно секции
      if (lastInner && lastInner !== currentInner) hide(lastInner);
      if (currentInner) {
        update(currentInner, x, y);
        updateInnerOffset(currentInner);
      }
      lastInner = currentInner;

      // Секция: показываем чёткую сетку только если курсор НЕ над
      // акцентным элементом — иначе было бы две сетки (чёткая от секции
      // + размытая от элемента) с разным origin-ом тайлов, что выглядит
      // "криво". Когда курсор над акцентом — прячем секционную.
      if (currentInner) {
        if (lastSection) hide(lastSection);
        lastSection = null;
      } else {
        if (lastSection && lastSection !== currentSection) hide(lastSection);
        if (currentSection) update(currentSection, x, y);
        lastSection = currentSection;
      }
    };

    document.addEventListener('pointermove', (e) => {
      lastEv = e;
      if (!pending) {
        pending = true;
        requestAnimationFrame(flush);
      }
    }, { passive: true });

    // Когда курсор уходит за пределы окна — прячем подсветку
    document.addEventListener('pointerleave', () => {
      hide(lastSection); lastSection = null;
      hide(lastInner); lastInner = null;
    });
  }
}
