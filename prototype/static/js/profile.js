/* ============================================
   Profile page logic
   ============================================ */

import { getOrders, loadDraft, clearDraft } from './store.js';
import { showToast } from './toast.js';
import { getUser } from './auth.js';

export function init() {
  const user = getUser();
  const nameEl = document.querySelector('.profile-name');
  if (nameEl && user) nameEl.textContent = user.email;

  initTabs();
  renderOrders();
  renderDraft();
}

function initTabs() {
  const tabs = document.querySelectorAll('.profile-tab');
  const panels = document.querySelectorAll('.profile-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('profile-tab--active'));
      panels.forEach(p => p.classList.remove('profile-panel--active'));
      tab.classList.add('profile-tab--active');
      const target = document.getElementById(tab.dataset.target);
      if (target) target.classList.add('profile-panel--active');
    });
  });
}

function renderOrders() {
  const wrap = document.getElementById('orders-list');
  if (!wrap) return;
  const orders = getOrders();

  if (!orders.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#128230;</div><p>Заявок пока нет</p></div>`;
    return;
  }

  wrap.innerHTML = orders.map(o => {
    const model = o.payload?.model || '—';
    const date = new Date(o.createdAt).toLocaleDateString('ru-RU');
    return `
      <div class="order-card card">
        <div class="order-card__body">
          <div class="order-card__id">${o.id}</div>
          <div class="order-card__date">${date}</div>
          <div class="order-card__model">Модель: ${model}</div>
        </div>
        <div class="order-card__right">
          <div class="order-card__total">${fmt(o.total)}</div>
          <span class="badge badge--${badgeClass(o.status)}">${o.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderDraft() {
  const wrap = document.getElementById('draft-area');
  if (!wrap) return;
  const draft = loadDraft();

  if (!draft) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#128221;</div><p>Нет сохранённых черновиков</p></div>`;
    return;
  }

  const model = draft.model || '—';
  const specs = draft.specs?.join(', ') || '—';
  const saved = draft.savedAt ? new Date(draft.savedAt).toLocaleString('ru-RU') : '';

  wrap.innerHTML = `
    <div class="draft-card card">
      <div class="draft-card__header">
        <div>
          <strong>Черновик конфигурации</strong>
          <div class="text-sm text-secondary">${saved}</div>
        </div>
        <div class="draft-card__actions">
          <a href="index.html#constructor" class="btn btn--secondary btn--sm">Редактировать</a>
          <button class="btn btn--ghost btn--sm" id="delete-draft">Удалить</button>
        </div>
      </div>
      <p class="text-sm">Модель: <strong>${model}</strong> | Опции: ${specs}</p>
    </div>
  `;

  document.getElementById('delete-draft')?.addEventListener('click', () => {
    clearDraft();
    renderDraft();
    showToast('Черновик удалён', 'success');
  });
}

function fmt(n) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

function badgeClass(status) {
  if (status === 'новая') return 'new';
  if (status === 'в работе') return 'pending';
  return 'done';
}
