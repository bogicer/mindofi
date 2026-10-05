// ============================================================
//  MINDOFI — Login / Register logic
//  TEST MODE: OTP is shown in the interface
// ============================================================

let currentMode = 'login';   // 'login' | 'register'
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
  link.textContent = currentMode === 'login'
    ? t('link_register')
    : t('link_login');
  link.dataset.i18n = currentMode === 'login' ? 'link_register' : 'link_login';
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
    return { success: false, error: t('err_no_server') };
  }
}

// ============================================================
//  STEP 1: SEND OTP
// ============================================================
async function sendOtp() {
  const country = document.getElementById('countrySelect').value;
  const num = document.getElementById('phoneInput').value.replace(/\D/g, '');

  if (!num || num.length < 5) {
    showError(t('err_fill_phone'));
    return;
  }

  otpPhone = country + num;

  const btn = document.getElementById('phoneBtn');
  btn.disabled = true;
  btn.textContent = t('loading');

  const res = await apiPost('auth/otp', { phone: otpPhone });

  btn.disabled = false;
  btn.textContent = t('btn_continue');

  if (!res.success) {
    showError(res.error || t('err_sms_failed'));
    return;
  }

  // TEST MODE
  otpCode = res.otp || '';
  document.getElementById('otpHint').textContent = t('otp_sent_to') + otpPhone;

  if (otpCode) {
    showSuccess(t('test_code') + otpCode);
    console.log(
      '%c🧪 OTP: ' + otpCode,
      'background:#1e3a8a;color:#fff;padding:10px 16px;border-radius:8px;font-size:20px;font-weight:bold;'
    );
  } else {
    showSuccess(t('ok_sms_sent') + otpPhone);
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
    showError(t('err_enter_5_digits'));
    return;
  }

  // Test check
  if (otpCode && code !== otpCode) {
    showError(t('err_wrong_code'));
    for (let i = 1; i <= 5; i++) document.getElementById('o' + i).value = '';
    document.getElementById('o1').focus();
    return;
  }

  if (currentMode === 'register') {
    showScreen('Name');
    setTimeout(() => document.getElementById('nameInput').focus(), 100);
    return;
  }

  // LOGIN
  const res = await apiPost('auth/login', { phone: otpPhone, otp: code });

  if (res.success) {
    localStorage.setItem('mindofi_token', res.token);
    localStorage.setItem('mindofi_user', JSON.stringify(res.user));
    localStorage.setItem('mindofi_phone', otpPhone);
    showSuccess(t('ok_login_done'));

    setTimeout(() => {
      window.location.href = 'app.html';
    }, 600);
  } else {
    showError(res.error || t('err_wrong_code'));
  }
}

// ============================================================
//  AVATAR
// ============================================================
function onAvatarPick(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showError(t('err_avatar_large'));
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
    showError(t('err_enter_name'));
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
    showSuccess(t('ok_account_created'));

    setTimeout(() => {
      window.location.href = 'app.html';
    }, 600);
  } else {
    showError(res.error || t('error'));
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

// Re-apply translations after load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof applyTranslations === 'function') applyTranslations();
});