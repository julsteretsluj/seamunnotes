const API_URL = 'https://seamunnotes.onrender.com/api';
const WS_URL = 'wss://seamunnotes.onrender.com/ws';

const TOPICS = [
  'Bloc Forming',
  'POIs or POCs',
  'Unrelated Questions',
  'Informal Conversations'
];

const COMMITTEES = [
  { code: 'EP', name: 'European Parliament', flag: '🇪🇺', chairs: 3, delegates: 25 },
  { code: 'USS', name: 'United States Senate', flag: '🇺🇸', chairs: 3, delegates: 30 },
  { code: 'ECOSOC', name: 'Economic and Social Council', flag: '🇺🇳', chairs: 2, delegates: 25 },
  { code: 'HSC', name: 'Historical Security Council', flag: '🕰️', chairs: 4, delegates: 35 },
  { code: 'ICJ', name: 'International Court of Justice', flag: '⚖️', chairs: 3, delegates: 15 },
  { code: 'INTERPOL', name: 'International Criminal Police Organization', flag: '🛂', chairs: 3, delegates: 25 },
  { code: 'UNODC', name: 'UN Office on Drugs and Crime', flag: '💊', chairs: 2, delegates: 25 },
  { code: 'CSTD', name: 'Commission on Science & Technology for Development', flag: '🧪', chairs: 2, delegates: 25 },
  { code: 'UNSC', name: 'Security Council', flag: '🛡️', chairs: 2, delegates: 30 },
  { code: 'UNHRC', name: 'Human Rights Council', flag: '🕊️', chairs: 2, delegates: 30 },
  { code: 'DISEC', name: 'Disarmament and International Security Committee', flag: '🕊️', chairs: 2, delegates: 30 },
  { code: 'UNICEF', name: 'United Nations Children\'s Fund', flag: '👧', chairs: 2, delegates: 20 },
  { code: 'UNWOMEN', name: 'United Nations Entity for Gender Equality', flag: '♀️', chairs: 2, delegates: 30 },
  { code: 'WHO', name: 'World Health Organization', flag: '⚕️', chairs: 2, delegates: 30 },
  { code: 'UNEP', name: 'United Nations Environmental Programme', flag: '🌿', chairs: 2, delegates: 20 },
  { code: 'UNESCO', name: 'UN Educational, Scientific and Cultural Organization', flag: '🏛️', chairs: 2, delegates: 20 },
  { code: 'F1', name: 'Formula One Council', flag: '🏁', chairs: 2, delegates: 20 },
  { code: 'PRESS', name: 'Press Corps', flag: '📰', chairs: 2, delegates: 20 },
  { code: 'UNCSA', name: 'Commission on Superhuman Activities', flag: '🦸', chairs: 2, delegates: 20 },
  { code: 'FWC', name: 'Fantasy World Committee', flag: '🐉', chairs: 2, delegates: 30 }
];

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const pad = (num) => String(num).padStart(2, '0');

function generateUsers() {
  const users = [];
  COMMITTEES.forEach((committee) => {
    const slug = slugify(committee.code || committee.name);
    for (let i = 1; i <= committee.chairs; i += 1) {
      users.push({
        id: `${slug}-chair-${pad(i)}`,
        name: `${committee.code} Chair ${i}`,
        role: 'chair',
        delegation: `${committee.code} Dais`,
        flag: committee.flag,
        committeeCode: committee.code,
        credentials: {
          1: `${slug}-chair${pad(i)}-day1`,
          2: `${slug}-chair${pad(i)}-day2`
        }
      });
    }
    for (let j = 1; j <= committee.delegates; j += 1) {
      users.push({
        id: `${slug}-del-${pad(j)}`,
        name: `${committee.code} Delegate ${pad(j)}`,
        role: 'delegate',
        delegation: `${committee.name} Seat ${pad(j)}`,
        flag: committee.flag,
        committeeCode: committee.code,
        credentials: {
          1: `${slug}-del${pad(j)}-day1`,
          2: `${slug}-del${pad(j)}-day2`
        }
      });
    }
  });
  return users;
}

const DEFAULT_USERS = generateUsers();

const state = {
  users: [],
  notes: [],
  currentUser: null,
  currentDay: 1,
  token: null,
  ws: null
};

