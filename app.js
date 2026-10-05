// ============================================================
//  MINDOFI — Main app logic
// ============================================================

// ============================================================
//  MOBILE HEIGHT FIX
// ============================================================
function updateAppHeight() {
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-height', vh + 'px');
}
updateAppHeight();

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateAppHeight);
  window.visualViewport.addEventListener('scroll', updateAppHeight);
}
window.addEventListener('resize', updateAppHeight);
window.addEventListener('orientationchange', () => setTimeout(updateAppHeight, 300));

document.addEventListener('focusin', (e) => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
    setTimeout(updateAppHeight, 300);
  }
});
document.addEventListener('focusout', () => setTimeout(updateAppHeight, 300));

// ============================================================
//  STATE
// ============================================================
let currentUser = null;
let currentToken = null;
let activeChat = null;
let users = {};
let messages = {};
let currentTab = 'all';
let searchFilter = '';
let pollingTimer = null;
let newAvatarBase64 = null;

// Calls
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

// Voice
let vrec = null;
let vchunks = [];
let vsec = 0;
let vtimer = null;
let visRecording = false;

const playingAudios = new Map();

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
//  INIT
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

  await refreshMe();
  applyTheme();
  renderMe();

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }

  await loadUsers();
  renderChatList();
  startPolling();
  startCallWatcher();

  updateAppHeight();
  bindVoiceButton();
  bindTextarea();

  window.addEventListener('beforeunload', () => {
    updatePresence(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('show');
    }
    updateAppHeight();
  });

  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.style.display = 'none';
    });
  });

  // Re-apply translations after init
  if (typeof applyTranslations === 'function') applyTranslations();
}

function bindTextarea() {
  const ta = document.getElementById('messageInput');
  if (!ta) { setTimeout(bindTextarea, 500); return; }
  if (ta.dataset.bound === '1') return;
  ta.dataset.bound = '1';

  ta.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    updateAppHeight();
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
//  THEME
// ============================================================
let dark = localStorage.getItem('mindofi_dark') === '1';

function applyTheme() {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const el = document.getElementById('themeValue');
  if (el) el.textContent = dark ? t('theme_on') : t('theme_off');
}

function toggleTheme() {
  dark = !dark;
  localStorage.setItem('mindofi_dark', dark ? '1' : '0');
  applyTheme();
}

// ============================================================
//  MY PROFILE
// ============================================================
function renderMe() {
  if (!currentUser) return;

  const meName = document.getElementById('meName');
  const meAvatar = document.getElementById('meAvatar');
  const meStatus = document.getElementById('meStatus');
  const mobileAvatar = document.getElementById('mobileProfileAvatar');

  meName.textContent = currentUser.name || '—';
  meStatus.textContent = t('status_online');

  if (currentUser.photoURL) {
    meAvatar.innerHTML = '<img src="' + currentUser.photoURL + '" alt="">';
    if (mobileAvatar) mobileAvatar.innerHTML = '<img src="' + currentUser.photoURL + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
  } else {
    const letter = (currentUser.name || '?')[0].toUpperCase();
    meAvatar.textContent = letter;
    if (mobileAvatar) mobileAvatar.textContent = letter;
  }
}

// ============================================================
//  USERS
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
//  CHAT LIST
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
      (chatItems.length === 0 ? t('no_chats') : t('nothing_found')) +
      '</div>';
    return;
  }

  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'chat-item' + (item.phone === activeChat ? ' active' : '');
    el.onclick = () => openChat(item.phone);

    const avatarHTML = item.user.photoURL
      ? '<div class="chat-item-avatar' + (item.user.online ? ' online' : '') + '"><img src="' + item.user.photoURL + '" alt=""></div>'
      : '<div class="chat-item-avatar' + (item.user.online ? ' online' : '') + '">' +
        (item.user.name || '?')[0].toUpperCase() + '</div>';

    let preview = t('no_messages_yet');
    if (item.lastMsg) {
      const typeLabels = {
        voice: t('preview_voice'),
        krujok: t('preview_krujok'),
        image: t('preview_image'),
        file: t('preview_file')
      };
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
//  OPEN CHAT
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
  document.getElementById('chatStatus').textContent = u.online ? t('status_online') : t('status_offline');

  renderChatList();
  await loadMessages(phone);

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }

  updateAppHeight();
}

