/* ============================================
   Capabilities Carousel (ESM)
   Infinite scroll + grayscale + typewriter detail
   ============================================ */

/* ── Rich descriptions for each capability ── */
const DESCRIPTIONS = [
  {
    title: 'Генерация и сварка',
    intro: 'Автономный передвижной генератор электричества, САК и сварочный пост. Бензиновый двигатель корейского производства, 3 фазы, возможность работы со сварочным однофазным инвертором.',
    features: [
      'Бензогенератор с АВР или без',
      '3-фазное питание',
      'Сварочный инверторный пост',
      'Быстрый запуск — корейский двигатель',
      'Комплект кабелей и ЗИП в отсеке',
      'Автономная работа до 48 ч'
    ]
  },
  {
    title: 'Сварка в пожароопасных условиях',
    intro: 'Безопасная сварка летом среди сухой травы, вблизи ГСМ и на пожароопасных объектах. Встроенная система контроля возгорания и мгновенного тушения.',
    features: [
      'Искрогасящий экран и огнестойкие перегородки',
      'Интегрированная система пожаротушения',
      'Датчики температуры и задымления',
      'Запас воды 2 000 л для тушения',
      'Соответствие нормам ПБ',
      'Работа рядом с ГСМ-объектами'
    ]
  },
  {
    title: 'Пожаротушение и водоснабжение',
    intro: 'Маленькая пожарная машина: итальянский насос подаёт воду на 10 м в высоту и 30 м вдаль (150 л/мин). Резервуар 2 000 л + 100 л для пенообразователя. Тушение пеной, подъём на высоту через 4 рым-болта.',
    features: [
      'Итальянский насос — 150 л/мин',
      'Дальность струи: 30 м, высота: 10 м',
      'Основной бак 2 000 л',
      'Бак для пенообразователя 100 л',
      'Химдобавки подаются в струю, не в бак',
      '4 рым-болта для подъёма на высоту'
    ]
  },
  {
    title: 'Автономная насосная станция',
    intro: 'Подкачивающая насосная станция для водоснабжения объекта. Расширительный бак 100 л, автоподкачка по мере убывания. Работает круглогодично, включая сильные морозы.',
    features: [
      'Расширительный бак 100 л',
      'Автоматическая подкачка внешним насосом',
      'Минимальные энергозатраты на подачу',
      'Внешнее пополнение автопривозом',
      'Круглогодичная работа (до −40 °C)',
      'Теплоизоляция и обогрев трубопроводов'
    ]
  },
  {
    title: 'Отопление и теплоаккумулятор',
    intro: 'Автономное отопление загородного дома или бытовки. Теплоаккумулятор 1 000–2 000 л, нагрев до 55 °C. Циклическая работа генератора экономит ресурс и топливо. Можно совместить с водоснабжением для ГВС.',
    features: [
      'Теплоаккумулятор 1 000–2 000 л',
      'Нагрев до 55 °C',
      'Обогреватель 700 Вт (≤1 кВт/сутки)',
      'Циклическая работа — экономия топлива',
      'Совмещение отопления и ГВС',
      'Полная теплоизоляция (сэндвич-панели 50 мм)'
    ]
  },
  {
    title: 'Ирригация и сервис',
    intro: 'Орошение теплиц, автополив сельхозугодий, мойка колёс на стройке, прочистка скважин и труб высоким давлением. Удобрения и гербициды вводятся в струю через дополнительный резервуар.',
    features: [
      'Орошение теплиц и автополив',
      'Ввод удобрений/гербицидов в струю',
      'Дополнительный резервуар для химдобавок',
      'Станция мойки колёс на объекте',
      'Прочистка скважин и труб давлением',
      'Борьба с борщевиком и сорняками'
    ]
  }
];

let animFrameId = null;
let currentOffset = 0;
let speed = 0.5; // px per frame
let isPaused = false;
let activeIndex = -1;
let twTimeout = null;
let trackEl = null;
let detailEl = null;
let detailBody = null;
let closeBtn = null;
let carouselEl = null;
let cards = [];
let cloneCount = 0;
let singleSetWidth = 0;
let origCount = 0; // number of original (non-clone) cards

/**
 * Build HTML string for a capability description
 */
