(function () {
  const baseUrl = (window.TTG_CONVEX_URL || '').replace(/\/+$/, '');

  function ensureBaseUrl() {
    if (!baseUrl) {
      throw new Error('Convex URL not configured. Set window.TTG_CONVEX_URL in config.js');
    }
  }

  async function request(path, options) {
    ensureBaseUrl();

    const opts = options || {};
    const headers = {};
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const adminSession = sessionStorage.getItem('ttg_admin_session');
    if (opts.auth && adminSession) {
      headers['x-admin-session'] = adminSession;
    }

    const res = await fetch(baseUrl + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return data;
  }

  window.TTGApi = {
    login(password) {
      return request('/admin/login', { method: 'POST', body: { password } });
    },
    logout() {
      return request('/admin/logout', { method: 'POST', auth: true });
    },
    checkSession() {
      return request('/admin/session', { method: 'GET', auth: true });
    },

    createMember(member) {
      return request('/members', { method: 'POST', body: member });
    },
    listMembers() {
      return request('/members', { method: 'GET', auth: true });
    },
    deleteMember(id) {
      return request(`/members?id=${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
    },
    clearMembers() {
      return request('/members', { method: 'DELETE', auth: true });
    },
    importMembers(members) {
      return request('/members/import', { method: 'POST', auth: true, body: { members } });
    },

    listUpcomingEvents() {
      return request('/events', { method: 'GET' });
    },
    createUpcomingEvent(event) {
      return request('/events', { method: 'POST', auth: true, body: event });
    },
    updateUpcomingEvent(event) {
      return request('/events', { method: 'PUT', auth: true, body: event });
    },
    deleteUpcomingEvent(id) {
      return request(`/events?id=${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
    },

    getSiteContent() {
      return request('/site-content', { method: 'GET' });
    },
    saveSiteContent(content) {
      return request('/site-content', { method: 'PUT', auth: true, body: content });
    },
    resetSiteContent() {
      return request('/site-content', { method: 'DELETE', auth: true });
    },
  };
})();
