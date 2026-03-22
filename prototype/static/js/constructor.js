/* ============================================
   Constructor / Price Wizard
   Two-column: steps left, sidebar summary right
   ============================================ */

import { saveDraft, loadDraft, addOrder } from './store.js';
import { showToast } from './toast.js';
import { transition } from './animations/slide.js';

/* ── Data ── */
const MODELS = [
  { id: 'mem-s',  name: 'МЭМ-S (базовый)',   price: 450000, desc: 'Генератор 5 кВт, базовый набор' },
  { id: 'mem-m',  name: 'МЭМ-M (стандарт)',   price: 720000, desc: 'Генератор 10 кВт, расширенный ЗИП' },
  { id: 'mem-l',  name: 'МЭМ-L (макс.)',      price: 1050000, desc: 'Генератор 15 кВт, полный комплект' },
];

const SPECS = [
  { id: 'welder',      name: 'Сварочный аппарат',       price: 85000 },
  { id: 'pump',        name: 'Насосная станция',         price: 65000 },
  { id: 'heater',      name: 'Теплоаккумулятор',        price: 55000 },
  { id: 'fire',        name: 'Система пожаротушения',   price: 95000 },
  { id: 'battery',     name: 'Доп. аккумулятор 5 кВт·ч', price: 120000 },
  { id: 'irrigation',  name: 'Ирригационный модуль',    price: 48000 },
];

const SERVICES = [
  { id: 'delivery', name: 'Доставка по РФ',         price: 0 },
  { id: 'install',  name: 'Монтаж и пуско-наладка', price: 35000 },
  { id: 'training', name: 'Обучение персонала',     price: 15000 },
  { id: 'warranty', name: 'Расширенная гарантия +2г', price: 25000 },
];

const PROMOS = {
  'DEMO10':   { type: 'percent', value: 10, label: '−10%' },
  'SAVE1000': { type: 'fixed',   value: 1000, label: '−1 000 ₽' },
};

/* ── State ── */
let state = {
  step: 0,
  model: null,
  specs: [],
  services: [],
  contact: { name: '', phone: '', email: '', comment: '' },
  promo: null,
};

let wizardEl = null;
let sidebarEl = null;
let overlayEl = null;
let rootEl = null;
let panels = [];
let stepBtns = [];

/* ── Init ── */
export function init(rootSelector = '.constructor__wrapper') {
  rootEl = document.querySelector(rootSelector);
  if (!rootEl) return;

  wizardEl  = rootEl.querySelector('.wizard');
  sidebarEl = rootEl.querySelector('.wizard-sidebar');
  overlayEl = rootEl.querySelector('[data-sidebar-overlay]');
  if (!wizardEl || !sidebarEl) return;

  panels   = Array.from(wizardEl.querySelectorAll('.wizard__panel'));
  stepBtns = Array.from(wizardEl.querySelectorAll('.wizard__step-btn'));

  renderModels();
  renderSpecs();
  renderServices();
  bindNavigation();
  bindPromo();
  bindActions();
  bindMobileSidebar();
  bindSidebarScroll();
  restoreDraft();
  updateSidebar();
  goToStep(0);
}

/* ── Render choice lists ── */
function renderModels() {
  const wrap = wizardEl.querySelector('[data-panel="model"] .wizard__choices');
  if (!wrap) return;
  wrap.innerHTML = MODELS.map(m => `
    <label class="choice" data-model="${m.id}">
      <input type="radio" name="model" value="${m.id}" aria-label="${m.name}">
      <div class="choice__body">
        <div class="choice__title">${m.name}<span class="choice__price">${fmt(m.price)}</span></div>
        <div class="choice__desc">${m.desc}</div>
      </div>
    </label>
  `).join('');

  wrap.addEventListener('change', e => {
    state.model = e.target.value;
    wrap.querySelectorAll('.choice').forEach(c =>
      c.classList.toggle('choice--active', c.dataset.model === state.model));
    updateSidebar();
  });
}

function renderSpecs() {
  const wrap = wizardEl.querySelector('[data-panel="specs"] .wizard__choices');
  if (!wrap) return;
  wrap.innerHTML = SPECS.map(s => `
    <label class="choice" data-spec="${s.id}">
      <input type="checkbox" value="${s.id}" aria-label="${s.name}">
      <div class="choice__body">
        <div class="choice__title">${s.name}<span class="choice__price">${fmt(s.price)}</span></div>
      </div>
    </label>
  `).join('');

  wrap.addEventListener('change', () => {
    state.specs = Array.from(wrap.querySelectorAll('input:checked')).map(i => i.value);
    wrap.querySelectorAll('.choice').forEach(c =>
      c.classList.toggle('choice--active', state.specs.includes(c.dataset.spec)));
    updateSidebar();
  });
}