const els = {
  loginView: document.getElementById('login-view'),
  dashboardView: document.getElementById('dashboard-view'),
  loginForm: document.getElementById('login-form'),
  loginCommittee: document.getElementById('login-committee'),
  loginUserSelect: document.getElementById('login-user'),
  loginPassword: document.getElementById('login-password'),
  topicSelect: document.getElementById('topic-select'),
  noteContent: document.getElementById('note-content'),
  committeeSelect: document.getElementById('committee-select'),
  delegationSelect: document.getElementById('delegation-select'),
  addDelegationBtn: document.getElementById('add-delegation-btn'),
  selectedDelegations: document.getElementById('selected-delegations'),
  togglePassword: document.getElementById('toggle-password'),
  userList: document.getElementById('user-list'),
  chairsCheckbox: document.getElementById('chairs-checkbox'),
  composeForm: document.getElementById('compose-form'),
  inboxList: document.getElementById('inbox-list'),
  inboxEmpty: document.getElementById('inbox-empty'),
  starredList: document.getElementById('starred-list'),
  starredEmpty: document.getElementById('starred-empty'),
  userChip: document.getElementById('user-chip'),
  dayChip: document.getElementById('day-chip'),
  logoutBtn: document.getElementById('logout-btn'),
  resetDemoData: document.getElementById('reset-demo-data'),
  tabs: document.querySelectorAll('.tab'),
  panels: document.querySelectorAll('.panel-body'),
  dashActions: document.querySelector('.dashboard-actions'),
  exportNotes: document.getElementById('export-notes')
};

