/* ============================================
   Toast notifications
   ============================================ */

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.className = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('role', 'status');
  document.body.appendChild(container);
  return container;
}

export function showToast(message, type = 'info', duration = 3500) {
  const wrap = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast${type === 'success' ? ' toast--success' : type === 'error' ? ' toast--error' : ''}`;
  el.textContent = message;

  wrap.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add('toast--visible');
    });
  });

  setTimeout(() => {
    el.classList.remove('toast--visible');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 500); // fallback
  }, duration);
}
