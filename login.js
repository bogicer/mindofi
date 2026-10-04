const loginInput = document.getElementById('login');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorEl = document.getElementById('error');

let socket = null;

function connectAndLogin() {
  const login = loginInput.value.trim();
  const password = passwordInput.value;

  if (!login || !password) {
    errorEl.textContent = 'Заполните оба поля';
    return;
  }

  errorEl.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Подключение...';

  socket = new WebSocket(CONFIG.SERVER_WS);

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'login', login, password }));
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === 'login-ok') {
      sessionStorage.setItem('kd_user', msg.login);
      sessionStorage.setItem('kd_pass', password);
      sessionStorage.setItem('kd_rooms', JSON.stringify(msg.rooms));
      window.location.href = 'app.html';
    }

    if (msg.type === 'login-error') {
      errorEl.textContent = msg.reason || 'Неверный логин или пароль';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Войти';
      socket.close();
    }
  };

  socket.onerror = () => {
    errorEl.textContent = 'Не удалось подключиться к серверу';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Войти';
  };

  socket.onclose = () => {
    if (loginBtn.disabled) {
      errorEl.textContent = 'Соединение закрыто';
      loginBtn.disabled = false;
      loginBtn.textContent = 'Войти';
    }
  };
}

loginBtn.addEventListener('click', connectAndLogin);
passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') connectAndLogin(); });
loginInput.addEventListener('keydown', e => { if (e.key === 'Enter') passwordInput.focus(); });