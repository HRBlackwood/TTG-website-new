(function () {
  const config = window.TTG_FIREBASE_CONFIG || {};
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];

  function isConfigured() {
    return required.every((k) => typeof config[k] === 'string' && config[k].trim().length > 0);
  }

  function ensureConfigured() {
    if (!isConfigured()) {
      throw new Error('Firebase is not configured. Update firebase-config.js.');
    }
  }

  function normalizeDoc(doc) {
    return { id: doc.id, ...doc.data() };
  }

  function toIsoDateSafe(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  }

  if (isConfigured() && !firebase.apps.length) {
    firebase.initializeApp(config);
  }

  const auth = () => firebase.auth();
  const db = () => firebase.firestore();

  async function ensureAdminAccess() {
    ensureConfigured();
    const user = auth().currentUser;
    if (!user) throw new Error('Admin sign-in required.');
    const adminDoc = await db().collection('admins').doc(user.uid).get();
    if (!adminDoc.exists || !adminDoc.data()?.active) {
      throw new Error('Account is not an active admin.');
    }
    return user;
  }

  async function saveEvent(event) {
    ensureConfigured();
    await ensureAdminAccess();
    const payload = {
      title: event.title || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      image: event.image || '',
      description: event.description || '',
      status: event.status || 'upcoming',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (event.id) {
      await db().collection('events').doc(String(event.id)).set(payload, { merge: true });
      return { id: String(event.id) };
    }
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await db().collection('events').add(payload);
    return { id: ref.id };
  }

  window.FirebaseAPI = {
    isConfigured,

    async signInAdmin(email, password) {
      ensureConfigured();
      await auth().signInWithEmailAndPassword(email, password);
      await ensureAdminAccess();
      return { ok: true };
    },

    async signOutAdmin() {
      ensureConfigured();
      await auth().signOut();
    },

    onAuthStateChanged(callback) {
      ensureConfigured();
      return auth().onAuthStateChanged(callback);
    },

    getCurrentUser() {
      ensureConfigured();
      return auth().currentUser;
    },

    async createMembership(member) {
      ensureConfigured();
      const payload = {
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        studentId: member.studentId || '',
        phone: member.phone || '',
        email: member.email || '',
        emergencyName: member.emergencyName || '',
        emergencyNumber: member.emergencyNumber || '',
        games: member.games || '',
        paymentMethod: member.paymentMethod || '',
        paymentDate: member.paymentDate || '',
        message: member.message || '',
        submittedAt: member.submittedAt || new Date().toISOString(),
      };
      const ref = await db().collection('memberships').add(payload);
      return { id: ref.id };
    },

    async listMemberships() {
      ensureConfigured();
      await ensureAdminAccess();
      const snap = await db().collection('memberships').get();
      const members = snap.docs.map(normalizeDoc);
      members.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return members;
    },

    async deleteMembership(id) {
      ensureConfigured();
      await ensureAdminAccess();
      await db().collection('memberships').doc(String(id)).delete();
    },

    async clearMemberships() {
      ensureConfigured();
      await ensureAdminAccess();
      const snap = await db().collection('memberships').get();
      const batch = db().batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    },

    async importMemberships(members) {
      ensureConfigured();
      await ensureAdminAccess();
      const existing = await db().collection('memberships').get();
      const existingKeys = new Set(
        existing.docs.map((doc) => {
          const data = doc.data();
          return `${(data.email || '').toLowerCase()}::${toIsoDateSafe(data.submittedAt)}`;
        }),
      );

      let imported = 0;
      for (const member of members) {
        const key = `${String(member.email || '').toLowerCase()}::${toIsoDateSafe(member.submittedAt)}`;
        if (existingKeys.has(key)) continue;
        await db().collection('memberships').add({
          ...member,
          submittedAt: member.submittedAt || new Date().toISOString(),
        });
        imported += 1;
      }
      return { imported };
    },

    async listEvents() {
      ensureConfigured();
      const snap = await db().collection('events').get();
      const events = snap.docs.map(normalizeDoc);
      events.sort((a, b) => {
        const da = new Date(a.date || '9999-12-31').getTime();
        const dbb = new Date(b.date || '9999-12-31').getTime();
        return da - dbb;
      });
      return events;
    },

    saveEvent,

    async deleteEvent(id) {
      ensureConfigured();
      await ensureAdminAccess();
      await db().collection('events').doc(String(id)).delete();
    },

    async importEvents(events) {
      ensureConfigured();
      await ensureAdminAccess();
      const existing = await db().collection('events').get();
      const keys = new Set(
        existing.docs.map((doc) => {
          const data = doc.data();
          return `${data.title || ''}::${data.date || ''}::${data.time || ''}`;
        }),
      );
      let imported = 0;
      for (const event of events) {
        const key = `${event.title || ''}::${event.date || ''}::${event.time || ''}`;
        if (keys.has(key)) continue;
        await saveEvent(event);
        imported += 1;
      }
      return { imported };
    },

    async getSiteContent() {
      ensureConfigured();
      const doc = await db().collection('siteContent').doc('primary').get();
      return doc.exists ? doc.data() : {};
    },

    async saveSiteContent(content) {
      ensureConfigured();
      await ensureAdminAccess();
      await db().collection('siteContent').doc('primary').set({
        ...content,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    },

    async resetSiteContent() {
      ensureConfigured();
      await ensureAdminAccess();
      await db().collection('siteContent').doc('primary').delete();
    },
  };
})();
