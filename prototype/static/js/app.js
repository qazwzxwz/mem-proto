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
}
