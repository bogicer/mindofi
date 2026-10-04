// ============================================================
//  MINDOFI — Логика страницы логина (index.html)
// ============================================================

let currentMode = 'login';   // 'login' | 'register'
let otpPhone = '';           // номер в формате 380XXXXXXXXX
let otpCode = '';            // код, который вернул сервер (для теста)
let otpToken = null;         // токен после успешного входа
let avatarData = null;       // base64 аватарки

// ============================================================
//  ТЕМА
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
//  ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
// ============================================================
function showScreen(name) {
  // name: 'Phone' | 'Otp' | 'Name'
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen' + name);
  if (el) el.classList.add('active');
}

function goBack(screen) {
  showScreen(screen === 'phone' ? 'Phone' : screen);
}

function toggleMode() {
  currentMode = currentMode === 'login' ? 'register' : 'login';
  document.getElementById('modeLink').textContent =
    currentMode === 'login'
      ? 'Нет аккаунта? Зарегистрироваться'
      : 'Уже есть аккаунт? Войти';
}

// ============================================================
//  СООБЩЕНИЯ
// ============================================================
function showError(msg) {
  const el = document.getElementById('errBox');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

function showSuccess(msg) {
  const el = document.getElementById('okBox');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
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
    return { success: false, error: 'Нет связи с сервером' };
  }
}

// ============================================================
//  ШАГ 1: ОТПРАВКА OTP
// ============================================================
async function sendOtp() {
  const country = document.getElementById('countrySelect').value;
  const num = document.getElementById('phoneInput').value.replace(/\D/g, '');

  if (!num || num.length < 5) {
    showError('Введите номер телефона');
    return;
  }

  otpPhone = country + num;

  const btn = document.getElementById('phoneBtn');
  btn.disabled = true;
  btn.textContent = 'Отправка...';

  const res = await apiPost('auth/otp', { phone: otpPhone });

  btn.disabled = false;
  btn.textContent = 'Продолжить';

  if (!res.success) {
    showError(res.error || 'Ошибка отправки кода');
    return;
  }

  // Пока бэк не подключил SMS — показываем код в интерфейсе и консоли
  otpCode = res.otp || '';
  document.getElementById('otpHint').textContent = 'Код отправлен на +' + otpPhone;

  if (otpCode) {
    showSuccess('Тестовый код: ' + otpCode);
    console.log(
      '%cOTP: ' + otpCode,
      'background:#1e3a8a;color:#fff;padding:8px 14px;border-radius:8px;font-size:18px;font-weight:bold;'
    );
  }

  showScreen('Otp');
  setTimeout(() => document.getElementById('o1').focus(), 100);
}

// ============================================================
//  ВВОД OTP
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
//  ШАГ 2: ПРОВЕРКА OTP
// ============================================================
async function verifyOtp() {
  const code = getOtpValue();

  if (code.length !== 5) {
    showError('Введите 5 цифр');
    return;
  }

  // Локальная проверка (пока бэк не сверяет код сам)
  if (otpCode && code !== otpCode) {
    showError('Неверный код');
    for (let i = 1; i <= 5; i++) document.getElementById('o' + i).value = '';
    document.getElementById('o1').focus();
    return;
  }

  if (currentMode === 'register') {
    showScreen('Name');
    setTimeout(() => document.getElementById('nameInput').focus(), 100);
    return;
  }

  // ЛОГИН
  const res = await apiPost('auth/login', { phone: otpPhone, otp: code });

  if (res.success) {
    localStorage.setItem('mindofi_token', res.token);
    localStorage.setItem('mindofi_user', JSON.stringify(res.user));
    localStorage.setItem('mindofi_phone', otpPhone);
    showSuccess('Вход выполнен!');

    setTimeout(() => {
      // TODO: переход в app.html когда он будет готов
      alert('Вход выполнен!\nПривет, ' + res.user.name);
    }, 500);
  } else {
    showError(res.error || 'Ошибка входа');
  }
}

// ============================================================
//  АВАТАР
// ============================================================
function onAvatarPick(input) {
  const file = input.files[0];
  if (!file) return;

  // Проверка размера — 2 МБ для аватарки
  if (file.size > 2 * 1024 * 1024) {
    showError('Аватар должен быть до 2 МБ');
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
//  ШАГ 3: РЕГИСТРАЦИЯ
// ============================================================
async function doRegister() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    showError('Введите имя');
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
    showSuccess('Аккаунт создан!');

    setTimeout(() => {
      // TODO: переход в app.html
      alert('Аккаунт создан!\nДобро пожаловать, ' + res.user.name);
    }, 500);
  } else {
    showError(res.error || 'Ошибка регистрации');
  }
}

// ============================================================
//  ENTER-НАВИГАЦИЯ
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
