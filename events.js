function formatDate(value) {
  if (!value) return 'Date TBC';
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-AU', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function renderEvents(events) {
  const list = document.getElementById('eventsList');
  const empty = document.getElementById('eventsEmpty');
  if (!list || !empty) return;

  const sortedEvents = events.slice().sort((a, b) => {
    const aDate = new Date(a.date || '9999-12-31').getTime();
    const bDate = new Date(b.date || '9999-12-31').getTime();
    return aDate - bDate;
  });

  if (sortedEvents.length === 0) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  list.innerHTML = '';

  sortedEvents.forEach(event => {
    const card = document.createElement('article');
    card.className = 'event-card';
    card.innerHTML = `
      ${event.image ? `<img class="event-image" src="${esc(event.image)}" alt="${esc(event.title)}" />` : ''}
      <div class="event-body">
        <div class="event-date">${esc(formatDate(event.date))}</div>
        <h3 class="event-title">${esc(event.title)}</h3>
        <p class="event-meta">🕒 ${esc(event.time || 'Time TBC')}</p>
        <p class="event-meta">📍 ${esc(event.location || 'Location TBC')}</p>
        <p class="event-desc">${esc(event.description || '')}</p>
      </div>
    `;
    list.appendChild(card);
  });
}

async function loadEvents() {
  if (!window.FirebaseAPI?.isConfigured?.()) {
    renderEvents([]);
    return;
  }
  try {
    const all = await window.FirebaseAPI.listEvents();
    const visible = all.filter((event) => (event.status || 'upcoming') !== 'archived');
    renderEvents(visible);
  } catch (error) {
    console.error('Failed to load events:', error);
    renderEvents([]);
  }
}

loadEvents();
