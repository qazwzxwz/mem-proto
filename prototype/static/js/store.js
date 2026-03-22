/* ============================================
   Store — localStorage wrapper
   Keys: mem_draft_v1, orders_demo_v1
   ============================================ */

const KEYS = {
  DRAFT:  'mem_draft_v1',
  ORDERS: 'orders_demo_v1',
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function write(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch { return false; }
}

/* ── Draft ── */
export function saveDraft(payload) {
  const draft = { ...payload, savedAt: new Date().toISOString() };
  return write(KEYS.DRAFT, draft);
}

export function loadDraft() {
  return read(KEYS.DRAFT);
}

export function clearDraft() {
  localStorage.removeItem(KEYS.DRAFT);
}

/* ── Orders ── */
export function getOrders() {
  return read(KEYS.ORDERS) || [];
}

export function addOrder(payload, total) {
  const orders = getOrders();
  const order = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase(),
    createdAt: new Date().toISOString(),
    payload,
    total,
    status: 'новая',
  };
  orders.push(order);
  write(KEYS.ORDERS, orders);
  return order;
}

export function updateOrderStatus(id, status) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx].status = status;
    write(KEYS.ORDERS, orders);
    return orders[idx];
  }
  return null;
}

export function deleteOrder(id) {
  const orders = getOrders().filter(o => o.id !== id);
  write(KEYS.ORDERS, orders);
}