// ============================================================
//  MESSAGES
// ============================================================
function getChatId(phone) {
  return [currentUser.phone, phone].sort().join('_');
}

async function loadMessages(phone) {
  const chatId = getChatId(phone);
  const data = await apiRequest('messages/' + chatId);

  let newMsgs = [];
  if (data) {
    newMsgs = Object.values(data).sort((a, b) =>
      (a.timestamp || 0) - (b.timestamp || 0)
    );
  }

  const oldJson = JSON.stringify(messages[chatId] || []);
  const newJson = JSON.stringify(newMsgs);
  messages[chatId] = newMsgs;

  if (oldJson !== newJson) {
    renderMessages(phone);
  }
}

function renderMessages(phone) {
  const container = document.getElementById('messages');

  // Save playing audio state
  playingAudios.clear();
  container.querySelectorAll('audio').forEach(a => {
    if (!a.paused && a.currentTime > 0) {
      playingAudios.set(a.id, a.currentTime);
    }
  });

  container.innerHTML = '';

  const chatId = getChatId(phone);
  const msgs = messages[chatId] || [];

  if (!msgs.length) {
    container.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:14px">' + t('no_messages_start') + '</div>';
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
      const voiceId = 'voice_' + m.id;
      let bars = '';
      for (let i = 0; i < 24; i++) {
        bars += '<div class="voice-bar" style="height:' + (3 + Math.abs(Math.sin(i * 0.7)) * 17) + 'px"></div>';
      }
      content = '<div class="voice-msg">' +
        '<button class="voice-play" onclick="toggleVoice(\'' + voiceId + '\', this)">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '</button>' +
        '<div class="voice-wave" id="' + voiceId + '_wave">' + bars + '</div>' +
        '<audio id="' + voiceId + '" src="' + m.url + '" preload="metadata"></audio>' +
        '<span class="voice-dur">' + (m.dur || '0:00') + '</span>' +
      '</div>';
    } else if (m.type === 'krujok' && m.url) {
      content = '<video controls src="' + m.url + '" style="max-width:220px;border-radius:12px"></video>';
    } else if (m.type === 'file' && m.url) {
      content = '<a href="' + m.url + '" download style="color:inherit;text-decoration:underline">📎 ' +
        escapeHtml(m.file_name || 'File') + ' (' + (m.file_size || '?') + ')</a>';
    } else {
      content = escapeHtml(m.text || '');
    }

    el.innerHTML = '<div class="message-bubble">' +
      content +
      '<div class="message-time">' + formatTime(m.timestamp) + '</div>' +
    '</div>';

    container.appendChild(el);
  });

  container.scrollTop = container.scrollHeight;

  // Restore playing audio
  playingAudios.forEach((currentTime, id) => {
    const a = document.getElementById(id);
    if (a) {
      try {
        a.currentTime = currentTime;
        a.play().catch(() => {});
        const btn = a.parentElement?.querySelector('.voice-play');
        if (btn) {
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        }
      } catch (e) {}
    }
  });
}

// ============================================================
//  SEND
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
  if (!res) toast(t('toast_send_error'));
}

