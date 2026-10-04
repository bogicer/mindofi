// ============================================================
//  MINDOFI — Основная логика приложения
// ============================================================

// ===== СОСТОЯНИЕ =====
let currentUser = null;
let currentToken = null;
let activeChat = null;
let users = {};
let messages = {};
let currentTab = 'all';
let searchFilter = '';
let pollingTimer = null;
let newAvatarBase64 = null;

// ===== ЗВОНКИ =====
let pc = null;
let localStream = null;
let remoteStream = null;
let callType = 'audio';
let callRole = 'caller';
let callTarget = null;
let callId = null;
let callSec = 0;
let callTimerInterval = null;
let callPollInterval = null;
let incomingCallId = null;
let incomingCallData = null;
let muteOn = false;
let camOff = false;
let watchInterval = null;
let ringtoneCtx = null;

// STUN/TURN
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
  ]
};

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
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

  // Восстанавливаем свежие данные о пользователе
  await refreshMe();

  applyTheme();
  renderMe();
  await loadUsers();
  renderChatList();
  startPolling();
  startCallWatcher();

  window.addEventListener('beforeunload', () => {
    updatePresence(false);
  });

  // Авторасширение textarea
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

  // Закрытие модалок по клику вне
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.style.display = 'none';
    });
  });
}

