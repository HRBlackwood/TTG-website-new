/* ═══════════════════════════════════════════════════════════════
   TTG ADMIN DASHBOARD — SCRIPT
═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'ttg_members';
const CONTENT_STORAGE_KEY = 'ttg_site_content';
const UPCOMING_EVENTS_KEY = 'ttg_upcoming_events';

// ── STATE ────────────────────────────────────────────────────
let members      = [];
let filtered     = [];
let sortKey      = 'submittedAt';
let sortDir      = -1; // -1 = desc, 1 = asc
let activeModal  = null;
let contentEditorReady = false;
let upcomingEditorReady = false;
let sectionTabsReady = false;

// ── LOGIN ────────────────────────────────────────────────────
const loginScreen  = document.getElementById('loginScreen');
const dashboard    = document.getElementById('dashboard');
const loginForm    = document.getElementById('loginForm');
const loginError   = document.getElementById('loginError');

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!window.FirebaseAPI?.isConfigured?.()) {
    loginError.textContent = 'Firebase is not configured. Update firebase-config.js.';
    return;
  }
  const email = document.getElementById('adminEmail').value.trim();
  const pw = document.getElementById('adminPassword').value;
  try {
    await window.FirebaseAPI.signInAdmin(email, pw);
    await unlock();
  } catch (error) {
    loginError.textContent = error?.message || 'Login failed.';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
});

async function unlock() {
  loginScreen.hidden = true;
  dashboard.hidden   = false;
  initSectionTabs();
  await loadMembers();
  await initContentEditor();
  await initUpcomingEventsManager();
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  if (window.FirebaseAPI?.isConfigured?.()) {
    try {
      await window.FirebaseAPI.signOutAdmin();
    } catch {
      // no-op
    }
  }
  loginScreen.hidden = false;
  dashboard.hidden   = true;
  document.getElementById('adminEmail').value = '';
  document.getElementById('adminPassword').value = '';
  loginError.textContent = '';
});

document.getElementById('migrateLocalBtn').addEventListener('click', async () => {
  if (!confirm('Import local browser data into Firebase now?')) return;
  try {
    const legacyMembers = parseJsonSafe(localStorage.getItem(STORAGE_KEY), []);
    const legacyEvents = parseJsonSafe(localStorage.getItem(UPCOMING_EVENTS_KEY), []);
    const legacyContent = parseJsonSafe(localStorage.getItem(CONTENT_STORAGE_KEY), {});

    const membersResult = await window.FirebaseAPI.importMemberships(Array.isArray(legacyMembers) ? legacyMembers : []);
    const eventsResult = await window.FirebaseAPI.importEvents(Array.isArray(legacyEvents) ? legacyEvents : []);
    let contentMigrated = false;
    if (legacyContent && typeof legacyContent === 'object' && Object.keys(legacyContent).length > 0) {
      await window.FirebaseAPI.saveSiteContent(legacyContent);
      contentMigrated = true;
    }

    await loadMembers();
    await renderUpcomingEvents();
    const content = await window.FirebaseAPI.getSiteContent();
    fillSiteContentForm(content || {});

    alert(
      `Migration complete.\nMembers imported: ${membersResult.imported}\nEvents imported: ${eventsResult.imported}\nContent migrated: ${contentMigrated ? 'Yes' : 'No'}`
    );
  } catch (error) {
    alert(`Migration failed: ${error.message}`);
  }
});

// ── DATA ─────────────────────────────────────────────────────
async function loadMembers() {
  if (!window.FirebaseAPI?.isConfigured?.()) {
    members = [];
    applyFilters();
    renderStats();
    return;
  }
  members = await window.FirebaseAPI.listMemberships();
  applyFilters();
  renderStats();
}

// ── SECTION TABS ─────────────────────────────────────────────
function initSectionTabs() {
  if (sectionTabsReady) return;
  sectionTabsReady = true;

  const tabs = Array.from(document.querySelectorAll('[data-admin-tab]'));
  const sectionNodes = Array.from(document.querySelectorAll('[data-admin-section]'));
  if (tabs.length === 0 || sectionNodes.length === 0) return;

  const setActiveSection = sectionName => {
    tabs.forEach(tab => {
      const active = tab.dataset.adminTab === sectionName;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    sectionNodes.forEach(node => {
      node.hidden = node.dataset.adminSection !== sectionName;
    });
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => setActiveSection(tab.dataset.adminTab));
  });

  setActiveSection('members');
}

// ── SITE CONTENT EDITOR ──────────────────────────────────────
function parseJsonSafe(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function setStatus(message, isError = false) {
  const status = document.getElementById('contentStatus');
  if (!status) return;
  status.textContent = message || '';
  status.style.color = isError ? '#e07060' : 'var(--text-2)';
}

function getInputValue(id) {
  const node = document.getElementById(id);
  return node ? node.value.trim() : '';
}

function setInputValue(id, value) {
  const node = document.getElementById(id);
  if (!node) return;
  node.value = value || '';
}

function getSiteContentFromForm() {
  const content = {
    heroSubtitle: getInputValue('heroSubtitleInput'),
    aboutLead: getInputValue('aboutLeadInput'),
    meetingWhen: getInputValue('meetingWhenInput'),
    meetingWhere: getInputValue('meetingWhereInput'),
    meetingMembership: getInputValue('meetingMembershipInput'),
    dndLogo: getInputValue('dndLogoInput'),
    warhammerLogo: getInputValue('warhammerLogoInput'),
    mtgLogo: getInputValue('mtgLogoInput'),
    eventsPoster: getInputValue('eventsPosterInput'),
    events: [],
  };

  for (let i = 1; i <= 4; i++) {
    content.events.push({
      day: getInputValue(`event${i}DayInput`),
      title: getInputValue(`event${i}TitleInput`),
      description: getInputValue(`event${i}DescInput`),
      time: getInputValue(`event${i}TimeInput`),
      location: getInputValue(`event${i}LocationInput`),
    });
  }

  return content;
}

function fillSiteContentForm(content) {
  setInputValue('heroSubtitleInput', content.heroSubtitle);
  setInputValue('aboutLeadInput', content.aboutLead);
  setInputValue('meetingWhenInput', content.meetingWhen);
  setInputValue('meetingWhereInput', content.meetingWhere);
  setInputValue('meetingMembershipInput', content.meetingMembership);
  setInputValue('dndLogoInput', content.dndLogo);
  setInputValue('warhammerLogoInput', content.warhammerLogo);
  setInputValue('mtgLogoInput', content.mtgLogo);
  setInputValue('eventsPosterInput', content.eventsPoster);

  const events = Array.isArray(content.events) ? content.events : [];
  for (let i = 1; i <= 4; i++) {
    const event = events[i - 1] || {};
    setInputValue(`event${i}DayInput`, event.day);
    setInputValue(`event${i}TitleInput`, event.title);
    setInputValue(`event${i}DescInput`, event.description);
    setInputValue(`event${i}TimeInput`, event.time);
    setInputValue(`event${i}LocationInput`, event.location);
  }
}

async function initContentEditor() {
  if (contentEditorReady) return;
  contentEditorReady = true;

  const saveBtn = document.getElementById('contentSaveBtn');
  const resetBtn = document.getElementById('contentResetBtn');
  if (!saveBtn || !resetBtn) return;

  try {
    const content = await window.FirebaseAPI.getSiteContent();
    fillSiteContentForm(content || {});
  } catch (error) {
    setStatus(`Unable to load content: ${error.message}`, true);
  }

  saveBtn.addEventListener('click', async () => {
    const content = getSiteContentFromForm();
    try {
      await window.FirebaseAPI.saveSiteContent(content);
      setStatus('Website content saved. Refresh the main site to see changes.');
    } catch (error) {
      setStatus(`Unable to save content: ${error.message}`, true);
    }
  });

  resetBtn.addEventListener('click', async () => {
    if (!confirm('Reset website content to defaults? This clears saved custom content.')) return;
    try {
      await window.FirebaseAPI.resetSiteContent();
      fillSiteContentForm({});
      setStatus('Website content reset to default values.');
    } catch (error) {
      setStatus(`Unable to reset content: ${error.message}`, true);
    }
  });
}

// ── UPCOMING EVENTS MANAGER ──────────────────────────────────
function setUpcomingStatus(message, isError = false) {
  const status = document.getElementById('upcomingStatus');
  if (!status) return;
  status.textContent = message || '';
  status.style.color = isError ? '#e07060' : 'var(--text-2)';
}

function clearUpcomingForm() {
  setInputValue('eventIdInput', '');
  setInputValue('upcomingTitleInput', '');
  setInputValue('upcomingDateInput', '');
  setInputValue('upcomingTimeInput', '');
  setInputValue('upcomingLocationInput', '');
  setInputValue('upcomingImageInput', '');
  setInputValue('upcomingDescriptionInput', '');
  const saveBtn = document.getElementById('upcomingSaveBtn');
  if (saveBtn) saveBtn.textContent = 'Post Event';
}

function formatUpcomingDate(dateValue) {
  if (!dateValue) return 'Date TBC';
  const d = new Date(dateValue);
  return isNaN(d.getTime())
    ? dateValue
    : d.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

async function renderUpcomingEvents() {
  const list = document.getElementById('upcomingEventsList');
  if (!list) return;

  let events = [];
  try {
    events = await window.FirebaseAPI.listEvents();
  } catch (error) {
    setUpcomingStatus(`Unable to load events: ${error.message}`, true);
  }

  events = events.slice().sort((a, b) => {
    const aDate = new Date(a.date || '9999-12-31').getTime();
    const bDate = new Date(b.date || '9999-12-31').getTime();
    return aDate - bDate;
  });

  if (events.length === 0) {
    list.innerHTML = '<div class="upcoming-empty">No upcoming events posted yet.</div>';
    return;
  }

  list.innerHTML = '';
  events.forEach(event => {
    const item = document.createElement('article');
    item.className = 'upcoming-item';
    item.innerHTML = `
      <h4>${esc(event.title)}</h4>
      <div class="upcoming-meta">${esc(formatUpcomingDate(event.date))} · ${esc(event.time || 'Time TBC')}</div>
      <div class="upcoming-meta">${esc(event.location || 'Location TBC')}</div>
      <p class="upcoming-desc">${esc(event.description || '')}</p>
      <div class="upcoming-actions">
        <button class="btn-ghost-sm" data-action="edit">Edit</button>
        <button class="btn-row-delete" data-action="delete">Delete</button>
      </div>
    `;

    item.querySelector('[data-action="edit"]').addEventListener('click', () => {
      setInputValue('eventIdInput', String(event.id));
      setInputValue('upcomingTitleInput', event.title);
      setInputValue('upcomingDateInput', event.date);
      setInputValue('upcomingTimeInput', event.time);
      setInputValue('upcomingLocationInput', event.location);
      setInputValue('upcomingImageInput', event.image || '');
      setInputValue('upcomingDescriptionInput', event.description);
      const saveBtn = document.getElementById('upcomingSaveBtn');
      if (saveBtn) saveBtn.textContent = 'Update Event';
      setUpcomingStatus(`Editing "${event.title}"`);
    });

    item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm(`Delete event "${event.title}"?`)) return;
      try {
        await window.FirebaseAPI.deleteEvent(event.id);
        await renderUpcomingEvents();
        setUpcomingStatus('Event deleted.');
      } catch (error) {
        setUpcomingStatus(`Unable to delete event: ${error.message}`, true);
      }
    });

    list.appendChild(item);
  });
}

async function initUpcomingEventsManager() {
  if (upcomingEditorReady) return;
  upcomingEditorReady = true;

  const saveBtn = document.getElementById('upcomingSaveBtn');
  const clearBtn = document.getElementById('upcomingClearBtn');
  if (!saveBtn || !clearBtn) return;

  await renderUpcomingEvents();

  clearBtn.addEventListener('click', () => {
    clearUpcomingForm();
    setUpcomingStatus('');
  });

  saveBtn.addEventListener('click', async () => {
    const id = getInputValue('eventIdInput');
    const title = getInputValue('upcomingTitleInput');
    const date = getInputValue('upcomingDateInput');
    const time = getInputValue('upcomingTimeInput');
    const location = getInputValue('upcomingLocationInput');
    const image = getInputValue('upcomingImageInput');
    const description = getInputValue('upcomingDescriptionInput');

    if (!title || !date || !time || !location) {
      setUpcomingStatus('Please fill in title, date, time, and location before posting.', true);
      return;
    }

    try {
      await window.FirebaseAPI.saveEvent({
        id: id || undefined,
        title,
        date,
        time,
        location,
        image,
        description,
        status: 'upcoming',
      });
      setUpcomingStatus(id ? 'Event updated and published.' : 'Event posted successfully.');
      clearUpcomingForm();
      await renderUpcomingEvents();
    } catch (error) {
      setUpcomingStatus(`Unable to save event: ${error.message}`, true);
    }
  });
}

// ── STATS ─────────────────────────────────────────────────────
function renderStats() {
  document.getElementById('statTotal').textContent = members.length;

  const withId = members.filter(m => m.studentId && m.studentId.trim());
  document.getElementById('statStudents').textContent = withId.length;

  const online = members.filter(m => m.paymentMethod === 'online-transfer');
  document.getElementById('statOnline').textContent = online.length;

  if (members.length > 0) {
    const latest = [...members].sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
    document.getElementById('statNewest').textContent = latest.firstName + ' ' + latest.lastName;
  } else {
    document.getElementById('statNewest').textContent = '—';
  }
}

// ── FILTER & SORT ────────────────────────────────────────────
const searchInput    = document.getElementById('searchInput');
const filterGame     = document.getElementById('filterGame');
const filterPayment  = document.getElementById('filterPayment');

searchInput.addEventListener('input', applyFilters);
filterGame.addEventListener('change', applyFilters);
filterPayment.addEventListener('change', applyFilters);

document.getElementById('clearFiltersBtn').addEventListener('click', () => {
  searchInput.value     = '';
  filterGame.value      = '';
  filterPayment.value   = '';
  applyFilters();
});

function applyFilters() {
  const q    = searchInput.value.toLowerCase().trim();
  const game = filterGame.value;
  const pay  = filterPayment.value;

  filtered = members.filter(m => {
    const text = `${m.firstName} ${m.lastName} ${m.email} ${m.phone} ${m.studentId}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (game && !(m.games || '').includes(game)) return false;
    if (pay && m.paymentMethod !== pay) return false;
    return true;
  });

  sortFiltered();
  renderTable();
}

function sortFiltered() {
  filtered.sort((a, b) => {
    let va = a[sortKey] ?? '';
    let vb = b[sortKey] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    return va < vb ? -sortDir : va > vb ? sortDir : 0;
  });
}

// ── TABLE RENDERING ──────────────────────────────────────────
const tbody      = document.getElementById('memberTableBody');
const emptyState = document.getElementById('emptyState');
const noResults  = document.getElementById('noResults');
const resultCount = document.getElementById('resultCount');

function renderTable() {
  tbody.innerHTML = '';
  emptyState.hidden = true;
  noResults.hidden  = true;

  if (members.length === 0) {
    emptyState.hidden = false;
    resultCount.textContent = '';
    return;
  }

  if (filtered.length === 0) {
    noResults.hidden = false;
    resultCount.textContent = '0 results';
    return;
  }

  resultCount.textContent = `Showing ${filtered.length} of ${members.length} member${members.length !== 1 ? 's' : ''}`;

  filtered.forEach((m, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-muted">${idx + 1}</td>
      <td class="td-primary">${esc(m.firstName)} ${esc(m.lastName)}</td>
      <td class="td-mono">${m.studentId ? esc(m.studentId) : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>
        <div class="td-primary" style="font-size:.82rem;">${esc(m.email)}</div>
        <div class="td-muted">${esc(m.phone)}</div>
      </td>
      <td>
        <div style="font-size:.82rem;">${esc(m.emergencyName)}</div>
        <div class="td-muted">${esc(m.emergencyNumber)}</div>
      </td>
      <td>${renderGamePills(m.games)}</td>
      <td><span class="payment-badge">${paymentIcon(m.paymentMethod)} ${paymentLabel(m.paymentMethod)}</span></td>
      <td class="td-muted">${m.paymentDate || '—'}</td>
      <td class="td-muted">${formatDate(m.submittedAt)}</td>
      <td>
        <button class="btn-row-delete" data-id="${m.id}">Delete</button>
      </td>
    `;

    // Row click → open modal (except delete button)
    tr.addEventListener('click', e => {
      if (e.target.classList.contains('btn-row-delete')) return;
      openModal(m);
    });

    // Delete button
    tr.querySelector('.btn-row-delete').addEventListener('click', async e => {
      e.stopPropagation();
      if (confirm(`Delete ${m.firstName} ${m.lastName}? This cannot be undone.`)) {
        await deleteMember(m.id);
      }
    });

    tbody.appendChild(tr);
  });
}

function renderGamePills(games) {
  if (!games) return '<span style="color:var(--text-muted)">—</span>';
  return games.split(', ').map(g => {
    const map = {
      'board-games': ['pill-board',     'Board Games'],
      'dnd':         ['pill-dnd',       'D&D'],
      'warhammer':   ['pill-warhammer', 'Warhammer'],
      'mtg':         ['pill-mtg',       'MTG'],
    };
    const [cls, label] = map[g.trim()] || ['', g];
    return `<span class="game-pill ${cls}">${label}</span>`;
  }).join('');
}

function paymentLabel(v) {
  return { 'online-transfer': 'Online Transfer', 'cash': 'Cash', 'card': 'Card' }[v] || v || '—';
}

function paymentIcon(v) {
  return { 'online-transfer': '💳', 'cash': '💵', 'card': '💳' }[v] || '—';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// ── SORT HEADERS ─────────────────────────────────────────────
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (sortKey === key) {
      sortDir *= -1;
    } else {
      sortKey = key;
      sortDir = -1;
    }
    document.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
    th.classList.add('sorted');
    th.querySelector('.sort-icon').textContent = sortDir === -1 ? '↓' : '↑';
    sortFiltered();
    renderTable();
  });
});

// ── DELETE ────────────────────────────────────────────────────
async function deleteMember(id) {
  await window.FirebaseAPI.deleteMembership(id);
  await loadMembers();
  if (activeModal === id) closeModal();
}

document.getElementById('clearAllBtn').addEventListener('click', async () => {
  if (members.length === 0) return;
  if (confirm(`Delete ALL ${members.length} member records? This cannot be undone.`)) {
    await window.FirebaseAPI.clearMemberships();
    await loadMembers();
  }
});

// ── MODAL ─────────────────────────────────────────────────────
const modal       = document.getElementById('memberModal');
const modalClose  = document.getElementById('modalClose');
const modalDelete = document.getElementById('modalDelete');

function openModal(m) {
  activeModal = m.id;
  document.getElementById('modalName').textContent = `${m.firstName} ${m.lastName}`;

  const grid = document.getElementById('modalGrid');
  grid.innerHTML = '';

  const fields = [
    ['Student ID',         m.studentId            || null],
    ['Email',              m.email],
    ['Phone',              m.phone],
    ['Emergency Contact',  m.emergencyName],
    ['Emergency Number',   m.emergencyNumber],
    ['Games of Interest',  m.games                || null],
    ['Payment Method',     paymentLabel(m.paymentMethod)],
    ['Payment Date',       m.paymentDate          || null],
    ['Registered',         formatDate(m.submittedAt)],
    ['Message',            m.message              || null, true],
  ];

  fields.forEach(([label, val, full]) => {
    const div = document.createElement('div');
    div.className = 'modal-field' + (full ? ' full' : '');
    const empty = !val;
    div.innerHTML = `
      <label>${label}</label>
      <span class="${empty ? 'empty-val' : ''}">${empty ? 'Not provided' : esc(val)}</span>
    `;
    grid.appendChild(div);
  });

  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  modalDelete.onclick = async () => {
    if (confirm(`Delete ${m.firstName} ${m.lastName}? This cannot be undone.`)) {
      await deleteMember(m.id);
    }
  };
}

function closeModal() {
  modal.hidden = true;
  activeModal  = null;
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── EXPORT CSV ───────────────────────────────────────────────
document.getElementById('exportBtn').addEventListener('click', () => {
  if (members.length === 0) { alert('No member records to export.'); return; }

  const headers = [
    'ID','First Name','Last Name','Student ID','Email','Phone',
    'Emergency Name','Emergency Number','Games','Payment Method',
    'Payment Date','Registered At','Message'
  ];

  const rows = members.map(m => [
    m.id, m.firstName, m.lastName, m.studentId, m.email, m.phone,
    m.emergencyName, m.emergencyNumber, m.games, paymentLabel(m.paymentMethod),
    m.paymentDate, m.submittedAt, m.message
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`));

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `ttg-members-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

if (window.FirebaseAPI?.isConfigured?.()) {
  window.FirebaseAPI.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        await unlock();
      } catch {
        loginScreen.hidden = false;
        dashboard.hidden = true;
      }
    } else {
      loginScreen.hidden = false;
      dashboard.hidden = true;
    }
  });
}