// ============================================================
//  FILES
// ============================================================
async function onFilePick(input) {
  const file = input.files[0];
  if (!file || !activeChat) return;

  if (file.size > CONFIG.MAX_FILE_SIZE) {
    toast(t('toast_file_too_large'));
    input.value = '';
    return;
  }

  toast(t('toast_uploading'));
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    const isImage = file.type.startsWith('image/');
    const res = await apiRequest('upload', 'POST', {
      image: base64,
      type: isImage ? 'image' : 'file'
    });

    if (!res || !res.url) { toast(t('toast_upload_error')); return; }

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
//  VOICE MESSAGES
// ============================================================
function bindVoiceButton() {
  const vbtn = document.getElementById('voiceBtn');
  if (!vbtn) {
    setTimeout(bindVoiceButton, 500);
    return;
  }
  if (vbtn.dataset.bound === '1') return;
  vbtn.dataset.bound = '1';

  vbtn.addEventListener('contextmenu', e => e.preventDefault());

  vbtn.addEventListener('mousedown', startVoiceRecord);
  vbtn.addEventListener('mouseup', () => stopVoiceRecord(false));
  vbtn.addEventListener('mouseleave', () => { if (visRecording) stopVoiceRecord(true); });

  vbtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startVoiceRecord(e);
  }, { passive: false });

  vbtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopVoiceRecord(false);
  }, { passive: false });

  vbtn.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    stopVoiceRecord(true);
  }, { passive: false });
}

async function startVoiceRecord(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!activeChat) { toast(t('toast_select_chat')); return; }
  if (visRecording) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1
      }
    });
    vchunks = [];
    vsec = 0;
    visRecording = true;

    let mime = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mime = 'audio/webm;codecs=opus';
    else if (MediaRecorder.isTypeSupported('audio/mp4')) mime = 'audio/mp4';

    vrec = new MediaRecorder(stream, {
      mimeType: mime,
      audioBitsPerSecond: 128000
    });
    vrec.ondataavailable = (ev) => { if (ev.data.size > 0) vchunks.push(ev.data); };
    vrec.start(100);

    const bar = document.getElementById('recordingBar');
    const timer = document.getElementById('recordingTimer');
    if (bar) bar.style.display = 'flex';
    const btn = document.getElementById('voiceBtn');
    if (btn) btn.classList.add('recording');

    vtimer = setInterval(() => {
      vsec++;
      const m = Math.floor(vsec / 60);
      const s = String(vsec % 60).padStart(2, '0');
      if (timer) timer.textContent = m + ':' + s;
      if (vsec >= 300) stopVoiceRecord(false);
    }, 1000);

    if (navigator.vibrate) navigator.vibrate(50);
  } catch (err) {
    console.error('Record error:', err);
    toast(t('toast_no_mic'));
    visRecording = false;
  }
}

async function stopVoiceRecord(cancel) {
  if (!visRecording || !vrec) return;

  visRecording = false;
  clearInterval(vtimer);

  const bar = document.getElementById('recordingBar');
  if (bar) bar.style.display = 'none';
  const btn = document.getElementById('voiceBtn');
  if (btn) btn.classList.remove('recording');

  const rec = vrec;
  vrec = null;

  try { rec.stop(); } catch (e) {}
  if (rec.stream) rec.stream.getTracks().forEach(t => t.stop());

  if (cancel || vsec < 1) {
    vchunks = [];
    if (cancel) toast(t('toast_cancelled'));
    else toast(t('toast_too_short'));
    return;
  }

  await new Promise(r => setTimeout(r, 200));
  const blob = new Blob(vchunks, { type: rec.mimeType || 'audio/webm' });
  vchunks = [];

  const sizeMB = blob.size / 1024 / 1024;
  if (sizeMB > 50) { toast(t('toast_file_too_large')); return; }

  toast(t('toast_uploading'));

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    const up = await apiRequest('upload', 'POST', { image: base64, type: 'voice' });
    if (!up || !up.url) { toast(t('toast_upload_error')); return; }

    const chatId = getChatId(activeChat);
    const msgId = Date.now() + '_v';
    const dur = Math.floor(vsec / 60) + ':' + String(vsec % 60).padStart(2, '0');

    const msg = {
      id: msgId,
      chat_id: chatId,
      from: currentUser.phone,
      timestamp: Date.now(),
      type: 'voice',
      url: up.url,
      dur: dur,
      text: ''
    };

    if (!messages[chatId]) messages[chatId] = [];
    messages[chatId].push(msg);
    renderMessages(activeChat);

    await apiRequest('messages/' + chatId + '/' + msgId, 'PUT', msg);
    vsec = 0;
    toast(t('toast_sent'));
  };
  reader.readAsDataURL(blob);
}