async function refreshMe() {
  const u = await apiRequest('users/' + currentUser.phone);
  if (u && u.name) {
    currentUser = Object.assign({}, currentUser, u);
    localStorage.setItem('mindofi_user', JSON.stringify(currentUser));
  }
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
  const chats = await apiRequest('messages');
  if (!chats) return;

  const promises = [];
  for (const chatId in chats) {
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

  const chatItems = [];

  for (const phone in users) {
    const u = users[phone];
    if (!u) continue;

    const chatId = getChatId(phone);
    const msgs = messages[chatId] || [];
    const lastMsg = msgs[msgs.length - 1];

    chatItems.push({ phone, user: u, lastMsg, chatId });
  }

  chatItems.sort((a, b) => {
    const tA = a.lastMsg ? a.lastMsg.timestamp : 0;
    const tB = b.lastMsg ? b.lastMsg.timestamp : 0;
    return tB - tA;
  });

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
      ? '<div class="chat-item-avatar' + (item.user.online ? ' online' : '') + '"><img src="' + item.user.photoURL + '" alt=""></div>'
      : '<div class="chat-item-avatar' + (item.user.online ? ' online' : '') + '" style="background:var(--accent)">' +
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

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('chatArea').style.display = 'flex';

  const chatAvatar = document.getElementById('chatAvatar');
  if (u.photoURL) {
    chatAvatar.innerHTML = '<img src="' + u.photoURL + '" alt="">';
  } else {
    chatAvatar.textContent = (u.name || '?')[0].toUpperCase();
  }

  document.getElementById('chatName').textContent = u.name || phone;
  document.getElementById('chatStatus').textContent = u.online ? 'В сети' : 'Не в сети';

  renderChatList();
  await loadMessages(phone);

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

  if (!messages[chatId]) messages[chatId] = [];
  messages[chatId].push(msg);
  renderMessages(activeChat);

  input.value = '';
  input.style.height = 'auto';

  const res = await apiRequest('messages/' + chatId + '/' + msgId, 'PUT', msg);
  if (!res) toast('Не удалось отправить');
}

// ============================================================
//  ФАЙЛЫ
// ============================================================
async function onFilePick(input) {
  const file = input.files[0];
  if (!file || !activeChat) return;

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

function openNewChat() {
  openModal('newChatModal');
  setTimeout(() => document.getElementById('userSearchInput').focus(), 100);
}

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

  const username = query.replace(/^@/, '');
  const phone = await apiRequest('usernames/' + username);

  if (!phone) {
    // Ищем в локальном кэше
    const found = Object.entries(users).filter(([p, u]) =>
      (u.username || '').toLowerCase().includes(username.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(username.toLowerCase())
    );

    if (!found.length) {
      results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">Не найдено</div>';
      return;
    }

    results.innerHTML = '';
    found.forEach(([p, u]) => renderSearchResult(p, u, results));
    return;
  }

  if (phone === currentUser.phone) {
    results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">Это вы</div>';
    return;
  }

  const u = await apiRequest('users/' + phone);
  if (!u || !u.name) {
    results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">Не найдено</div>';
    return;
  }

  users[phone] = u;
  results.innerHTML = '';
  renderSearchResult(phone, u, results);
}

function renderSearchResult(phone, u, container) {
  const el = document.createElement('div');
  el.className = 'search-result';
  el.onclick = () => {
    closeModal('newChatModal');
    if (!users[phone]) users[phone] = u;
    openChat(phone);
  };

  const avatarHTML = u.photoURL
    ? '<div class="chat-item-avatar"><img src="' + u.photoURL + '"></div>'
    : '<div class="chat-item-avatar" style="background:var(--accent)">' + (u.name || '?')[0].toUpperCase() + '</div>';

  el.innerHTML = avatarHTML +
    '<div class="chat-item-body">' +
      '<div class="chat-item-name">' + escapeHtml(u.name) + '</div>' +
      '<div class="chat-item-preview">' + (u.username || '+' + phone) + '</div>' +
    '</div>';

  container.appendChild(el);
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
//  НАСТРОЙКИ ПРОФИЛЯ
// ============================================================
function openSettingsModal() {
  if (!currentUser) return;

  const av = document.getElementById('settingsAvatar');
  if (currentUser.photoURL) {
    av.innerHTML = '<img src="' + currentUser.photoURL + '"><div class="settings-avatar-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>';
  } else {
    av.innerHTML = '<span>' + (currentUser.name || '?')[0].toUpperCase() + '</span><div class="settings-avatar-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>';
  }
  newAvatarBase64 = null;

  document.getElementById('settingsName').value = currentUser.name || '';
  document.getElementById('settingsUsername').value = (currentUser.username || '').replace(/^@/, '');
  document.getElementById('settingsBio').value = currentUser.bio || '';
  document.getElementById('settingsBirthday').value = currentUser.birthday || '';
  document.getElementById('bioCounter').textContent = (currentUser.bio || '').length;

  document.getElementById('settingsCurrentPwd').value = '';
  document.getElementById('settingsNewPwd').value = '';
  document.getElementById('settingsRepeatPwd').value = '';

  const bioEl = document.getElementById('settingsBio');
  bioEl.oninput = () => {
    document.getElementById('bioCounter').textContent = bioEl.value.length;
  };

  openModal('settingsModal');
}

function onSettingsAvatarPick(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    toast('Аватар должен быть до 2 МБ');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    newAvatarBase64 = e.target.result.split(',')[1];
    const av = document.getElementById('settingsAvatar');
    av.innerHTML = '<img src="' + e.target.result + '"><div class="settings-avatar-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>';
  };
  reader.readAsDataURL(file);
  input.value = '';
}

async function saveProfile() {
  const name = document.getElementById('settingsName').value.trim();
  const username = document.getElementById('settingsUsername').value.trim().replace(/^@/, '').replace(/[^\w]/g, '');
  const bio = document.getElementById('settingsBio').value.trim();
  const birthday = document.getElementById('settingsBirthday').value;

  if (!name) {
    toast('Имя не может быть пустым');
    return;
  }

  if (birthday) {
    const bd = new Date(birthday);
    const now = new Date();
    const age = (now - bd) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 13) {
      toast('Возраст должен быть не менее 13 лет');
      return;
    }
    if (age > 120) {
      toast('Неверная дата рождения');
      return;
    }
  }

  let newPhotoUrl = currentUser.photoURL;
  if (newAvatarBase64) {
    const up = await apiRequest('upload', 'POST', {
      image: newAvatarBase64,
      type: 'image'
    });
    if (up && up.url) {
      newPhotoUrl = up.url;
    } else {
      toast('Не удалось загрузить аватар');
      return;
    }
  }

  const patch = {
    name: name,
    username: username ? '@' + username : null,
    bio: bio,
    birthday: birthday || null,
    photo_url: newPhotoUrl
  };

  const res = await apiRequest('users/' + currentUser.phone, 'PATCH', patch);
  if (!res) {
    toast('Ошибка сохранения');
    return;
  }

  currentUser.name = name;
  currentUser.username = username ? '@' + username : null;
  currentUser.bio = bio;
  currentUser.birthday = birthday || null;
  currentUser.photoURL = newPhotoUrl;
  localStorage.setItem('mindofi_user', JSON.stringify(currentUser));

  renderMe();
  toast('Профиль сохранён ✅');
  closeModal('settingsModal');
}

async function changePassword() {
  const cur = document.getElementById('settingsCurrentPwd').value;
  const nw = document.getElementById('settingsNewPwd').value;
  const rep = document.getElementById('settingsRepeatPwd').value;

  if (nw.length < 6) {
    toast('Новый пароль минимум 6 символов');
    return;
  }
  if (nw !== rep) {
    toast('Пароли не совпадают');
    return;
  }

  const res = await apiRequest('auth/set-password', 'POST', {
    current: cur,
    new: nw
  });

  if (!res || !res.success) {
    toast(res && res.error ? res.error : 'Ошибка');
    return;
  }

  document.getElementById('settingsCurrentPwd').value = '';
  document.getElementById('settingsNewPwd').value = '';
  document.getElementById('settingsRepeatPwd').value = '';
  toast('Пароль установлен ✅');
}

// ============================================================
//  POLLING
// ============================================================
function startPolling() {
  clearInterval(pollingTimer);
  pollingTimer = setInterval(async () => {
    updatePresence(true);
    await loadUsers();
    if (activeChat) {
      await loadMessages(activeChat);
    }
    renderChatList();
  }, 3000);

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
  if (currentUser) await updatePresence(false);
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

// ============================================================
//  ЗВОНКИ (WebRTC)
// ============================================================
async function initCall(type) {
  if (!activeChat) { toast('Выберите чат'); return; }
  if (pc) { toast('Уже идёт звонок'); return; }

  callType = type;
  callRole = 'caller';
  callTarget = activeChat;
  callId = [currentUser.phone, callTarget].sort().join('_') + '_call';

  try {
    const constraints = type === 'video'
      ? { audio: true, video: { facingMode: 'user', width: 640, height: 480 } }
      : { audio: true, video: false };
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (e) {
    toast('Нет доступа к ' + (type === 'video' ? 'камере' : 'микрофону'));
    return;
  }

  pc = new RTCPeerConnection(ICE_CONFIG);
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  const localVideo = document.getElementById('localVideo');
  if (type === 'video') {
    localVideo.srcObject = localStream;
    localVideo.style.display = 'block';
  } else {
    localVideo.style.display = 'none';
  }

  const remoteVideo = document.getElementById('remoteVideo');
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      remoteStream = event.streams[0];
      remoteVideo.srcObject = remoteStream;
      remoteVideo.play().catch(() => {});
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      apiRequest('ice/' + callId, 'POST', {
        candidate: JSON.stringify(event.candidate),
        type: 'caller'
      });
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await apiRequest('calls/' + callId, 'POST', {
    caller: currentUser.phone,
    callee: callTarget,
    callType: type,
    status: 'calling',
    offer: JSON.stringify(offer),
    ts: Date.now()
  });

  showCallScreen(type, 'caller', users[callTarget]);

  let tries = 0;
  callPollInterval = setInterval(async () => {
    tries++;
    if (tries > 40) {
      clearInterval(callPollInterval);
      toast('Нет ответа');
      hangUp();
      return;
    }

    const callData = await apiRequest('calls/' + callId);
    if (!callData) return;

    if (callData.status === 'declined') {
      clearInterval(callPollInterval);
      toast('Звонок отклонён');
      hangUp();
      return;
    }

    if (callData.answer && pc && pc.signalingState === 'have-local-offer') {
      clearInterval(callPollInterval);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callData.answer)));

        const cands = await apiRequest('ice/' + callId);
        if (cands) {
          for (const cid in cands) {
            try { await pc.addIceCandidate(new RTCIceCandidate(cands[cid])); } catch (e) {}
          }
        }

        startCallTimer();
        document.getElementById('callStatus').style.display = 'none';
        document.getElementById('callTimer').style.display = 'block';
      } catch (e) { console.error(e); }
    }
  }, 1000);
}

