// ============================================================
//  MINDOFI — Основная логика приложения
//  Часть 1: инициализация, пользователи, чаты, сообщения
// ============================================================

// ===== СОСТОЯНИЕ =====
let currentUser = null;
let currentToken = null;
let activeChat = null;       // текущий открытый чат (phone или group_id)
let users = {};              // кэш пользователей
let messages = {};           // кэш сообщений по chatId
let currentTab = 'all';
let searchFilter = '';
let socket = null;           // WebSocket (опционально, для real-time)
let pollingTimer = null;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Проверяем авторизацию
  currentToken = localStorage.getItem('mindofi_token');
  const userJson = localStorage.getItem('mindofi_user');

  if (!currentToken || !userJson) {
    window.location.href = 'index.html';
    return;
  }

  try {
    currentUser = JSON.parse(userJson);
  } catch (e) {
    window.location.href = 'index.html';
    return;
  }

  // Тема
  applyTheme();

  // Показываем мой профиль
  renderMe();

  // Загружаем данные
  await loadUsers();
  renderChatList();

  // Запускаем polling (каждые 3 секунды)
  startPolling();

  // Обновление статуса при закрытии
  window.addEventListener('beforeunload', () => {
    updatePresence(false);
  });

  // Проверка входящих звонков
  startCallWatcher();
}

// ============================================================
//  API
// ============================================================
async function apiRequest(path, method = 'GET', data = null) {
  const url = CONFIG.API_URL + '/' + path;
  const headers = {
    'X-Api-Key': CONFIG.API_KEY,
    'X-Session-Token': currentToken,
    'ngrok-skip-browser-warning': 'true'
  };

  const opts = { method, headers };

  if (data) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const err = await res.json().catch(() => ({}));
        if (err.error && err.error.includes('заблокирован')) {
          toast('⛔ ' + err.error + ': ' + (err.reason || ''));
          setTimeout(() => logout(), 3000);
        }
        return null;
      }
    }
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}

// ============================================================
//  ТЕМА
// ============================================================
let dark = localStorage.getItem('mindofi_dark') === '1';

function applyTheme() {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const el = document.getElementById('themeValue');
  if (el) el.textContent = dark ? 'Вкл.' : 'Выкл.';
}

function toggleTheme() {
  dark = !dark;
  localStorage.setItem('mindofi_dark', dark ? '1' : '0');
  applyTheme();
}

// ============================================================
//  МОЙ ПРОФИЛЬ
// ============================================================
function renderMe() {
  const meName = document.getElementById('meName');
  const meAvatar = document.getElementById('meAvatar');
  const meStatus = document.getElementById('meStatus');

  if (!currentUser) return;

  meName.textContent = currentUser.name || 'Без имени';
  meStatus.textContent = 'В сети';

  if (currentUser.photoURL) {
    meAvatar.innerHTML = '<img src="' + currentUser.photoURL + '" alt="">';
  } else {
    meAvatar.textContent = (currentUser.name || '?')[0].toUpperCase();
  }
}

// ============================================================
//  ПОЛЬЗОВАТЕЛИ
// ============================================================
async function loadUsers() {
  // Загружаем список чатов (по сообщениям)
  const chats = await apiRequest('messages');
  if (!chats) return;

  // Для каждого chatId вытаскиваем собеседника
  const promises = [];
  for (const chatId in chats) {
    // chatId формата: phone1_phone2 (отсортированные)
    const parts = chatId.split('_');
    if (parts.length !== 2) continue;

    const otherPhone = parts[0] === currentUser.phone ? parts[1] : parts[0];
    if (otherPhone === currentUser.phone) continue;

    if (!users[otherPhone]) {
      promises.push(
        apiRequest('users/' + otherPhone).then(u => {
          if (u && u.name) users[otherPhone] = u;
        })
      );
    }
  }
  await Promise.all(promises);
}

