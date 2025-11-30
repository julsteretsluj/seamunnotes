const STORAGE_KEYS = {
  users: 'dnp_static_users',
  notes: 'dnp_static_notes',
  stars: 'dnp_static_stars',
  reads: 'dnp_static_reads'
};

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
  { code: 'UNICEF', name: 'United Nations Children’s Fund', flag: '👧', chairs: 2, delegates: 20 },
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
  stars: {},
  reads: {},
  currentUser: null,
  currentDay: 1
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

function loadState() {
  state.users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || DEFAULT_USERS;
  state.notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes)) || [];
  state.stars = JSON.parse(localStorage.getItem(STORAGE_KEYS.stars)) || {};
  state.reads = JSON.parse(localStorage.getItem(STORAGE_KEYS.reads)) || {};
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(state.notes));
  localStorage.setItem(STORAGE_KEYS.stars, JSON.stringify(state.stars));
  localStorage.setItem(STORAGE_KEYS.reads, JSON.stringify(state.reads));
}

function resetState() {
  localStorage.removeItem(STORAGE_KEYS.users);
  localStorage.removeItem(STORAGE_KEYS.notes);
  localStorage.removeItem(STORAGE_KEYS.stars);
  localStorage.removeItem(STORAGE_KEYS.reads);
  loadState();
  populateLoginCommittees();
  renderLoginOptions('');
  renderRecipients(null);
  alert('Demo data reset. You can log in again.');
}