async function acceptCall() {
  document.getElementById('incomingCall').style.display = 'none';
  if (!incomingCallId || !incomingCallData) return;

  callId = incomingCallId;
  callType = incomingCallData.call_type || 'audio';
  callRole = 'callee';
  callTarget = incomingCallData.caller;

  try {
    const constraints = callType === 'video'
      ? { audio: true, video: { facingMode: 'user', width: 640, height: 480 } }
      : { audio: true, video: false };
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (e) {
    toast('Нет доступа к устройству');
    await apiRequest('calls/' + callId, 'PATCH', { status: 'declined' });
    resetCall();
    return;
  }

  pc = new RTCPeerConnection(ICE_CONFIG);
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

  const localVideo = document.getElementById('localVideo');
  if (callType === 'video') {
    localVideo.srcObject = localStream;
    localVideo.style.display = 'block';
  } else {
    localVideo.style.display = 'none';
  }

  const remoteVideo = document.getElementById('remoteVideo');
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      remoteStream = event.streams[0];
      remoteVideo.srcObject = remoteStream;
      remoteVideo.play().catch(() => {});
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      apiRequest('ice/' + callId, 'POST', {
        candidate: JSON.stringify(event.candidate),
        type: 'callee'
      });
    }
  };

  try {
    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(incomingCallData.offer)));

    const cands = await apiRequest('ice/' + callId);
    if (cands) {
      for (const cid in cands) {
        try { await pc.addIceCandidate(new RTCIceCandidate(cands[cid])); } catch (e) {}
      }
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await apiRequest('calls/' + callId, 'PATCH', {
      answer: JSON.stringify(answer),
      status: 'connected'
    });

    showCallScreen(callType, 'callee', users[callTarget]);
    startCallTimer();
    document.getElementById('callStatus').style.display = 'none';
    document.getElementById('callTimer').style.display = 'block';

    const icePoll = setInterval(async () => {
      if (!pc) { clearInterval(icePoll); return; }
      const c = await apiRequest('ice/' + callId);
      if (c) {
        for (const cid in c) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c[cid])); } catch (e) {}
        }
      }
    }, 1500);

  } catch (e) {
    console.error(e);
    toast('Ошибка соединения');
    hangUp();
  }

  incomingCallId = null;
  incomingCallData = null;
}

