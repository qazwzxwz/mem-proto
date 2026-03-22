/* ============================================
   Admin panel logic
   ============================================ */

import { getOrders, updateOrderStatus, deleteOrder } from './store.js';
import { showToast } from './toast.js';

const STATUSES = ['новая', 'в работе', 'выполнена', 'отклонена'];

/* ── Modal refs ── */
let modalOverlay, modalTitle, modalDate, modalStatus, modalContacts,
    modalConfig, modalPricing, modalStatusSelect, modalSaveBtn, modalCloseBtn;
let currentOrderId = null;

export function init() {
  cacheModalRefs();
  renderStats();
  renderTable();
  setupModalEvents();
}

let modalBody;

function cacheModalRefs() {
  modalOverlay     = document.getElementById('orderModal');
  modalTitle       = document.getElementById('orderModalTitle');
  modalDate        = document.getElementById('orderModalDate');
  modalStatus      = document.getElementById('orderModalStatus');
  modalBody        = document.getElementById('orderModalBody');
  modalStatusSelect= document.getElementById('orderModalStatusSelect');
  modalSaveBtn     = document.getElementById('orderModalSaveStatus');
  modalCloseBtn    = document.getElementById('orderModalClose');
}

function setupModalEvents() {
  if (!modalOverlay) return;

  // Close button
  modalCloseBtn?.addEventListener('click', closeModal);

  // Click overlay background
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('order-modal-overlay--open')) {
      closeModal();
    }
  });

  // Save status
  modalSaveBtn?.addEventListener('click', () => {
    if (!currentOrderId) return;
    const newStatus = modalStatusSelect.value;
    updateOrderStatus(currentOrderId, newStatus);
    modalStatus.textContent = newStatus;
    modalStatus.dataset.status = newStatus;
    renderStats();
    renderTable();
    showToast(`Статус ${currentOrderId} → ${newStatus}`, 'success');
  });
}

function openModal(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || !modalOverlay) return;

  currentOrderId = orderId;

  // Title & date
  modalTitle.textContent = `Заявка ${order.id}`;
  modalDate.textContent = new Date(order.createdAt).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Status badge
  modalStatus.textContent = order.status;
  modalStatus.dataset.status = order.status;

  // Build structured body
  const p = order.payload || {};
  let html = '';

  /* ── 1. Контактные данные ── */
  const contacts = [
    { label: 'Имя', value: p.c_name, icon: '👤' },
    { label: 'Телефон', value: p.c_phone, icon: '📞' },
    { label: 'Email', value: p.c_email, icon: '✉️' },
  ].filter(c => c.value);

  html += `<div class="order-modal__section">
    <h3 class="order-modal__section-title">Контактные данные</h3>
    <div class="order-modal__card">`;

  if (contacts.length) {
    html += `<div class="order-modal__contacts">`;
    html += contacts.map(c => `
      <div class="order-modal__contact-item">
        <span class="order-modal__contact-icon">${c.icon}</span>
        <div>
          <span class="order-modal__contact-label">${c.label}</span>
          <span class="order-modal__contact-value">${esc(c.value)}</span>
        </div>
      </div>
    `).join('');
    html += `</div>`;
  } else {
    html += `<div class="order-modal__empty">Не указаны</div>`;
  }

  if (p.c_comment) {
    html += `<div class="order-modal__comment">
      <span class="order-modal__contact-label">Комментарий</span>
      <p class="order-modal__comment-text">${esc(p.c_comment)}</p>
    </div>`;
  }
  html += `</div></div>`;

  /* ── 2. Модель ── */
  if (p.model) {
    html += `<div class="order-modal__section">
      <h3 class="order-modal__section-title">Модель</h3>
      <div class="order-modal__card order-modal__model-card">
        <span class="order-modal__model-name">${esc(p.model)}</span>
        ${p.modelPrice ? `<span class="order-modal__model-price">${fmt(p.modelPrice)}</span>` : ''}
      </div>
    </div>`;
  }

  /* ── 3. Характеристики ── */
  if (p.specs && Array.isArray(p.specs) && p.specs.length) {
    html += `<div class="order-modal__section">
      <h3 class="order-modal__section-title">Характеристики</h3>
      <div class="order-modal__card">`;
    html += p.specs.map(s => {
      const name = typeof s === 'string' ? s : (s.name || s);
      const price = typeof s === 'object' ? s.price : 0;
      return `<div class="order-modal__config-item">
        <span class="order-modal__config-dot"></span>
        <span class="order-modal__config-name">${esc(typeof name === 'string' ? name : JSON.stringify(name))}</span>
        ${price ? `<span class="order-modal__config-price">+${fmt(price)}</span>` : ''}
      </div>`;
    }).join('');
    html += `</div></div>`;
  }

  /* ── 4. Услуги ── */
  if (p.services && Array.isArray(p.services) && p.services.length) {
    html += `<div class="order-modal__section">
      <h3 class="order-modal__section-title">Услуги</h3>
      <div class="order-modal__card">`;
    html += p.services.map(s => {
      const name = typeof s === 'string' ? s : (s.name || s);
      return `<div class="order-modal__config-item">
        <span class="order-modal__config-dot order-modal__config-dot--service"></span>
        <span class="order-modal__config-name">${esc(typeof name === 'string' ? name : JSON.stringify(name))}</span>
      </div>`;
    }).join('');
    html += `</div></div>`;
  }

  /* ── 5. Промокод ── */
  if (p.promoCode) {
    html += `<div class="order-modal__section">
      <h3 class="order-modal__section-title">Промокод</h3>
      <div class="order-modal__card order-modal__promo-card">
        <span class="order-modal__promo-code">${esc(p.promoCode)}</span>
        ${p.discount ? `<span class="order-modal__promo-discount">−${fmt(p.discount)}</span>` : ''}
      </div>
    </div>`;
  }

  /* ── 6. Итог ── */
  const subtotal = order.total || 0;
  const discount = p.discount || 0;

  html += `<div class="order-modal__section order-modal__section--total">
    <div class="order-modal__card order-modal__total-card">`;
  if (discount > 0) {
    html += `
      <div class="order-modal__pricing-row">
        <span>Подитог</span><span>${fmt(subtotal + discount)}</span>
      </div>
      <div class="order-modal__pricing-row order-modal__pricing-discount">
        <span>Скидка</span><span>−${fmt(discount)}</span>
      </div>`;
  }
  html += `
    <div class="order-modal__pricing-row order-modal__pricing-row--total">
      <span>Итого</span><span>${fmt(subtotal)}</span>
    </div>
    </div></div>`;

  modalBody.innerHTML = html;

  // Status select
  modalStatusSelect.innerHTML = STATUSES.map(s =>
    `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`
  ).join('');

  // Show
  modalOverlay.classList.add('order-modal-overlay--open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove('order-modal-overlay--open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentOrderId = null;
}