function buildDetailHTML(idx) {
  const d = DESCRIPTIONS[idx];
  let html = `<h4>${d.title}</h4>`;
  html += `<p>${d.intro}</p>`;
  html += '<ul>';
  d.features.forEach(f => { html += `<li>${f}</li>`; });
  html += '</ul>';
  return html;
}

/**
 * Typewriter effect: reveals innerHTML character by character,
 * but processes HTML tags instantly (no visible tag chars).
 * Calls onComplete when done.
 */
function typewriterReveal(container, html, charDelay = 18, onComplete) {
  if (twTimeout) clearTimeout(twTimeout);

  container.innerHTML = '';
  let i = 0;

  function tick() {
    if (i >= html.length) {
      if (onComplete) onComplete();
      return;
    }

    // If we hit an HTML tag, add the whole tag at once
    if (html[i] === '<') {
      const closeIdx = html.indexOf('>', i);
      if (closeIdx !== -1) {
        i = closeIdx + 1;
        container.innerHTML = html.substring(0, i);
        twTimeout = setTimeout(tick, 0);
        return;
      }
    }

    i++;
    container.innerHTML = html.substring(0, i);
    twTimeout = setTimeout(tick, charDelay);
  }

  tick();
}

/**
 * Fast erase effect: visibly erases text character-by-character very quickly
 */
let eraseTimer = null;
function fastErase(container, callback) {
  if (eraseTimer) clearTimeout(eraseTimer);
  if (twTimeout) clearTimeout(twTimeout);

  // Get full HTML and walk backwards, stripping visible chars
  let html = container.innerHTML;
  if (!html || html.length === 0) { callback(); return; }

  // Chunk size: erase ~15 chars per tick for speed
  const chunkSize = Math.max(5, Math.ceil(html.length / 20));

  function eraseStep() {
    if (html.length <= 0) {
      container.innerHTML = '';
      eraseTimer = null;
      callback();
      return;
    }

    // Strip from end, but skip closing tags instantly
    let removed = 0;
    while (removed < chunkSize && html.length > 0) {
      if (html.endsWith('>')) {
        // Remove entire tag at once
        const openIdx = html.lastIndexOf('<');
        if (openIdx !== -1) {
          html = html.substring(0, openIdx);
        } else {
          html = html.slice(0, -1);
        }
      } else {
        html = html.slice(0, -1);
        removed++;
      }
    }

    container.innerHTML = html;
    eraseTimer = setTimeout(eraseStep, 8);
  }

  eraseStep();
}

/**
 * Smoothly shrink the detail panel to fit content after typewriter finishes
 */
function smoothFitPanel() {
  if (!detailEl || detailEl.hidden) return;

  // Let the browser compute the natural height
  const currentH = detailEl.offsetHeight;
  detailEl.style.height = 'auto';
  const naturalH = detailEl.offsetHeight;

  if (currentH === naturalH) {
    // No change needed
    return;
  }

  // Animate from current to natural
  detailEl.style.height = currentH + 'px';
  detailEl.offsetHeight; // force reflow
  detailEl.style.transition = 'height 0.35s cubic-bezier(0.4,0,0.2,1)';
  detailEl.style.height = naturalH + 'px';

  function onEnd() {
    detailEl.style.height = 'auto';
    detailEl.style.transition = '';
    detailEl.removeEventListener('transitionend', onEnd);
  }
  detailEl.addEventListener('transitionend', onEnd);
}

/**
 * Scroll the carousel so that the card with the given realIndex
 * is centered in the viewport.
 */
function scrollCardToCenter(realIndex) {
  if (!carouselEl || !trackEl) return;

  const viewW = carouselEl.offsetWidth;
  const gap = parseFloat(getComputedStyle(trackEl).gap) || 20;

  // Find the first card in the track that matches this realIndex
  // and is reasonably close to the current view
  const viewCenter = viewW / 2;
  let bestCard = null;
  let bestDist = Infinity;

  cards.forEach(c => {
    if (parseInt(c.dataset.cap, 10) !== realIndex) return;
    // Card position relative to carousel
    const cardLeft = c.offsetLeft + currentOffset;
    const cardCenter = cardLeft + c.offsetWidth / 2;
    const dist = Math.abs(cardCenter - viewCenter);
    if (dist < bestDist) {
      bestDist = dist;
      bestCard = c;
    }
  });

  if (!bestCard) return;

  // Calculate target offset to center this card
  const cardCenter = bestCard.offsetLeft + bestCard.offsetWidth / 2;
  const targetOffset = viewCenter - cardCenter;

  // Animate offset smoothly
  animateOffset(targetOffset, 1200);
}