async function declineCall() {
  document.getElementById('incomingCall').style.display = 'none';
  if (incomingCallId) {
    await apiRequest('calls/' + incomingCallId, 'PATCH', { status: 'declined' });
  }
  incomingCallId = null;
  incomingCallData = null;
}

async function hangUp() {
  clearInterval(callTimerInterval);
  clearInterval(callPollInterval);
  callTimerInterval = null;
  callPollInterval = null;

  if (pc) { try { pc.close(); } catch (e) {} pc = null; }
  if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }

  const rv = document.getElementById('remoteVideo');
  const lv = document.getElementById('localVideo');
  if (rv) rv.srcObject = null;
  if (lv) { lv.srcObject = null; lv.style.display = 'none'; }

  if (callId) await apiRequest('calls/' + callId, 'DELETE');

  document.getElementById('callScreen').style.display = 'none';
  document.getElementById('incomingCall').style.display = 'none';

  resetCall();
}

function resetCall() {
  pc = null;
  localStream = null;
  remoteStream = null;
  callId = null;
  callTarget = null;
  callSec = 0;
  muteOn = false;
  camOff = false;
  const mb = document.getElementById('muteBtn');
  const cb = document.getElementById('camBtn');
  if (mb) mb.classList.remove('muted');
  if (cb) cb.classList.remove('muted');
}

