/* ============================================
   Gallery — horizontal scroll strip + Lightbox
   ============================================ */

let overlay = null;
let imgEl = null;
let counterEl = null;
let images = [];
let currentIdx = 0;

export function init(stripSelector = '.gallery__strip') {
  const strip = document.querySelector(stripSelector);
  if (!strip) return;

  /* ── Navigation arrows for strip (one photo at a time) ── */
  const wrap = strip.closest('.gallery__strip-wrap');
  if (wrap) {
    const prevBtn = wrap.querySelector('.gallery__nav--prev');
    const nextBtn = wrap.querySelector('.gallery__nav--next');
    /* Each thumb is 100% width, so scroll by one full item */
    const scrollOneItem = () => {
      const firstThumb = strip.querySelector('.gallery__thumb');
      return firstThumb ? firstThumb.offsetWidth : strip.clientWidth;
    };

    prevBtn?.addEventListener('click', () => {
      strip.scrollBy({ left: -scrollOneItem(), behavior: 'smooth' });
    });
    nextBtn?.addEventListener('click', () => {
      strip.scrollBy({ left: scrollOneItem(), behavior: 'smooth' });
    });
  }

  /* ── Collect thumbs ── */
  const thumbs = Array.from(strip.querySelectorAll('.gallery__thumb'));
  images = thumbs.map(t => {
    const img = t.querySelector('img');
    return img ? (img.dataset.full || img.src) : '';
  }).filter(Boolean);

  if (!images.length) return;

  createLightbox();

  thumbs.forEach((thumb, i) => {
    if (!thumb.querySelector('img')) return; // skip placeholders without images
    thumb.addEventListener('click', () => openLightbox(i));
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('tabindex', '0');
    thumb.setAttribute('aria-label', `Открыть фото ${i + 1}`);
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
  });
}

function createLightbox() {
  overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Просмотр фотографий');
  overlay.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close" aria-label="Закрыть">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Предыдущее фото">&#8249;</button>
      <img src="" alt="Фото продукта МЭМ">
      <button class="lightbox-nav lightbox-next" aria-label="Следующее фото">&#8250;</button>
      <div class="lightbox-counter" aria-live="polite"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  imgEl = overlay.querySelector('img');
  counterEl = overlay.querySelector('.lightbox-counter');

  overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  overlay.querySelector('.lightbox-prev').addEventListener('click', () => navigate(-1));
  overlay.querySelector('.lightbox-next').addEventListener('click', () => navigate(1));

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('lightbox-overlay--open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  /* Touch swipe in lightbox */
  let touchX = 0;
  overlay.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
  }, { passive: true });
}

function openLightbox(idx) {
  currentIdx = idx;
  showImage();
  overlay.classList.add('lightbox-overlay--open');
  document.body.style.overflow = 'hidden';
  overlay.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
  overlay.classList.remove('lightbox-overlay--open');
  document.body.style.overflow = '';
}

function navigate(dir) {
  currentIdx = (currentIdx + dir + images.length) % images.length;
  showImage();
}

function showImage() {
  imgEl.src = images[currentIdx];
  imgEl.alt = `Фото ${currentIdx + 1} из ${images.length}`;
  if (counterEl) counterEl.textContent = `${currentIdx + 1} / ${images.length}`;
}

export function destroy() {
  if (overlay) { overlay.remove(); overlay = null; }
}