const utils = {
  uid: () => crypto.randomUUID(),
  formatDate: (ts) =>
    new Date(ts).toLocaleString([], {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
};

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${state.token}`,
    'Content-Type': 'application/json'
  };
}

async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...options.headers };
  const config = { ...options, headers };
  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error('API call failed:', err);
    throw err;
  }
}

function connectWebSocket() {
  if (!state.token || state.ws) return;
  try {
    const ws = new WebSocket(`${WS_URL}?token=${state.token}`);
    ws.onopen = () => {
      console.log('WebSocket connected');
      state.ws = ws;
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_note' && data.note) {
          const note = {
            ...data.note,
            isRead: false,
            isStarred: false
          };
          state.notes.unshift(note);
          renderNotes();
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      state.ws = null;
      setTimeout(connectWebSocket, 3000);
    };
  } catch (err) {
    console.error('WebSocket connection failed:', err);
  }
}

async function fetchNotes() {
  try {
    const notes = await apiCall('/notes');
    state.notes = notes;
    renderNotes();
  } catch (err) {
    console.error('Failed to fetch notes:', err);
    alert('Failed to load notes. Please refresh the page.');
  }
}

async function fetchUsers() {
  try {
    const users = await apiCall('/users');
    state.users = users.map(u => ({
      id: u.id,
      name: u.username,
      role: u.role,
      delegation: u.delegation,
      flag: u.flag,
      committeeCode: u.committee_code
    }));
    return state.users;
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return [];
  }
}

async function fetchDelegations() {
  try {
    const delegations = await apiCall('/users/delegations');
    return delegations;
  } catch (err) {
    console.error('Failed to fetch delegations:', err);
    return [];
  }
}

function renderLoginOptions(code) {
  if (!code) {
    els.loginUserSelect.innerHTML = '<option value="">Select account</option>';
    els.loginUserSelect.disabled = true;
    return;
  }
  const users = DEFAULT_USERS.filter((user) => user.committeeCode === code);
  els.loginUserSelect.disabled = false;
  els.loginUserSelect.innerHTML =
    '<option value="">Select account</option>' +
    users
      .map(
        (user) =>
          `<option value="${user.id}">
            ${user.flag} ${user.name} (${user.role === 'chair' ? 'Chair' : user.delegation})
          </option>`
      )
      .join('');
}

function renderTopicOptions() {
  els.topicSelect.innerHTML =
    '<option value="">Select a topic</option>' +
    TOPICS.map((topic) => `<option value="${topic}">${topic}</option>`).join('');
}

async function renderRecipients(committeeCode) {
  if (!committeeCode) {
    els.userList.innerHTML =
      '<div class="empty-state" style="padding:1rem;">Log in to see delegates from your committee.</div>';
    return;
  }
  await fetchUsers();
  const list = state.users
    .filter((user) => user.committeeCode === committeeCode && user.id !== state.currentUser?.id)
    .map(
      (user) => `
        <label class="checkbox">
          <input type="checkbox" name="userRecipient" value="${user.id}" />
          <span>${user.flag} ${user.name} (${user.role === 'chair' ? 'Chair' : user.delegation})</span>
        </label>
      `
    )
    .join('');
  els.userList.innerHTML = list || '<div class="empty-state" style="padding:1rem;">No other delegates found.</div>';
}

function noteVisibleToUser(note, user) {
  if (!user) return false;
  if (note.fromCommittee !== user.committeeCode) return false;
  if (note.fromId === user.id) return false;
  return note.recipients.some((recipient) => {
    if (recipient.type === 'user') return recipient.id === String(user.id);
    if (recipient.type === 'delegation') return recipient.id === user.delegation;
    if (recipient.type === 'chairs') {
      return user.role === 'chair' && recipient.id === user.committeeCode;
    }
    return false;
  });
}

function noteStarred(note) {
  return Boolean(note.isStarred);
}

function noteRead(note) {
  return Boolean(note.isRead);
}

async function setNoteRead(noteId) {
  try {
    await apiCall(`/notes/${noteId}/read`, { method: 'PATCH' });
    const note = state.notes.find(n => n.id === noteId);
    if (note) note.isRead = true;
    renderNotes();
  } catch (err) {
    console.error('Failed to mark note as read:', err);
  }
}

async function toggleStar(noteId) {
  if (state.currentUser.role !== 'chair') return;
  try {
    const note = state.notes.find(n => n.id === noteId);
    const newStarred = !noteStarred(note);
    await apiCall(`/notes/${noteId}/star`, {
      method: 'PATCH',
      body: JSON.stringify({ starred: newStarred })
    });
    note.isStarred = newStarred;
    renderNotes();
  } catch (err) {
    console.error('Failed to toggle star:', err);
    alert('Failed to star note. Only chairs can star notes.');
  }
}

function formatRecipients(note) {
  const labels = note.recipients.map((recipient) => {
    if (recipient.type === 'user') {
      const user = state.users.find((u) => String(u.id) === String(recipient.id));
      return user ? `${user.flag} ${user.name}` : 'Unknown delegate';
    }
    if (recipient.type === 'delegation') {
      const user = state.users.find(
        (u) => u.delegation === recipient.id && u.committeeCode === note.fromCommittee
      );
      const flag = user?.flag || '🏳️';
      return `${flag} ${recipient.id}`;
    }
    if (recipient.type === 'chairs') {
      return `⭐ Chair team (${recipient.id})`;
    }
    return recipient.id;
  });
  return labels.join(', ');
}

function renderNotes() {
  if (!state.currentUser) {
    els.inboxList.innerHTML = '';
    els.starredList.innerHTML = '';
    els.inboxEmpty.classList.remove('hidden');
    els.starredEmpty.classList.remove('hidden');
    return;
  }
  const visibleNotes = state.notes.filter((note) => noteVisibleToUser(note, state.currentUser));
  visibleNotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (visibleNotes.length === 0) {
    els.inboxEmpty.classList.remove('hidden');
  } else {
    els.inboxEmpty.classList.add('hidden');
  }

  els.inboxList.innerHTML = visibleNotes
    .map(
      (note) => `
      <article class="note-card ${noteRead(note) ? '' : 'new'}" data-note="${note.id}">
        <div class="note-header">
          <div>
            <p class="note-from">${note.fromFlag} ${note.fromDelegation}</p>
            <span class="note-topic">${note.topic}</span>
          </div>
          ${
            state.currentUser.role === 'chair'
              ? `<button class="star-btn ${noteStarred(note) ? 'active' : ''}" data-star="${note.id}">
                  ${noteStarred(note) ? '★' : '☆'}
                 </button>`
              : ''
          }
        </div>
        <div class="note-content">${note.content}</div>
        <div class="note-meta">
          <span>${utils.formatDate(note.timestamp)}</span>
          <span>To: ${formatRecipients(note)}</span>
        </div>
      </article>
    `
    )
    .join('');

  const starred = visibleNotes.filter((note) => noteStarred(note));
  if (starred.length === 0) {
    els.starredEmpty.classList.remove('hidden');
  } else {
    els.starredEmpty.classList.add('hidden');
  }
  els.starredList.innerHTML = starred
    .map(
      (note) => `
      <article class="note-card" data-note="${note.id}">
        <div class="note-header">
          <div>
            <p class="note-from">${note.fromFlag} ${note.fromDelegation}</p>
            <span class="note-topic">${note.topic}</span>
          </div>
          <button class="star-btn active" data-star="${note.id}">★</button>
        </div>
        <div class="note-content">${note.content}</div>
        <div class="note-meta">
          <span>${utils.formatDate(note.timestamp)}</span>
          <span>To: ${formatRecipients(note)}</span>
        </div>
      </article>
    `
    )
    .join('');

  document.querySelectorAll('[data-note]').forEach((card) => {
    card.addEventListener('click', () => {
      setNoteRead(card.dataset.note);
      card.classList.remove('new');
    });
  });
  document.querySelectorAll('[data-star]').forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStar(btn.dataset.star);
    })
  );
}

async function handleLogin(event) {
  event.preventDefault();
  const userId = els.loginUserSelect.value;
  const password = els.loginPassword.value.trim();
  const day = Number(
    (document.querySelector('input[name="sessionDay"]:checked') || { value: 1 }).value
  );

  const user = DEFAULT_USERS.find((u) => u.id === userId);
  if (!user) return alert('User not found');

  const username = user.credentials[day];
  if (!username || username !== password) {
    alert('Incorrect password for selected day.');
    return;
  }

  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    state.token = data.token;
    state.currentUser = {
      id: data.user.id,
      name: data.user.username,
      role: data.user.role,
      delegation: data.user.delegation,
      flag: data.user.flag,
      committeeCode: data.user.committee
    };
    state.currentDay = day;

    localStorage.setItem('token', state.token);
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    localStorage.setItem('currentDay', String(day));

    els.loginView.classList.add('hidden');
    els.dashboardView.classList.remove('hidden');
    
    // Format display name
    let displayName = state.currentUser.name;
    if (state.currentUser.role === 'chair') {
      // Parse username like "ep-chair01-day1" to get "Chair of EP (1)"
      const match = state.currentUser.name.match(/chair(\d+)/i);
      if (match && state.currentUser.committeeCode) {
        const chairNum = parseInt(match[1], 10);
        displayName = `Chair of ${state.currentUser.committeeCode} (${chairNum})`;
      }
    } else {
      // For delegates, use the delegation name
      displayName = state.currentUser.delegation;
    }
    
    els.userChip.textContent = `${state.currentUser.flag} ${displayName}`;
    els.dayChip.textContent = `Session Day ${day}`;
    document.querySelectorAll('.chair-only').forEach((el) => {
      el.classList[state.currentUser.role === 'chair' ? 'remove' : 'add']('hidden');
    });
    els.committeeSelect.disabled = true;
    els.addDelegationBtn.disabled = false;
    els.committeeSelect.value = state.currentUser.committeeCode;
    await updateDelegationOptions(state.currentUser.committeeCode);
    await renderRecipients(state.currentUser.committeeCode);
    await fetchNotes();
    connectWebSocket();
  } catch (err) {
    alert('Login failed: ' + (err.message || 'Invalid credentials'));
  }
}

function handleLogout() {
  if (state.ws) {
    state.ws.close();
    state.ws = null;
  }
  state.currentUser = null;
  state.currentDay = 1;
  state.token = null;
  state.notes = [];
  state.users = [];
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentDay');
  els.dashboardView.classList.add('hidden');
  els.loginView.classList.remove('hidden');
  els.loginPassword.value = '';
  els.loginCommittee.value = '';
  renderLoginOptions('');
  els.committeeSelect.disabled = true;
  els.addDelegationBtn.disabled = true;
  els.committeeSelect.value = '';
  updateDelegationOptions('');
  renderRecipients(null);
}

function collectRecipients() {
  const userRecipients = Array.from(
    document.querySelectorAll('input[name="userRecipient"]:checked')
  )
    .map((input) => state.users.find((u) => String(u.id) === String(input.value)))
    .filter(
      (user) =>
        user &&
        state.currentUser &&
        user.committeeCode === state.currentUser.committeeCode &&
        user.id !== state.currentUser.id
    )
    .map((user) => ({ type: 'user', id: String(user.id) }));

  const delegationRecipients = Array.from(
    document.querySelectorAll('input[name="selectedDelegation"]')
  ).map((input) => ({ type: 'delegation', id: input.value }));

  const recipients = [...userRecipients, ...delegationRecipients];
  if (els.chairsCheckbox.checked && state.currentUser) {
    recipients.push({ type: 'chairs', id: state.currentUser.committeeCode });
  }

  const unique = [];
  const seen = new Set();
  recipients.forEach((recipient) => {
    const key = `${recipient.type}-${recipient.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(recipient);
    }
  });
  return unique;
}

