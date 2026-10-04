const userLogin = sessionStorage.getItem('kd_user');
const userPass = sessionStorage.getItem('kd_pass');
const rooms = JSON.parse(sessionStorage.getItem('kd_rooms') || '{}');
if (!userLogin || !rooms.groups) window.location.href = 'index.html';

let currentGuild = rooms.groups[0];
let currentChannel = null;
let socket = null;
let localStream = null;

const guildsEl = document.getElementById('guilds');
const channelsListEl = document.getElementById('channelsList');
const guildNameEl = document.getElementById('guildName');
const mainHeaderText = document.getElementById('mainHeaderText');
const mainHeaderIcon = document.getElementById('mainHeaderIcon');
const participantsEl = document.getElementById('participants');
const meNameEl = document.getElementById('meName');
const meAvatarEl = document.getElementById('meAvatar');
const leaveBtn = document.getElementById('leaveBtn');

meNameEl.textContent = userLogin;
meAvatarEl.textContent = userLogin[0].toUpperCase();

rooms.groups.forEach((g, i) => {
  const el = document.createElement('div');
  el.className = 'guild-icon' + (i === 0 ? ' active' : '');
  el.textContent = g.name.replace(/[^A-Za-zА-Яа-я0-9]/g, '').slice(0, 2).toUpperCase();
  el.title = g.name;
  el.addEventListener('click', () => {
    document.querySelectorAll('.guild-icon').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    currentGuild = g;
    renderChannels();
  });
  guildsEl.appendChild(el);
});

function renderChannels() {
  guildNameEl.textContent = currentGuild.name;
  channelsListEl.innerHTML = '';

  const vc = document.createElement('div');
  vc.className = 'category';
  vc.textContent = 'Голосовые каналы';
  channelsListEl.appendChild(vc);
  currentGuild.voiceChannels.forEach(ch => channelsListEl.appendChild(makeChannelEl(ch, '🔊')));

  if (currentGuild.privateChannels && currentGuild.privateChannels.length) {
    const pc = document.createElement('div');
    pc.className = 'category';
    pc.textContent = 'Приватные каналы';
    channelsListEl.appendChild(pc);
    currentGuild.privateChannels.forEach(ch => channelsListEl.appendChild(makeChannelEl(ch, '🔒')));
  }
}

function makeChannelEl(ch, icon) {
  const el = document.createElement('div');
  el.className = 'channel';
  el.dataset.id = ch.id;
  el.innerHTML = '<span class="icon">' + icon + '</span><span>' + ch.name + '</span>';
  el.addEventListener('click', () => joinChannel(ch));
  return el;
}

async function joinChannel(channel) {
  if (currentChannel && currentChannel.id === channel.id) return;
  if (currentChannel) leaveChannel();

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (e) {
    alert('Нет доступа к микрофону: ' + e.message);
    return;
  }

  currentChannel = channel;
  document.querySelectorAll('.channel').forEach(x => x.classList.remove('active'));
  const activeEl = document.querySelector('.channel[data-id="' + channel.id + '"]');
  if (activeEl) activeEl.classList.add('active');

  mainHeaderText.textContent = channel.name;
  mainHeaderIcon.textContent = channel.id.indexOf('-p') !== -1 ? '🔒' : '🔊';

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = new WebSocket(CONFIG.SERVER_WS);
    socket.onmessage = handleServerMessage;
    await new Promise(r => socket.onopen = r);
    socket.send(JSON.stringify({ type: 'login', login: userLogin, password: userPass }));
    await new Promise(r => setTimeout(r, 200));
  }

  socket.send(JSON.stringify({ type: 'join', channelId: channel.id }));
  leaveBtn.style.display = 'inline-block';
}

function leaveChannel() {
  if (socket && socket.readyState === WebSocket.OPEN && currentChannel) {
    socket.send(JSON.stringify({ type: 'leave' }));
  }
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  currentChannel = null;
  document.querySelectorAll('.channel').forEach(x => x.classList.remove('active'));
  mainHeaderText.textContent = 'Выберите канал';
  mainHeaderIcon.textContent = '🔊';
  leaveBtn.style.display = 'none';
  participantsEl.innerHTML = '<div class="empty">Выберите голосовой канал слева, чтобы присоединиться</div>';
}

leaveBtn.addEventListener('click', leaveChannel);

function renderParticipants(list) {
  if (!list.length) {
    participantsEl.innerHTML = '<div class="empty">В канале пока никого</div>';
    return;
  }
  participantsEl.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.dataset.login = p.login;
    const you = p.login === userLogin ? ' (вы)' : '';
    card.innerHTML = '<div class="user-avatar">' + p.login[0].toUpperCase() + '</div><span>' + p.login + you + '</span>';
    participantsEl.appendChild(card);
  });
}

function handleServerMessage(event) {
  const msg = JSON.parse(event.data);
  if (msg.type === 'participants') renderParticipants(msg.list);
  if (msg.type === 'talking') {
    document.querySelectorAll('.user-card').forEach(c => {
      if (c.dataset.login === msg.login) c.classList.toggle('talking', msg.speaking);
    });
  }
  if (msg.type === 'error') {
    alert(msg.reason || 'Ошибка');
    leaveChannel();
  }
}

renderChannels();