// ============================================================
//  VOICE PLAYER
// ============================================================
function toggleVoice(id, btn) {
  const audio = document.getElementById(id);
  const wave = document.getElementById(id + '_wave');
  if (!audio) return;

  document.querySelectorAll('audio').forEach(a => {
    if (a.id !== id && !a.paused) {
      a.pause();
      a.currentTime = 0;
    }
  });

  if (audio.paused) {
    audio.play();
    playingAudios.set(id, audio.currentTime);
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

    audio.ontimeupdate = () => {
      if (!audio.duration) return;
      playingAudios.set(id, audio.currentTime);
      const progress = audio.currentTime / audio.duration;
      const bars = wave.querySelectorAll('.voice-bar');
      bars.forEach((b, i) => {
        const barProgress = i / bars.length;
        b.style.opacity = barProgress <= progress ? '1' : '0.3';
        b.style.background = barProgress <= progress ? 'var(--accent)' : 'var(--text-3)';
      });
    };

    audio.onended = () => {
      playingAudios.delete(id);
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
      const bars = wave.querySelectorAll('.voice-bar');
      bars.forEach(b => { b.style.opacity = '0.3'; b.style.background = 'var(--text-3)'; });
    };
  } else {
    audio.pause();
    playingAudios.delete(id);
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  }
}

// ============================================================
//  MODALS
// ============================================================
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ============================================================
//  SIDEBAR
// ============================================================
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  const isOpen = sb.classList.toggle('open');
  ov.classList.toggle('show', isOpen);
}

// ============================================================
//  SEARCH
// ============================================================
async function searchUsers(query) {
  const results = document.getElementById('userSearchResults');
  if (!results) return;
  if (!query || query.length < 2) { results.innerHTML = ''; return; }
  results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">' + t('loading') + '</div>';

  const username = query.replace(/^@/, '');
  const phone = await apiRequest('usernames/' + username);

  if (!phone) {
    const found = Object.entries(users).filter(([p, u]) =>
      (u.username || '').toLowerCase().includes(username.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(username.toLowerCase())
    );
    if (!found.length) {
      results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">' + t('nothing_found') + '</div>';
      return;
    }
    results.innerHTML = '';
    found.forEach(([p, u]) => renderSearchResult(p, u, results));
    return;
  }

  if (phone === currentUser.phone) {
    results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">' + t('toast_this_is_you') + '</div>';
    return;
  }

  const u = await apiRequest('users/' + phone);
  if (!u || !u.name) {
    results.innerHTML = '<div style="padding:12px;color:var(--text-3);font-size:13px">' + t('nothing_found') + '</div>';
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
    if (!users[phone]) users[phone] = u;
    openChat(phone);
  };

  const avatarHTML = u.photoURL
    ? '<div class="chat-item-avatar"><img src="' + u.photoURL + '"></div>'
    : '<div class="chat-item-avatar">' + (u.name || '?')[0].toUpperCase() + '</div>';

  el.innerHTML = avatarHTML +
    '<div class="chat-item-body">' +
      '<div class="chat-item-name">' + escapeHtml(u.name) + '</div>' +
      '<div class="chat-item-preview">' + (u.username || '+' + phone) + '</div>' +
    '</div>';

  container.appendChild(el);
}

// ============================================================
//  FILTERS
// ============================================================
function filterChats(value) { searchFilter = value; renderChatList(); }

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderChatList();
}

// ============================================================
//  PROFILE
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

  // Highlight current language
  document.querySelectorAll('.lang-picker button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === getLang());
  });

  openModal('settingsModal');
}