/**
 * Smoothly animate currentOffset to a target value
 */
let offsetAnim = null;
function animateOffset(target, duration) {
  if (offsetAnim) cancelAnimationFrame(offsetAnim);

  const start = currentOffset;
  const diff = target - start;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    currentOffset = start + diff * ease;
    trackEl.style.transform = `translateX(${currentOffset}px)`;

    if (progress < 1) {
      offsetAnim = requestAnimationFrame(step);
    } else {
      offsetAnim = null;
      // Normalize offset after animation
      normalizeOffset();
    }
  }

  offsetAnim = requestAnimationFrame(step);
}

/**
 * Keep offset within bounds for seamless looping
 */
function normalizeOffset() {
  if (singleSetWidth <= 0) return;
  while (currentOffset > 0) currentOffset -= singleSetWidth;
  while (Math.abs(currentOffset) >= singleSetWidth) currentOffset += singleSetWidth;
  trackEl.style.transform = `translateX(${currentOffset}px)`;
}

/**
 * Activate a card: stop carousel, colorize, show detail.
 * If detail is already open, do a fast erase → typewrite transition.
 */
function activateCard(realIndex) {
  if (activeIndex === realIndex) return;

  const wasOpen = activeIndex !== -1;
  activeIndex = realIndex;
  isPaused = true;

  // Update card states (both originals and clones)
  cards.forEach(c => {
    const idx = parseInt(c.dataset.cap, 10);
    c.classList.toggle('cap-card--active', idx === realIndex);
  });

  // Scroll selected card to center
  scrollCardToCenter(realIndex);

  if (wasOpen) {
    // Detail already open — fast erase then typewrite new content
    // Lock panel height to prevent jump
    detailEl.style.height = detailEl.offsetHeight + 'px';
    detailEl.style.overflow = 'hidden';

    fastErase(detailBody, () => {
      const html = buildDetailHTML(realIndex);
      typewriterReveal(detailBody, html, 4, () => {
        // After typewriter done, smooth-fit the panel
        detailEl.style.overflow = '';
        smoothFitPanel();
      });
    });
  } else {
    // First open — show panel with entrance animation
    detailEl.hidden = false;
    detailEl.style.height = '';
    detailEl.style.overflow = '';
    detailEl.style.animation = 'none';
    detailEl.offsetHeight; // reflow
    detailEl.style.animation = '';

    const html = buildDetailHTML(realIndex);
    typewriterReveal(detailBody, html, 4, () => {
      smoothFitPanel();
    });
  }
}

/**
 * Deactivate: resume carousel, grayscale all
 */
function deactivate() {
  activeIndex = -1;
  isPaused = false;

  cards.forEach(c => c.classList.remove('cap-card--active'));

  if (twTimeout) clearTimeout(twTimeout);

  // Smooth close the detail panel
  if (detailEl && !detailEl.hidden) {
    const currentH = detailEl.offsetHeight;
    detailEl.style.height = currentH + 'px';
    detailEl.style.overflow = 'hidden';
    detailEl.offsetHeight;
    detailEl.style.transition = 'height 0.3s ease, opacity 0.3s ease';
    detailEl.style.height = '0px';
    detailEl.style.opacity = '0';

    function onEnd() {
      detailEl.hidden = true;
      detailEl.style.height = '';
      detailEl.style.overflow = '';
      detailEl.style.transition = '';
      detailEl.style.opacity = '';
      detailBody.innerHTML = '';
      detailEl.removeEventListener('transitionend', onEnd);
    }
    detailEl.addEventListener('transitionend', onEnd);
  }
}

/**
 * Clone cards to fill the track for seamless infinite loop
 */