function clearRecipientSelections() {
  document.querySelectorAll('input[name="userRecipient"]').forEach((input) => {
    input.checked = false;
  });
  els.selectedDelegations.innerHTML = '';
  if (state.currentUser) {
    els.committeeSelect.value = state.currentUser.committeeCode;
    updateDelegationOptions(state.currentUser.committeeCode);
    els.committeeSelect.disabled = true;
    els.addDelegationBtn.disabled = false;
  } else {
    els.committeeSelect.value = '';
    els.committeeSelect.disabled = true;
    els.addDelegationBtn.disabled = true;
    updateDelegationOptions('');
  }
  els.chairsCheckbox.checked = false;
}

function populateCommitteeSelect() {
  const options =
    '<option value="">Select committee</option>' +
    COMMITTEES.map(
      (committee) => `<option value="${committee.code}">${committee.code} – ${committee.name}</option>`
    ).join('');
  els.committeeSelect.innerHTML = options;
}

function populateLoginCommittees() {
  els.loginCommittee.innerHTML =
    '<option value="">Select committee</option>' +
    COMMITTEES.map(
      (committee) => `<option value="${committee.code}">${committee.code} – ${committee.name}</option>`
    ).join('');
  els.loginCommittee.value = '';
  renderLoginOptions('');
}