function showCallScreen(type, role, user) {
  document.getElementById('callScreen').style.display = 'flex';

  const callAvatar = document.getElementById('callAvatar');
  const callName = document.getElementById('callName');
  const callStatus = document.getElementById('callStatus');
  const callTimer = document.getElementById('callTimer');

  if (user && user.photoURL) {
    callAvatar.innerHTML = '<img src="' + user.photoURL + '">';
  } else {
    callAvatar.textContent = (user && user.name ? user.name : '?')[0].toUpperCase();
  }

  callName.textContent = user ? user.name : callTarget;
  callStatus.textContent = role === 'caller' ? 'Вызов...' : 'Соединение...';
  callStatus.style.display = 'block';
  callTimer.style.display = 'none';
  callTimer.textContent = '00:00';
}

function startCallTimer() {
  callSec = 0;
  clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    callSec++;
    const m = String(Math.floor(callSec / 60)).padStart(2, '0');
    const s = String(callSec % 60).padStart(2, '0');
    document.getElementById('callTimer').textContent = m + ':' + s;
  }, 1000);
}

function toggleMute() {
  muteOn = !muteOn;
  if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = !muteOn);
  document.getElementById('muteBtn').classList.toggle('muted', muteOn);
}

function toggleCam() {
  camOff = !camOff;
  if (localStream) localStream.getVideoTracks().forEach(t => t.enabled = !camOff);
  document.getElementById('camBtn').classList.toggle('muted', camOff);
}

function startCallWatcher() {
  clearInterval(watchInterval);
  watchInterval = setInterval(async () => {
    if (pc || !currentUser) return;
    if (document.getElementById('incomingCall').style.display === 'flex') return;

    const calls = await apiRequest('calls');
    if (!calls) return;

    for (const id in calls) {
      const c = calls[id];
      if (!c || c.callee !== currentUser.phone) continue;
      if (c.status !== 'calling') continue;
      if (Date.now() - Number(c.ts) > 60000) continue;

      incomingCallId = id;
      incomingCallData = c;
      showIncoming(c);
      break;
    }
  }, 2000);
}

function showIncoming(callData) {
  const caller = users[callData.caller];
  const avatar = document.getElementById('incomingAvatar');
  const name = document.getElementById('incomingName');
  const type = document.getElementById('incomingType');

  if (caller && caller.photoURL) {
    avatar.innerHTML = '<img src="' + caller.photoURL + '">';
  } else {
    avatar.textContent = (caller && caller.name ? caller.name : '?')[0].toUpperCase();
  }

  name.textContent = caller ? caller.name : callData.caller;
  type.textContent = callData.call_type === 'video' ? '📹 Видеозвонок' : '📞 Аудиозвонок';

  document.getElementById('incomingCall').style.display = 'flex';
  try { playRingtone(); } catch (e) {}
}

function playRingtone() {
  if (!ringtoneCtx) ringtoneCtx = new (window.AudioContext || window.webkitAudioContext)();
  const ctx = ringtoneCtx;
  let count = 0;

  const playBeep = () => {
    if (count >= 6) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.start();
    setTimeout(() => osc.stop(), 300);
    count++;
    setTimeout(playBeep, 700);
  };
  playBeep();
}