function renderServices() {
  const wrap = wizardEl.querySelector('[data-panel="services"] .wizard__choices');
  if (!wrap) return;
  wrap.innerHTML = SERVICES.map(s => `
    <label class="choice" data-svc="${s.id}">
      <input type="checkbox" value="${s.id}" aria-label="${s.name}">
      <div class="choice__body">
        <div class="choice__title">${s.name}${s.price ? `<span class="choice__price">${fmt(s.price)}</span>` : '<span class="choice__price" style="color:var(--color-accent-dark)">бесплатно</span>'}</div>
      </div>
    </label>
  `).join('');

  wrap.addEventListener('change', () => {
    state.services = Array.from(wrap.querySelectorAll('input:checked')).map(i => i.value);
    wrap.querySelectorAll('.choice').forEach(c =>
      c.classList.toggle('choice--active', state.services.includes(c.dataset.svc)));
    updateSidebar();
  });
}

/* ── Step navigation ── */
function bindNavigation() {
  stepBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => goToStep(i));
  });

  wizardEl.querySelectorAll('[data-action="next"]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(state.step + 1));
  });
  wizardEl.querySelectorAll('[data-action="prev"]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(state.step - 1));
  });
}

function goToStep(idx) {
  if (idx < 0 || idx >= panels.length) return;

  /* Hide ALL panels first, then show target */
  const prevPanel = panels[state.step];
  const nextPanel = panels[idx];

  if (prevPanel !== nextPanel) {
    const dir = idx > state.step ? 'left' : 'right';
    transition(prevPanel, nextPanel, dir);
  } else {
    nextPanel.classList.add('wizard__panel--active');
  }

  state.step = idx;
  stepBtns.forEach((b, i) => {
    b.classList.toggle('wizard__step-btn--active', i === idx);
    b.classList.toggle('wizard__step-btn--done', i < idx);
    b.setAttribute('aria-selected', i === idx ? 'true' : 'false');
  });

  /* Carousel scroll for ≤500px: show current + next */
  const progressBar = wizardEl.querySelector('.wizard__progress');
  if (progressBar && window.innerWidth <= 500) {
    const scrollIdx = Math.min(idx, panels.length - 2);
    const btnW = progressBar.scrollWidth / panels.length;
    progressBar.scrollTo({ left: btnW * scrollIdx, behavior: 'smooth' });
  }
}

/* ── Mobile sidebar modal ── */
function bindMobileSidebar() {
  /* Open sidebar buttons */
  wizardEl.querySelectorAll('[data-action="open-sidebar"]').forEach(btn => {
    btn.addEventListener('click', () => openSidebar());
  });

  /* Close sidebar */
  sidebarEl.querySelector('[data-action="close-sidebar"]')?.addEventListener('click', closeSidebar);
  overlayEl?.addEventListener('click', closeSidebar);
}

function openSidebar() {
  sidebarEl.classList.add('wizard-sidebar--open');
  overlayEl?.classList.add('sidebar-overlay--open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebarEl.classList.remove('wizard-sidebar--open');
  overlayEl?.classList.remove('sidebar-overlay--open');
  document.body.style.overflow = '';
}

/* ── Trap wheel scroll inside sidebar__items ── */
function bindSidebarScroll() {
  const itemsEl = sidebarEl.querySelector('.sidebar__items');
  if (!itemsEl) return;

  itemsEl.addEventListener('wheel', e => {
    const { scrollTop, scrollHeight, clientHeight } = itemsEl;
    const atTop = scrollTop === 0 && e.deltaY < 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;

    /* Only prevent page scroll when there's room to scroll inside the list */
    if (!atTop && !atBottom) {
      e.preventDefault();
      e.stopPropagation();
      itemsEl.scrollTop += e.deltaY;
    }
  }, { passive: false });
}

/* ── Sidebar promo ── */
function bindPromo() {
  const btn = sidebarEl.querySelector('[data-action="apply-promo"]');
  const input = sidebarEl.querySelector('[data-promo-input]');
  const result = sidebarEl.querySelector('.promo-result');
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const code = input.value.trim().toUpperCase();
    if (PROMOS[code]) {
      state.promo = { code, ...PROMOS[code] };
      result.textContent = `${code}: ${PROMOS[code].label}`;
      result.className = 'promo-result promo-result--success';
    } else {
      state.promo = null;
      result.textContent = code ? 'Промокод не найден' : '';
      result.className = 'promo-result promo-result--error';
    }
    updateSidebar();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
  });
}

/* ── Calculate total ── */
function calcTotal() {
  let sum = 0;
  const model = MODELS.find(m => m.id === state.model);
  if (model) sum += model.price;
  state.specs.forEach(sid => {
    const s = SPECS.find(x => x.id === sid);
    if (s) sum += s.price;
  });
  state.services.forEach(sid => {
    const s = SERVICES.find(x => x.id === sid);
    if (s) sum += s.price;
  });

  let discount = 0;
  if (state.promo) {
    if (state.promo.type === 'percent') discount = Math.round(sum * state.promo.value / 100);
    else discount = state.promo.value;
  }

  return { subtotal: sum, discount, total: Math.max(0, sum - discount) };
}

