// ============================================================
//  MINDOFI — Login / Register logic
// ============================================================

let currentMode = 'login';
let otpPhone = '';
let otpCode = '';
let avatarData = null;

// ============================================================
//  THEME
// ============================================================
let dark = localStorage.getItem('mindofi_dark') === '1';

function applyTheme() {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

function toggleTheme() {
  dark = !dark;
  localStorage.setItem('mindofi_dark', dark ? '1' : '0');
  applyTheme();
}

applyTheme();

// ============================================================
//  SCREEN SWITCHING
// ============================================================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen' + name);
  if (el) el.classList.add('active');
}

function goBack(screen) {
  showScreen(screen === 'phone' ? 'Phone' : screen);
}

function toggleMode() {
  currentMode = currentMode === 'login' ? 'register' : 'login';
  const link = document.getElementById('modeLink');
  const key = currentMode === 'login' ? 'link_register' : 'link_login';
  link.dataset.i18n = key;
  if (typeof t === 'function') link.textContent = t(key);
}

// ============================================================
//  MESSAGES
// ============================================================
function showError(msg) {
  const el = document.getElementById('errBox');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

function showSuccess(msg) {
  const el = document.getElementById('okBox');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 8000);
}

// ============================================================
//  API
// ============================================================
async function apiPost(path, data) {
  try {
    const res = await fetch(CONFIG.API_URL + '/' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': CONFIG.API_KEY,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return { success: false, error: (typeof t === 'function' ? t('err_no_server') : 'No connection') };
  }
}

// ============================================================
//  STEP 1: SEND OTP
// ============================================================
async function sendOtp() {
  const country = document.getElementById('countrySelect').value;
  const num = document.getElementById('phoneInput').value.replace(/\D/g, '');

  if (!num || num.length < 5) {
    showError(typeof t === 'function' ? t('err_fill_phone') : 'Enter phone');
    return;
  }

  otpPhone = country + num;

  const btn = document.getElementById('phoneBtn');
  btn.disabled = true;
  btn.textContent = typeof t === 'function' ? t('loading') : 'Loading...';

  const res = await apiPost('auth/otp', { phone: otpPhone });

  btn.disabled = false;
  btn.textContent = typeof t === 'function' ? t('btn_continue') : 'Continue';

  if (!res.success) {
    showError(res.error || (typeof t === 'function' ? t('err_sms_failed') : 'SMS error'));
    return;
  }

  otpCode = res.otp || '';
  document.getElementById('otpHint').textContent = (typeof t === 'function' ? t('otp_sent_to') : 'Code sent to +') + otpPhone;

  if (otpCode) {
    showSuccess((typeof t === 'function' ? t('test_code') : '🧪 CODE: ') + otpCode);
    console.log('%c🧪 OTP: ' + otpCode, 'background:#1e3a8a;color:#fff;padding:10px 16px;border-radius:8px;font-size:20px;font-weight:bold;');
  } else {
    showSuccess((typeof t === 'function' ? t('ok_sms_sent') : 'SMS sent to +') + otpPhone);
  }

  showScreen('Otp');
  setTimeout(() => document.getElementById('o1').focus(), 100);
}

// ============================================================
//  OTP INPUT
// ============================================================
function otpNext(el, n) {
  el.value = el.value.replace(/\D/g, '');
  if (el.value && n < 5) {
    document.getElementById('o' + (n + 1)).focus();
  }
  if (n === 5 && el.value) {
    setTimeout(verifyOtp, 150);
  }
}

function otpBack(e, n) {
  if (e.key === 'Backspace' && !e.target.value && n > 1) {
    document.getElementById('o' + (n - 1)).focus();
  }
}

function getOtpValue() {
  let v = '';
  for (let i = 1; i <= 5; i++) v += document.getElementById('o' + i).value || '';
  return v;
}

// ============================================================
//  STEP 2: VERIFY OTP
// ============================================================
async function verifyOtp() {
  const code = getOtpValue();

  if (code.length !== 5) {
    showError(typeof t === 'function' ? t('err_enter_5_digits') : 'Enter 5 digits');
    return;
  }

  if (otpCode && code !== otpCode) {
    showError(typeof t === 'function' ? t('err_wrong_code') : 'Wrong code');
    for (let i = 1; i <= 5; i++) document.getElementById('o' + i).value = '';
    document.getElementById('o1').focus();
    return;
  }

  if (currentMode === 'register') {
    showScreen('Name');
    setTimeout(() => document.getElementById('nameInput').focus(), 100);
    return;
  }

  const res = await apiPost('auth/login', { phone: otpPhone, otp: code });

  if (res.success) {
    localStorage.setItem('mindofi_token', res.token);
    localStorage.setItem('mindofi_user', JSON.stringify(res.user));
    localStorage.setItem('mindofi_phone', otpPhone);
    showSuccess(typeof t === 'function' ? t('ok_login_done') : 'Login OK');

    setTimeout(() => {
      window.location.href = 'app.html';
    }, 600);
  } else {
    showError(res.error || (typeof t === 'function' ? t('err_wrong_code') : 'Wrong code'));
  }
}

// ============================================================
//  AVATAR
// ============================================================
function onAvatarPick(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showError(typeof t === 'function' ? t('err_avatar_large') : 'Avatar up to 2 MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    avatarData = e.target.result;
    const box = document.getElementById('avatarBox');
    box.innerHTML = '<img src="' + avatarData + '" alt="avatar">';
  };
  reader.readAsDataURL(file);
}

// ============================================================
//  STEP 3: REGISTER
// ============================================================
async function doRegister() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    showError(typeof t === 'function' ? t('err_enter_name') : 'Enter name');
    return;
  }

  let username = document.getElementById('usernameInput').value.trim().replace(/[^\w]/g, '');
  if (username) username = '@' + username;

  const code = getOtpValue();

  const payload = {
    phone: otpPhone,
    otp: code,
    name: name,
    username: username
  };

  if (avatarData) {
    payload.photo_base64 = avatarData.split(',')[1];
  }

  const res = await apiPost('auth/register', payload);

  if (res.success) {
    localStorage.setItem('mindofi_token', res.token);
    localStorage.setItem('mindofi_user', JSON.stringify(res.user));
    localStorage.setItem('mindofi_phone', otpPhone);
    showSuccess(typeof t === 'function' ? t('ok_account_created') : 'Account created');

    setTimeout(() => {
      window.location.href = 'app.html';
    }, 600);
  } else {
    showError(res.error || (typeof t === 'function' ? t('error') : 'Error'));
  }
}

// ============================================================
//  ENTER NAVIGATION
// ============================================================
document.getElementById('phoneInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendOtp();
});

document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('usernameInput').focus();
});

document.getElementById('usernameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') doRegister();
});

// ============================================================
//  APPLY TRANSLATIONS ON LOAD + HIGHLIGHT CURRENT LANG
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Применяем переводы
  if (typeof applyTranslations === 'function') applyTranslations();

  // Подсвечиваем активный язык
  if (typeof getLang === 'function') {
    const lang = getLang();
    document.querySelectorAll('.lang-switch button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  }
});

// На случай, если DOMContentLoaded уже прошёл
if (document.readyState !== 'loading') {
  if (typeof applyTranslations === 'function') applyTranslations();
  if (typeof getLang === 'function') {
    const lang = getLang();
    document.querySelectorAll('.lang-switch button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  }
}