// ============================================================
//  СПИСОК ЧАТОВ
// ============================================================
function renderChatList() {
  const list = document.getElementById('chatList');
  list.innerHTML = '';

  // Собираем все уникальные чаты
  const chatItems = [];

  for (const phone in users) {
    const u = users[phone];
    if (!u) continue;

    const chatId = getChatId(phone);
    const msgs = messages[chatId] || [];
    const lastMsg = msgs[msgs.length - 1];

    chatItems.push({
      phone,
      user: u,
      lastMsg,
      chatId
    });
  }

  // Сортировка: сначала те, где есть последнее сообщение
  chatItems.sort((a, b) => {
    const tA = a.lastMsg ? a.lastMsg.timestamp : 0;
    const tB = b.lastMsg ? b.lastMsg.timestamp : 0;
    return tB - tA;
  });

  // Фильтр
  let filtered = chatItems;
  if (searchFilter) {
    const q = searchFilter.toLowerCase();
    filtered = chatItems.filter(item =>
      (item.user.name || '').toLowerCase().includes(q) ||
      (item.user.username || '').toLowerCase().includes(q)
    );
  }

  if (currentTab === 'groups') filtered = [];
  if (currentTab === 'channels') filtered = [];

  if (!filtered.length) {
    list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-3);font-size:13px">' +
      (chatItems.length === 0 ? 'Чатов пока нет. Нажмите + чтобы начать.' : 'Ничего не найдено') +
      '</div>';
    return;
  }

  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'chat-item' + (item.phone === activeChat ? ' active' : '');
    el.onclick = () => openChat(item.phone);

    const avatarHTML = item.user.photoURL
      ? '<div class="chat-item-avatar"><img src="' + item.user.photoURL + '" alt=""></div>'
      : '<div class="chat-item-avatar" style="background:var(--accent)">' +
        (item.user.name || '?')[0].toUpperCase() + '</div>';

    let preview = 'Нет сообщений';
    if (item.lastMsg) {
      const typeLabels = { voice: '🎤 Голосовое', krujok: '📹 Кружок', image: '📷 Фото', file: '📎 Файл' };
      preview = typeLabels[item.lastMsg.type] || item.lastMsg.text || '...';
    }

    const time = item.lastMsg ? formatTime(item.lastMsg.timestamp) : '';

    el.innerHTML = avatarHTML +
      '<div class="chat-item-body">' +
        '<div class="chat-item-name">' + escapeHtml(item.user.name || item.phone) + '</div>' +
        '<div class="chat-item-preview">' + escapeHtml(preview) + '</div>' +
      '</div>' +
      '<div class="chat-item-time">' + time + '</div>';

    list.appendChild(el);
  });
}

// ============================================================
//  ОТКРЫТИЕ ЧАТА
// ============================================================
async function openChat(phone) {
  activeChat = phone;
  const u = users[phone];
  if (!u) return;

  // Скрываем пустое состояние
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('chatArea').style.display = 'flex';

  // Заполняем шапку
  const chatAvatar = document.getElementById('chatAvatar');
  if (u.photoURL) {
    chatAvatar.innerHTML = '<img src="' + u.photoURL + '" alt="">';
  } else {
    chatAvatar.textContent = (u.name || '?')[0].toUpperCase();
  }

  document.getElementById('chatName').textContent = u.name || phone;
  document.getElementById('chatStatus').textContent = u.online ? 'В сети' : 'Не в сети';

  // Перерисовываем список (активный чат)
  renderChatList();

  // Загружаем сообщения
  await loadMessages(phone);

  // Мобильная версия — закрываем сайдбар
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// ============================================================
//  СООБЩЕНИЯ
// ============================================================
function getChatId(phone) {
  return [currentUser.phone, phone].sort().join('_');
}

async function loadMessages(phone) {
  const chatId = getChatId(phone);
  const data = await apiRequest('messages/' + chatId);

  if (!data) {
    messages[chatId] = [];
  } else {
    messages[chatId] = Object.values(data).sort((a, b) =>
      (a.timestamp || 0) - (b.timestamp || 0)
    );
  }

  renderMessages(phone);
}

function renderMessages(phone) {
  const container = document.getElementById('messages');
  container.innerHTML = '';

  const chatId = getChatId(phone);
  const msgs = messages[chatId] || [];

  if (!msgs.length) {
    container.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:14px">Нет сообщений. Начните общение!</div>';
    return;
  }

  msgs.forEach(m => {
    const isOut = m.from === currentUser.phone || m.from_user === currentUser.phone;
    const el = document.createElement('div');
    el.className = 'message ' + (isOut ? 'out' : 'in');

    let content = '';

    if (m.type === 'image' && m.url) {
      content = '<div class="message-image" onclick="openImage(\'' + m.url + '\')"><img src="' + m.url + '" loading="lazy"></div>';
    } else if (m.type === 'voice' && m.url) {
      content = '<audio controls src="' + m.url + '" style="max-width:220px"></audio>';
    } else if (m.type === 'krujok' && m.url) {
      content = '<video controls src="' + m.url + '" style="max-width:220px;border-radius:12px"></video>';
    } else if (m.type === 'file' && m.url) {
      content = '<a href="' + m.url + '" download style="color:inherit;text-decoration:underline">📎 ' +
        escapeHtml(m.file_name || 'Файл') + ' (' + (m.file_size || '?') + ')</a>';
    } else {
      content = escapeHtml(m.text || '');
    }

    const time = formatTime(m.timestamp);

    el.innerHTML = '<div class="message-bubble">' +
      content +
      '<div class="message-time">' + time + '</div>' +
    '</div>';

    container.appendChild(el);
  });

  // Скролл вниз
  container.scrollTop = container.scrollHeight;
}

// ============================================================
//  ОТПРАВКА СООБЩЕНИЯ
// ============================================================
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !activeChat) return;

  const chatId = getChatId(activeChat);
  const msgId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  const msg = {
    id: msgId,
    chat_id: chatId,
    from: currentUser.phone,
    text: text,
    timestamp: Date.now(),
    type: 'text'
  };

  // Оптимистично добавляем в UI
  if (!messages[chatId]) messages[chatId] = [];
  messages[chatId].push(msg);
  renderMessages(activeChat);

  input.value = '';
  input.style.height = 'auto';

  // Отправляем на сервер
  const res = await apiRequest('messages/' + chatId + '/' + msgId, 'PUT', msg);
  if (!res) {
    toast('Не удалось отправить');
  }
}