/* ── Update sidebar line items + totals ── */
function updateSidebar() {
  if (!sidebarEl) return;

  const itemsWrap = sidebarEl.querySelector('.sidebar__items');
  const subtotalEl = sidebarEl.querySelector('.sidebar__subtotal-value');
  const discountRow = sidebarEl.querySelector('.sidebar__discount');
  const totalValEl = sidebarEl.querySelector('.sidebar__total-value');

  /* Build line items */
  const lines = [];

  const model = MODELS.find(m => m.id === state.model);
  if (model) {
    lines.push({ name: model.name, price: model.price, cls: 'sidebar__item--model' });
  }

  state.specs.forEach(sid => {
    const s = SPECS.find(x => x.id === sid);
    if (s) lines.push({ name: s.name, price: s.price, cls: '' });
  });

  state.services.forEach(sid => {
    const s = SERVICES.find(x => x.id === sid);
    if (s) lines.push({ name: s.name, price: s.price, cls: '' });
  });

  if (lines.length === 0) {
    itemsWrap.innerHTML = '<div class="sidebar__empty">Выберите модель и опции</div>';
  } else {
    itemsWrap.innerHTML = lines.map(l => `
      <div class="sidebar__item ${l.cls}">
        <span class="sidebar__item-name">${l.name}</span>
        <span class="sidebar__item-price">${l.price ? fmt(l.price) : 'бесплатно'}</span>
      </div>
    `).join('');
  }

  /* Totals */
  const { subtotal, discount, total } = calcTotal();

  if (subtotalEl) subtotalEl.textContent = fmt(subtotal);

  if (discountRow) {
    if (discount > 0) {
      discountRow.innerHTML = `<span>Скидка (${state.promo?.code})</span><span>−${fmt(discount)}</span>`;
      discountRow.style.display = '';
    } else {
      discountRow.innerHTML = '';
      discountRow.style.display = 'none';
    }
  }

  if (totalValEl) totalValEl.textContent = fmt(total);
}

/* ── Actions: save draft, submit ── */
function bindActions() {
  sidebarEl.querySelector('[data-action="save-draft"]')?.addEventListener('click', () => {
    gatherContacts();
    saveDraft(state);
    showToast('Черновик сохранён', 'success');
  });

  sidebarEl.querySelector('[data-action="submit"]')?.addEventListener('click', () => {
    gatherContacts();
    if (!state.model) {
      showToast('Сначала выберите модель', 'error');
      goToStep(0);
      return;
    }
    const { total } = calcTotal();
    const order = addOrder({ ...state }, total);
    showToast(`Заявка ${order.id} создана!`, 'success');
  });
}

function gatherContacts() {
  const panel = wizardEl.querySelector('[data-panel="contacts"]');
  if (!panel) return;
  state.contact.name    = panel.querySelector('[name="c_name"]')?.value || '';
  state.contact.phone   = panel.querySelector('[name="c_phone"]')?.value || '';
  state.contact.email   = panel.querySelector('[name="c_email"]')?.value || '';
  state.contact.comment = panel.querySelector('[name="c_comment"]')?.value || '';
}

/* ── Restore draft ── */
function restoreDraft() {
  const draft = loadDraft();
  if (!draft) return;

  if (draft.model) {
    state.model = draft.model;
    const radio = wizardEl.querySelector(`input[name="model"][value="${draft.model}"]`);
    if (radio) { radio.checked = true; radio.closest('.choice')?.classList.add('choice--active'); }
  }
  if (draft.specs?.length) {
    state.specs = draft.specs;
    draft.specs.forEach(sid => {
      const cb = wizardEl.querySelector(`[data-panel="specs"] input[value="${sid}"]`);
      if (cb) { cb.checked = true; cb.closest('.choice')?.classList.add('choice--active'); }
    });
  }
  if (draft.services?.length) {
    state.services = draft.services;
    draft.services.forEach(sid => {
      const cb = wizardEl.querySelector(`[data-panel="services"] input[value="${sid}"]`);
      if (cb) { cb.checked = true; cb.closest('.choice')?.classList.add('choice--active'); }
    });
  }
  if (draft.contact) {
    const p = wizardEl.querySelector('[data-panel="contacts"]');
    if (p) {
      if (draft.contact.name)  p.querySelector('[name="c_name"]').value = draft.contact.name;
      if (draft.contact.phone) p.querySelector('[name="c_phone"]').value = draft.contact.phone;
      if (draft.contact.email) p.querySelector('[name="c_email"]').value = draft.contact.email;
      if (draft.contact.comment) p.querySelector('[name="c_comment"]').value = draft.contact.comment;
    }
  }
  if (draft.promo) state.promo = draft.promo;
}

/* ── Helpers ── */
function fmt(n) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}