async function updateDelegationOptions(code) {
  if (!code) {
    els.delegationSelect.innerHTML = '<option value="">Select delegation</option>';
    els.delegationSelect.disabled = true;
    return;
  }
  if (!state.currentUser || code !== state.currentUser.committeeCode) {
    els.delegationSelect.innerHTML = '<option value="">Select delegation</option>';
    els.delegationSelect.disabled = true;
    return;
  }
  try {
    const delegations = await fetchDelegations();
    if (delegations.length === 0) {
      els.delegationSelect.innerHTML = '<option value="">No delegations</option>';
      els.delegationSelect.disabled = true;
      return;
    }
    els.delegationSelect.disabled = false;
    const options =
      '<option value="">Select delegation</option>' +
      delegations
        .map(
          (del) => `<option value="${del.delegation}" data-flag="${del.flag}">${del.flag} ${del.delegation}</option>`
        )
        .join('');
    els.delegationSelect.innerHTML = options;
  } catch (err) {
    console.error('Failed to load delegations:', err);
    els.delegationSelect.innerHTML = '<option value="">Error loading delegations</option>';
    els.delegationSelect.disabled = true;
  }
}

function addDelegationSelection() {
  const committeeCode = els.committeeSelect.value;
  const delegationName = els.delegationSelect.value;
  if (!committeeCode || !delegationName) {
    alert('Please choose both committee and delegation.');
    return;
  }
  if (!state.currentUser || committeeCode !== state.currentUser.committeeCode) {
    alert('You can only send to delegations inside your committee.');
    return;
  }
  const existing = Array.from(
    document.querySelectorAll('input[name="selectedDelegation"]')
  ).some((input) => input.value === delegationName);
  if (existing) {
    alert('Delegation already added.');
    return;
  }
  const flag =
    els.delegationSelect.selectedOptions[0].dataset.flag ||
    state.users.find(
      (user) => user.delegation === delegationName && user.committeeCode === committeeCode
    )?.flag ||
    '🏳️';
  const chip = document.createElement('div');
  chip.className = 'selected-chip';
  chip.dataset.delegation = delegationName;
  chip.innerHTML = `
    <span>${flag} ${delegationName}</span>
    <button type="button" aria-label="Remove delegation">×</button>
    <input type="hidden" name="selectedDelegation" value="${delegationName}" />
  `;
  chip.querySelector('button').addEventListener('click', () => chip.remove());
  els.selectedDelegations.appendChild(chip);
}

