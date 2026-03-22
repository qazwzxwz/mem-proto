/* ============================================
   Gallery Showcase — Problem → Solution
   Manages scene navigation + solve/back reveal
   ============================================ */

export function init(section) {
  if (!section) return;

  const wrapper     = section.querySelector('.gs-wrapper');
  const scenes      = Array.from(section.querySelectorAll('.gs-scene'));
  const visScenes   = Array.from(section.querySelectorAll('.gs-visual__scene'));
  const dots        = Array.from(section.querySelectorAll('.gs-nav__dot'));
  const counter     = section.querySelector('.gs-nav__counter');
  const prevBtn     = section.querySelector('[data-dir="prev"]');
  const nextBtn     = section.querySelector('[data-dir="next"]');
  const total       = scenes.length;

  let current = 0;

  /* ── Navigate to scene index ── */
  function goTo(idx) {
    if (idx < 0 || idx >= total || idx === current) return;

    // Reset solved state on leaving
    scenes[current].classList.remove('gs-scene--active', 'gs-scene--solved');
    visScenes[current].classList.remove('gs-visual__scene--active', 'gs-solved');
    dots[current].classList.remove('gs-nav__dot--active');
    if (wrapper) wrapper.classList.remove('gs-wrapper--solved');

    current = idx;

    scenes[current].classList.add('gs-scene--active');
    visScenes[current].classList.add('gs-visual__scene--active');
    visScenes[current].classList.remove('gs-solved');
    dots[current].classList.add('gs-nav__dot--active');

    if (counter) counter.textContent = `${current + 1} / ${total}`;

  }

  /* ── Solve / Back ── */
  function solve() {
    scenes[current].classList.add('gs-scene--solved');
    visScenes[current].classList.add('gs-solved');
    if (wrapper) wrapper.classList.add('gs-wrapper--solved');
  }

  function unsolve() {
    scenes[current].classList.remove('gs-scene--solved');
    visScenes[current].classList.remove('gs-solved');
    if (wrapper) wrapper.classList.remove('gs-wrapper--solved');
  }

  /* ── Click delegation ── */
  section.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="solve"]'))  solve();
    if (e.target.closest('[data-action="back"]'))   unsolve();
  });

  /* ── Dot clicks ── */
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.goto, 10));
    });
  });

  /* ── Arrow clicks ── */
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

  /* ── Keyboard ── */
  section.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  /* ── Touch swipe on content area ── */
  const content = section.querySelector('.gs-content');
  if (content) {
    let startX = 0;
    let startY = 0;

    content.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    content.addEventListener('touchend', (e) => {
      const dx = startX - e.changedTouches[0].clientX;
      const dy = startY - e.changedTouches[0].clientY;

      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

      const isSolved = scenes[current].classList.contains('gs-scene--solved');

      if (dx > 0) {
        if (!isSolved) solve();
        else goTo(current + 1);
      } else {
        if (isSolved) unsolve();
        else goTo(current - 1);
      }
    }, { passive: true });
  }

  /* ── Init ── */
  if (counter) counter.textContent = `1 / ${total}`;
}
