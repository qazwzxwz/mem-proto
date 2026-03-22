/* ============================================
   Auth — client-side mock login / register
   ============================================ */

import { showToast } from './toast.js';

export function initLogin(formSelector = '.auth__form') {
  const form = document.querySelector(formSelector);
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors(form);

    const email = form.querySelector('[name="email"]');
    const pass  = form.querySelector('[name="password"]');
    let valid = true;

    if (!email.value || !isEmail(email.value)) {
      setError(email, 'Введите корректный email');
      valid = false;
    }
    if (!pass.value || pass.value.length < 4) {
      setError(pass, 'Пароль минимум 4 символа');
      valid = false;
    }

    if (valid) {
      localStorage.setItem('mem_user', JSON.stringify({ email: email.value, role: 'user' }));
      showToast('Вход выполнен (демо)', 'success');
      setTimeout(() => { window.location.href = 'profile.html'; }, 800);
    }
  });
}

export function initRegister(formSelector = '.auth__form') {
  const form = document.querySelector(formSelector);
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErrors(form);

    const email   = form.querySelector('[name="email"]');
    const pass    = form.querySelector('[name="password"]');
    const confirm = form.querySelector('[name="password_confirm"]');
    let valid = true;

    if (!email.value || !isEmail(email.value)) {
      setError(email, 'Введите корректный email');
      valid = false;
    }
    if (!pass.value || pass.value.length < 6) {
      setError(pass, 'Пароль минимум 6 символов');
      valid = false;
    }
    if (confirm && pass.value !== confirm.value) {
      setError(confirm, 'Пароли не совпадают');
      valid = false;
    }

    if (valid) {
      localStorage.setItem('mem_user', JSON.stringify({ email: email.value, role: 'user' }));
      showToast('Регистрация успешна (демо)', 'success');
      setTimeout(() => { window.location.href = 'profile.html'; }, 800);
    }
  });
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('mem_user'));
  } catch { return null; }
}

export function logout() {
  localStorage.removeItem('mem_user');
  window.location.href = 'login.html';
}

/* ── Helpers ── */
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function setError(input, msg) {
  input.classList.add('input--error');
  let errEl = input.parentElement.querySelector('.form-error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.className = 'form-error';
    errEl.setAttribute('role', 'alert');
    errEl.setAttribute('aria-live', 'assertive');
    input.parentElement.appendChild(errEl);
  }
  errEl.setAttribute('aria-live', 'assertive');
  errEl.textContent = msg;
}

function clearErrors(form) {
  form.querySelectorAll('.input--error').forEach(el => el.classList.remove('input--error'));
  form.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.removeAttribute('aria-live');
  });
}
