/* ═══════════════════════════════════════════════════════════════
   TTG ADMIN DASHBOARD — SCRIPT
═══════════════════════════════════════════════════════════════ */

const ADMIN_PASSWORD = 'TTGadmin2026';
const STORAGE_KEY    = 'ttg_members';

// ── STATE ────────────────────────────────────────────────────
let members      = [];
let filtered     = [];
let sortKey      = 'submittedAt';
let sortDir      = -1; // -1 = desc, 1 = asc
let activeModal  = null;

// ── LOGIN ────────────────────────────────────────────────────
const loginScreen  = document.getElementById('loginScreen');
const dashboard    = document.getElementById('dashboard');
const loginForm    = document.getElementById('loginForm');
const loginError   = document.getElementById('loginError');

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const pw = document.getElementById('adminPassword').value;
  if (pw === ADMIN_PASSWORD) {
    unlock();
  } else {
    loginError.textContent = 'Incorrect password. Please try again.';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
});

function unlock() {
  loginScreen.hidden = true;
  dashboard.hidden   = false;
  loadMembers();
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  loginScreen.hidden = false;
  dashboard.hidden   = true;
  document.getElementById('adminPassword').value = '';
  loginError.textContent = '';
});

// ── DATA ─────────────────────────────────────────────────────
function loadMembers() {
  members = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  applyFilters();
  renderStats();
}

function saveMembers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
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
    if (game && !m.games.includes(game)) return false;
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
    tr.querySelector('.btn-row-delete').addEventListener('click', e => {
      e.stopPropagation();
      if (confirm(`Delete ${m.firstName} ${m.lastName}? This cannot be undone.`)) {
        deleteMember(m.id);
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
function deleteMember(id) {
  members = members.filter(m => m.id !== id);
  saveMembers();
  loadMembers();
  if (activeModal === id) closeModal();
}

document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (members.length === 0) return;
  if (confirm(`Delete ALL ${members.length} member records? This cannot be undone.`)) {
    localStorage.removeItem(STORAGE_KEY);
    loadMembers();
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

  modalDelete.onclick = () => {
    if (confirm(`Delete ${m.firstName} ${m.lastName}? This cannot be undone.`)) {
      deleteMember(m.id);
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