async function handleCompose(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const topic = els.topicSelect.value;
  const content = els.noteContent.value.trim();
  const recipients = collectRecipients();

  if (!topic) return alert('Please select a topic.');
  if (!content) return alert('Please write your note.');
  if (recipients.length === 0) return alert('Please select at least one recipient.');

  try {
    await apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify({ topic, content, recipients })
    });
    els.composeForm.reset();
    clearRecipientSelections();
    await fetchNotes();
    alert('Note sent successfully.');
  } catch (err) {
    alert('Failed to send note: ' + (err.message || 'Unknown error'));
  }
}

function switchTab(tabName) {
  els.tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabName));
  els.panels.forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== tabName));
}

function exportNotes() {
  if (state.notes.length === 0) {
    alert('No notes to export yet.');
    return;
  }
  const visibleNotes = state.notes.filter((note) => noteVisibleToUser(note, state.currentUser));
  const rows = visibleNotes.map((note) => ({
    from: `${note.fromFlag} ${note.fromDelegation}`,
    topic: note.topic,
    content: note.content.replace(/\n/g, ' '),
    recipients: formatRecipients(note),
    time: utils.formatDate(note.timestamp)
  }));
  const header = 'From,Topic,Recipients,Time,Content';
  const csv =
    header +
    '\n' +
    rows
      .map((row) =>
        [row.from, row.topic, row.recipients, row.time, `"${row.content}"`].join(',')
      )
      .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'note-passing-log.csv';
  link.click();
}

async function checkExistingSession() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('currentUser');
  const dayStr = localStorage.getItem('currentDay');
  if (token && userStr) {
    try {
      state.token = token;
      state.currentUser = JSON.parse(userStr);
      state.currentDay = Number(dayStr) || 1;
      await fetchUsers();
      await fetchNotes();
      connectWebSocket();
      els.loginView.classList.add('hidden');
      els.dashboardView.classList.remove('hidden');
      // Format display name
      let displayName = state.currentUser.name;
      if (state.currentUser.role === 'chair') {
        // Parse username like "ep-chair01-day1" to get "Chair of EP (1)"
        const match = state.currentUser.name.match(/chair(\d+)/i);
        if (match && state.currentUser.committeeCode) {
          const chairNum = parseInt(match[1], 10);
          displayName = `Chair of ${state.currentUser.committeeCode} (${chairNum})`;
        }
      } else {
        // For delegates, use the delegation name
        displayName = state.currentUser.delegation;
      }
      
      els.userChip.textContent = `${state.currentUser.flag} ${displayName}`;
      els.dayChip.textContent = `Session Day ${state.currentDay}`;
      document.querySelectorAll('.chair-only').forEach((el) => {
        el.classList[state.currentUser.role === 'chair' ? 'remove' : 'add']('hidden');
      });
      els.committeeSelect.disabled = true;
      els.addDelegationBtn.disabled = false;
      els.committeeSelect.value = state.currentUser.committeeCode;
      await updateDelegationOptions(state.currentUser.committeeCode);
      await renderRecipients(state.currentUser.committeeCode);
    } catch (err) {
      console.error('Session restore failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentDay');
    }
  }
}

function init() {
  renderTopicOptions();
  renderRecipients(null);
  populateCommitteeSelect();
  populateLoginCommittees();
  els.committeeSelect.disabled = true;
  els.addDelegationBtn.disabled = true;

  els.loginForm.addEventListener('submit', handleLogin);
  els.logoutBtn.addEventListener('click', handleLogout);
  els.composeForm.addEventListener('submit', handleCompose);
  els.resetDemoData.addEventListener('click', () => {
    if (confirm('This will reset all demo data. Continue?')) {
      handleLogout();
      alert('Demo data reset. You can log in again.');
    }
  });
  els.tabs.forEach((tab) =>
    tab.addEventListener('click', () => switchTab(tab.dataset.tab))
  );
  els.exportNotes.addEventListener('click', exportNotes);
  els.committeeSelect.addEventListener('change', (event) =>
    updateDelegationOptions(event.target.value)
  );
  els.loginCommittee.addEventListener('change', (event) =>
    renderLoginOptions(event.target.value)
  );
  els.addDelegationBtn.addEventListener('click', addDelegationSelection);
  els.togglePassword.addEventListener('click', () => {
    const type = els.loginPassword.type === 'password' ? 'text' : 'password';
    els.loginPassword.type = type;
    els.togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
  });
  updateDelegationOptions('');
  renderLoginOptions('');
  checkExistingSession();
}

document.addEventListener('DOMContentLoaded', init);