function setupClones() {
  const originals = trackEl.querySelectorAll('.cap-card:not(.cap-clone)');
  origCount = originals.length;
  const gap = parseFloat(getComputedStyle(trackEl).gap) || 20;
  singleSetWidth = 0;
  originals.forEach(c => {
    singleSetWidth += c.offsetWidth + gap;
  });

  // Remove old clones
  trackEl.querySelectorAll('.cap-clone').forEach(c => c.remove());

  // We need enough clones to fill at least 3x the viewport
  const viewW = trackEl.parentElement.offsetWidth;
  cloneCount = Math.ceil((viewW * 3) / singleSetWidth) + 1;

  for (let n = 0; n < cloneCount; n++) {
    originals.forEach(orig => {
      const clone = orig.cloneNode(true);
      clone.classList.add('cap-clone');
      trackEl.appendChild(clone);
    });
  }

  // Re-query all cards (originals + clones)
  cards = Array.from(trackEl.querySelectorAll('.cap-card'));

  // Bind events on all cards
  cards.forEach(c => {
    c.removeEventListener('mouseenter', onCardHover);
    c.removeEventListener('click', onCardClick);
    c.addEventListener('mouseenter', onCardHover);
    c.addEventListener('click', onCardClick);
  });
}

function onCardHover(e) {
  if (activeIndex === -1) {
    isPaused = true;
  }
}

function onCardClick(e) {
  const idx = parseInt(e.currentTarget.dataset.cap, 10);
  activateCard(idx);
}

/**
 * Animation loop
 */
function animate() {
  if (!isPaused && !offsetAnim) {
    currentOffset -= speed;
    if (Math.abs(currentOffset) >= singleSetWidth) {
      currentOffset += singleSetWidth;
    }
    trackEl.style.transform = `translateX(${currentOffset}px)`;
  }
  animFrameId = requestAnimationFrame(animate);
}

/**
 * Resume carousel when mouse leaves the whole carousel area (if no card is active)
 */
function onCarouselLeave() {
  if (activeIndex === -1) {
    isPaused = false;
  }
}

/* ── Public API ── */
export function init(rootEl, opts = {}) {
  if (!rootEl) return;
  if (typeof rootEl === 'string') rootEl = document.querySelector(rootEl);
  if (!rootEl) return;

  trackEl = rootEl.querySelector('.cap-carousel__track');
  detailEl = rootEl.querySelector('.cap-detail');
  detailBody = rootEl.querySelector('.cap-detail__body');
  closeBtn = rootEl.querySelector('.cap-detail__close');
  carouselEl = rootEl.querySelector('.cap-carousel');

  if (!trackEl || !detailEl) return;

  /* Respect reduced motion */
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                        document.body.classList.contains('reduce-motion');
  if (reducedMotion) speed = 0;

  setupClones();

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', deactivate);
  }

  // Resume when mouse leaves carousel (if no detail open)
  if (carouselEl) {
    carouselEl.addEventListener('mouseleave', onCarouselLeave);

    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    carouselEl.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchMoved = false;
      if (activeIndex === -1) isPaused = true;
    }, { passive: true });

    carouselEl.addEventListener('touchmove', e => {
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > 8 || dy > 8) touchMoved = true;
    }, { passive: true });

    carouselEl.addEventListener('touchend', e => {
      if (!touchMoved && activeIndex === -1) {
        setTimeout(() => {
          if (activeIndex === -1) isPaused = false;
        }, 300);
      }
    }, { passive: true });
  }

  // Handle resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      currentOffset = 0;
      trackEl.style.transform = 'translateX(0)';
      setupClones();
    }, 300);
  });

  // Start animation
  animFrameId = requestAnimationFrame(animate);

  // Auto-select the card closest to viewport center when section enters
  let autoActivated = false;
  rootEl.addEventListener('section:enter', () => {
    if (!autoActivated && activeIndex === -1) {
      autoActivated = true;
      setTimeout(() => {
        if (activeIndex !== -1) return;

        // Find the card whose center is closest to the carousel's visible center
        const viewW = carouselEl.offsetWidth;
        const viewCenter = viewW / 2;
        let bestIdx = 0;
        let bestDist = Infinity;

        cards.forEach(c => {
          const cardLeft = c.offsetLeft + currentOffset;
          const cardRight = cardLeft + c.offsetWidth;
          // Only consider cards that are at least partially visible
          if (cardRight < 0 || cardLeft > viewW) return;
          const cardCenter = cardLeft + c.offsetWidth / 2;
          const dist = Math.abs(cardCenter - viewCenter);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = parseInt(c.dataset.cap, 10);
          }
        });

        activateCard(bestIdx);
      }, 500);
    }
  });
}

export function destroy() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (twTimeout) clearTimeout(twTimeout);
  if (offsetAnim) cancelAnimationFrame(offsetAnim);
  animFrameId = null;
  offsetAnim = null;
}