function renderLoginOptions(code) {
  if (!code) {
    els.loginUserSelect.innerHTML = '<option value="">Select account</option>';
    els.loginUserSelect.disabled = true;
    return;
  }
  const users = state.users.filter((user) => user.committeeCode === code);
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

function delegationsByCommittee() {
  const map = new Map();
  state.users.forEach((user) => {
    if (user.role !== 'delegate') return;
    if (!map.has(user.committeeCode)) {
      map.set(user.committeeCode, new Map());
    }
    if (!map.get(user.committeeCode).has(user.delegation)) {
      map.get(user.committeeCode).set(user.delegation, user.flag);
    }
  });
  return map;
}

async function renderRecipients(committeeCode) {
  // Function kept for compatibility but no longer renders individual users
  // Recipients are now only selected via delegations
  // This function is intentionally empty as individual user selection was removed
  return;
}

function noteVisibleToUser(note, user) {
  if (!user) return false;
  const noteCommittee =
    note.fromCommittee ||
    state.users.find((u) => u.id === note.fromId)?.committeeCode ||
    user.committeeCode;
  if (noteCommittee !== user.committeeCode) return false;
  if (note.fromId === user.id) return true;
  return note.recipients.some((recipient) => {
    if (recipient.type === 'user') return recipient.id === user.id;
    if (recipient.type === 'delegation') return recipient.id === user.delegation;
    if (recipient.type === 'chairs') {
      if (recipient.id === 'chairs') return user.role === 'chair'; // legacy data
      return user.role === 'chair' && recipient.id === user.committeeCode;
    }
    return false;
  });
}

function noteStarred(noteId) {
  return Boolean(state.stars[state.currentUser.id]?.[noteId]);
}

function noteRead(noteId) {
  return Boolean(state.reads[state.currentUser.id]?.[noteId]);
}

function setNoteRead(noteId) {
  if (!state.reads[state.currentUser.id]) {
    state.reads[state.currentUser.id] = {};
  }
  state.reads[state.currentUser.id][noteId] = true;
  saveState();
}

function toggleStar(noteId) {
  if (state.currentUser.role !== 'chair') return;
  if (!state.stars[state.currentUser.id]) {
    state.stars[state.currentUser.id] = {};
  }
  state.stars[state.currentUser.id][noteId] = !state.stars[state.currentUser.id][noteId];
  saveState();
  renderNotes();
}

function formatRecipients(note) {
  const noteCommittee =
    note.fromCommittee ||
    state.users.find((u) => u.id === note.fromId)?.committeeCode ||
    state.currentUser?.committeeCode;
  const labels = note.recipients.map((recipient) => {
    if (recipient.type === 'user') {
      const user = state.users.find((u) => u.id === recipient.id);
      return user ? `${user.flag} ${user.name}` : 'Unknown delegate';
    }
    if (recipient.type === 'delegation') {
      const user = state.users.find(
        (u) => u.delegation === recipient.id && u.committeeCode === noteCommittee
      );
      const flag = user?.flag || '🏳️';
      return `${flag} ${recipient.id}`;
    }
    if (recipient.type === 'chairs') {
      return `⭐ Chair team (${recipient.id === 'chairs' ? 'all' : recipient.id})`;
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
      <article class="note-card ${noteRead(note.id) ? '' : 'new'}" data-note="${note.id}">
        <div class="note-header">
          <div>
            <p class="note-from">${note.fromFlag} ${note.fromDelegation}</p>
            <span class="note-topic">${note.topic}</span>
          </div>
          ${
            state.currentUser.role === 'chair'
              ? `<button class="star-btn ${noteStarred(note.id) ? 'active' : ''}" data-star="${note.id}">
                  ${noteStarred(note.id) ? '★' : '☆'}
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

  const starred = visibleNotes.filter((note) => noteStarred(note.id));
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

function handleLogin(event) {
  event.preventDefault();
  const userId = els.loginUserSelect.value;
  const password = els.loginPassword.value.trim();
  const day = Number(
    (document.querySelector('input[name="sessionDay"]:checked') || { value: 1 }).value
  );

  const user = state.users.find((u) => u.id === userId);
  if (!user) return alert('User not found');

  if (user.credentials[day] !== password) {
    alert('Incorrect password for selected day.');
    return;
  }

  state.currentUser = user;
  state.currentDay = day;
  els.loginView.classList.add('hidden');
  els.dashboardView.classList.remove('hidden');
  els.userChip.textContent = `${user.flag} ${user.name} (${user.role === 'chair' ? 'Chair' : user.delegation})`;
  els.dayChip.textContent = `Session Day ${day}`;
  document.querySelectorAll('.chair-only').forEach((el) => {
    el.classList[user.role === 'chair' ? 'remove' : 'add']('hidden');
  });
  els.committeeSelect.disabled = true;
  els.addDelegationBtn.disabled = false;
  els.committeeSelect.value = user.committeeCode;
  updateDelegationOptions(user.committeeCode);
  renderRecipients(user.committeeCode);
  renderNotes();
}

function handleLogout() {
  state.currentUser = null;
  state.currentDay = 1;
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
  const delegationRecipients = Array.from(
    document.querySelectorAll('input[name="selectedDelegation"]')
  ).map((input) => ({ type: 'delegation', id: input.value }));

  const unique = [];
  const seen = new Set();
  delegationRecipients.forEach((recipient) => {
    const key = `${recipient.type}-${recipient.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(recipient);
    }
  });
  
  // Automatically add chairs as recipients for all delegate-to-delegate notes
  // (but not if the sender is already a chair)
  if (state.currentUser && state.currentUser.role !== 'chair' && unique.length > 0) {
    unique.push({ type: 'chairs', id: state.currentUser.committeeCode });
  }

  return unique;
}

function clearRecipientSelections() {
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

function updateDelegationOptions(code) {
  if (!code) {
    els.delegationSelect.innerHTML = '<option value="">Select delegation</option>';
    els.delegationSelect.disabled = true;
    return;
  }
  const map = delegationsByCommittee();
  const delegations = map.get(code);
  if (!delegations) {
    els.delegationSelect.innerHTML = '<option value="">No delegations</option>';
    els.delegationSelect.disabled = true;
    return;
  }
  els.delegationSelect.disabled = false;
  const options =
    '<option value="">Select delegation</option>' +
    Array.from(delegations.entries())
      .map(
        ([name, flag]) => `<option value="${name}" data-flag="${flag}">${flag} ${name}</option>`
      )
      .join('');
  els.delegationSelect.innerHTML = options;
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

function handleCompose(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const topic = els.topicSelect.value;
  const content = els.noteContent.value.trim();
  const recipients = collectRecipients();

  if (!topic) return alert('Please select a topic.');
  if (!content) return alert('Please write your note.');
  if (recipients.length === 0) return alert('Please select at least one recipient.');

  const newNote = {
    id: utils.uid(),
    fromId: state.currentUser.id,
    fromCommittee: state.currentUser.committeeCode,
    fromDelegation: state.currentUser.delegation,
    fromFlag: state.currentUser.flag,
    topic,
    content,
    recipients,
    timestamp: new Date().toISOString()
  };

  state.notes.push(newNote);
  saveState();
  els.composeForm.reset();
  clearRecipientSelections();
  renderNotes();
  alert('Note sent successfully.');
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
  const rows = state.notes.map((note) => ({
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

function init() {
  loadState();
  renderTopicOptions();
  renderRecipients(null);
  populateCommitteeSelect();
  populateLoginCommittees();
  els.committeeSelect.disabled = true;
  els.addDelegationBtn.disabled = true;

  els.loginForm.addEventListener('submit', handleLogin);
  els.logoutBtn.addEventListener('click', handleLogout);
  els.composeForm.addEventListener('submit', handleCompose);
  els.resetDemoData.addEventListener('click', resetState);
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
}

document.addEventListener('DOMContentLoaded', init);