/* ── Stats ── */
function renderStats() {
  const orders = getOrders();
  setText('#stat-total', orders.length);
  setText('#stat-new', orders.filter(o => o.status === 'новая').length);
  setText('#stat-revenue', fmt(orders.reduce((s, o) => s + (o.total || 0), 0)));
}

/* ── Table ── */
function renderTable() {
  const tbody = document.querySelector('#orders-tbody');
  if (!tbody) return;
  const orders = getOrders();

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--sp-10);color:var(--color-text-secondary)">Нет заявок</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const date = new Date(o.createdAt).toLocaleDateString('ru-RU');
    const model = o.payload?.model || '—';
    const optionsHtml = STATUSES.map(s =>
      `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    return `
      <tr data-id="${o.id}">
        <td><strong>${o.id}</strong></td>
        <td>${date}</td>
        <td>${model}</td>
        <td>${fmt(o.total)}</td>
        <td>
          <select class="status-select" data-id="${o.id}" aria-label="Статус заявки ${o.id}">
            ${optionsHtml}
          </select>
        </td>
        <td class="admin-table__actions">
          <button class="btn--view" data-view="${o.id}">Просмотр</button>
          <button class="btn btn--ghost btn--sm" data-delete="${o.id}" aria-label="Удалить заявку ${o.id}">&#10005;</button>
        </td>
      </tr>
    `;
  }).join('');

  /* Status change */
  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      updateOrderStatus(sel.dataset.id, sel.value);
      renderStats();
      showToast(`Статус ${sel.dataset.id} → ${sel.value}`, 'success');
    });
  });

  /* View */
  tbody.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.view));
  });

  /* Delete */
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteOrder(btn.dataset.delete);
      renderStats();
      renderTable();
      showToast('Заявка удалена', 'success');
    });
  });
}

/* ── Helpers ── */
function fmt(n) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
}

function setText(sel, val) {
  const el = document.querySelector(sel);
  if (el) el.textContent = val;
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