function onSettingsAvatarPick(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast(t('toast_avatar_too_large')); return; }

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

  if (!name) { toast(t('err_enter_name')); return; }

  if (birthday) {
    const bd = new Date(birthday);
    const now = new Date();
    const age = (now - bd) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 13) { toast(t('toast_age_error')); return; }
    if (age > 120) { toast(t('toast_date_error')); return; }
  }

  let newPhotoUrl = currentUser.photoURL;
  if (newAvatarBase64) {
    const up = await apiRequest('upload', 'POST', {
      image: newAvatarBase64,
      type: 'image'
    });
    if (up && up.url) newPhotoUrl = up.url;
    else { toast(t('toast_upload_error')); return; }
  }

  const patch = {
    name: name,
    username: username ? '@' + username : null,
    bio: bio,
    birthday: birthday || null,
    photo_url: newPhotoUrl
  };

  const res = await apiRequest('users/' + currentUser.phone, 'PATCH', patch);
  if (!res) { toast(t('error')); return; }

  currentUser.name = name;
  currentUser.username = username ? '@' + username : null;
  currentUser.bio = bio;
  currentUser.birthday = birthday || null;
  currentUser.photoURL = newPhotoUrl;
  localStorage.setItem('mindofi_user', JSON.stringify(currentUser));

  renderMe();
  toast(t('toast_profile_saved'));
  closeModal('settingsModal');
}

async function changePassword() {
  const cur = document.getElementById('settingsCurrentPwd').value;
  const nw = document.getElementById('settingsNewPwd').value;
  const rep = document.getElementById('settingsRepeatPwd').value;

  if (nw.length < 6) { toast(t('toast_pwd_short')); return; }
  if (nw !== rep) { toast(t('toast_wrong_pwd')); return; }

  const res = await apiRequest('auth/set-password', 'POST', { current: cur, new: nw });
  if (!res || !res.success) { toast(res && res.error ? res.error : t('error')); return; }

  document.getElementById('settingsCurrentPwd').value = '';
  document.getElementById('settingsNewPwd').value = '';
  document.getElementById('settingsRepeatPwd').value = '';
  toast(t('toast_password_set'));
}

// ============================================================
//  POLLING
// ============================================================
function startPolling() {
  clearInterval(pollingTimer);
  pollingTimer = setInterval(async () => {
    if (document.hidden) return;

    updatePresence(true);
    await loadUsers();
    if (activeChat) await loadMessages(activeChat);
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
//  LOGOUT
// ============================================================
async function logout() {
  if (currentUser) await updatePresence(false);
  localStorage.removeItem('mindofi_token');
  localStorage.removeItem('mindofi_user');
  localStorage.removeItem('mindofi_phone');
  window.location.href = 'index.html';
}

// ============================================================
//  UTILS
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
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function toast(msg) {
  const tEl = document.getElementById('toast');
  tEl.textContent = msg;
  tEl.classList.add('show');
  setTimeout(() => tEl.classList.remove('show'), 3000);
}

function openImage(url) { window.open(url, '_blank'); }

function openProfile() {
  if (!activeChat) return;
  const u = users[activeChat];
  if (!u) return;
  toast(u.name + (u.username ? ' · ' + u.username : '') + (u.phone ? ' · +' + u.phone : ''));
}

// ============================================================
//  CALLS
// ============================================================
async function initCall(type) {
  if (!activeChat) { toast(t('toast_select_chat')); return; }
  if (pc) { toast(t('call_calling')); return; }

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
    toast(t('toast_no_mic'));
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
      toast(t('call_no_answer'));
      hangUp();
      return;
    }
    const callData = await apiRequest('calls/' + callId);
    if (!callData) return;
    if (callData.status === 'declined') {
      clearInterval(callPollInterval);
      toast(t('call_declined'));
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
    toast(t('toast_no_mic'));
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
    toast(t('error'));
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
  callStatus.textContent = role === 'caller' ? t('call_calling') : t('call_connecting');
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
  type.textContent = callData.call_type === 'video' ? '📹 ' + t('call_video') : '📞 ' + t('call_voice');

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

// ============================================================
//  BIND VOICE BUTTON (independent from init)
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindVoiceButton);
} else {
  bindVoiceButton();
}
setTimeout(bindVoiceButton, 1000);
setTimeout(bindVoiceButton, 3000);

console.log('app.js loaded ✅');