// ============================================================
//  ФАЙЛЫ
// ============================================================
async function onFilePick(input) {
  const file = input.files[0];
  if (!file || !activeChat) return;

  // Лимит 50 МБ
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    toast('Файл слишком большой (макс ' + Math.round(CONFIG.MAX_FILE_SIZE / 1024 / 1024) + ' МБ)');
    input.value = '';
    return;
  }

  toast('Загрузка...');

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    const isImage = file.type.startsWith('image/');

    const res = await apiRequest('upload', 'POST', {
      image: base64,
      type: isImage ? 'image' : 'file'
    });

    if (!res || !res.url) {
      toast('Ошибка загрузки');
      return;
    }

    const chatId = getChatId(activeChat);
    const msgId = Date.now() + '_f';
    const msg = {
      id: msgId,
      chat_id: chatId,
      from: currentUser.phone,
      timestamp: Date.now(),
      type: isImage ? 'image' : 'file',
      url: res.url,
      file_name: file.name,
      file_size: formatSize(file.size),
      text: ''
    };

    if (!messages[chatId]) messages[chatId] = [];
    messages[chatId].push(msg);
    renderMessages(activeChat);

    await apiRequest('messages/' + chatId + '/' + msgId, 'PUT', msg);
  };

  reader.readAsDataURL(file);
  input.value = '';
}

// ============================================================
//  МОДАЛКИ
// ============================================================
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Закрытие по клику вне
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', (e) => {
    if (e.target === m) m.style.display = 'none';
  });
});

// ============================================================
//  ПОИСК ПОЛЬЗОВАТЕЛЕЙ
// ============================================================
async function searchUsers(query) {
  const results = document.getElementById('userSearchResults');
  if (!query || query.length < 2) {
    results.innerHTML = '';
    return;
  }

  results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">Поиск...</div>';

  // Ищем по @username
  const username = query.replace(/^@/, '');
  const phone = await apiRequest('usernames/' + username);

  if (!phone) {
    results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">Не найдено</div>';
    return;
  }

  const u = await apiRequest('users/' + phone);
  if (!u || phone === currentUser.phone) {
    results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">Не найдено</div>';
    return;
  }

  users[phone] = u;

  const el = document.createElement('div');
  el.className = 'search-result';
  el.onclick = () => {
    closeModal('newChatModal');
    openChat(phone);
  };

  const avatarHTML = u.photoURL
    ? '<div class="chat-item-avatar"><img src="' + u.photoURL + '"></div>'
    : '<div class="chat-item-avatar" style="background:var(--accent)">' + (u.name || '?')[0].toUpperCase() + '</div>';

  el.innerHTML = avatarHTML +
    '<div class="chat-item-body">' +
      '<div class="chat-item-name">' + escapeHtml(u.name) + '</div>' +
      '<div class="chat-item-preview">' + (u.username || phone) + '</div>' +
    '</div>';

  results.innerHTML = '';
  results.appendChild(el);
}

// ============================================================
//  ФИЛЬТР И ВКЛАДКИ
// ============================================================
function filterChats(value) {
  searchFilter = value;
  renderChatList();
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderChatList();
}

// ============================================================
//  POLLING (обновление каждые 3 сек)
// ============================================================
function startPolling() {
  clearInterval(pollingTimer);
  pollingTimer = setInterval(async () => {
    // Обновляем presence
    updatePresence(true);

    // Обновляем список пользователей
    await loadUsers();

    // Обновляем сообщения активного чата
    if (activeChat) {
      await loadMessages(activeChat);
    }

    // Перерисовываем список
    renderChatList();
  }, 3000);

  // Первый вызов
  updatePresence(true);
}

async function updatePresence(online) {
  if (!currentUser) return;
  await apiRequest('users/' + currentUser.phone, 'PATCH', {
    online: online ? 1 : 0,
    lastSeen: Date.now()
  });
}

// ============================================================
//  ВЫХОД
// ============================================================
async function logout() {
  if (currentUser) {
    await updatePresence(false);
  }
  localStorage.removeItem('mindofi_token');
  localStorage.removeItem('mindofi_user');
  localStorage.removeItem('mindofi_phone');
  window.location.href = 'index.html';
}

// ============================================================
//  УТИЛИТЫ
// ============================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(Number(ts));
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function openImage(url) {
  window.open(url, '_blank');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function openProfile() {
  if (!activeChat) return;
  const u = users[activeChat];
  if (!u) return;
  toast(u.name + (u.username ? ' · ' + u.username : '') + (u.phone ? ' · +' + u.phone : ''));
}

// Авторасширение textarea
document.addEventListener('DOMContentLoaded', () => {
  const ta = document.getElementById('messageInput');
  if (ta) {
    ta.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});

// ============================================================
//  ЗВОНКИ (заглушки — часть 2)
// ============================================================
function initCall(type) { toast('Звонки в разработке (часть 2)'); }
function hangUp() {}
function toggleMute() {}
function toggleCam() {}
function acceptCall() {}
function declineCall() {}
function startCallWatcher() {}
