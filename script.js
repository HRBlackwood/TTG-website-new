/* ═══════════════════════════════════════════════════════════════
   TABLE TOP GUILD — SCRIPTS
═══════════════════════════════════════════════════════════════ */

// ── NAVBAR SCROLL EFFECT ────────────────────────────────────
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── MOBILE NAV TOGGLE ───────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
  // Animate hamburger → X
  navToggle.querySelectorAll('span')[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : '';
  navToggle.querySelectorAll('span')[1].style.opacity  = open ? '0' : '';
  navToggle.querySelectorAll('span')[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : '';
});

// Close nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.querySelectorAll('span').forEach(s => {
      s.style.transform = '';
      s.style.opacity   = '';
    });
  });
});

// ── HERO PARTICLES ──────────────────────────────────────────
(function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.classList.add('particle');
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      top:  ${20 + Math.random() * 80}%;
      width:  ${1 + Math.random() * 2.5}px;
      height: ${1 + Math.random() * 2.5}px;
      --dur:   ${6 + Math.random() * 10}s;
      --delay: ${Math.random() * 8}s;
      opacity: 0;
    `;
    container.appendChild(el);
  }
})();

// ── SCROLL REVEAL ───────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

// Add reveal class to all interesting elements
const revealSelectors = [
  '.stat-card', '.meeting-card', '.game-card',
  '.event-item', '.section-header', '.about-text',
  '.about-stats', '.meeting-info',
];

document.querySelectorAll(revealSelectors.join(', ')).forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  revealObserver.observe(el);
});

// ── GAME CARD FLIP (TOUCH/CLICK) ────────────────────────────
document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('flipped');
  });
  // Keyboard support
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', card.querySelector('h3')?.textContent + ' — click to learn more');
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.classList.toggle('flipped');
    }
  });
});

// ── FORM VALIDATION & SUBMISSION ────────────────────────────
const form        = document.getElementById('registrationForm');
const successBox  = document.getElementById('formSuccess');
const submitBtn   = document.getElementById('submitBtn');

function getVal(id) {
  return document.getElementById(id)?.value.trim() ?? '';
}

function showError(fieldId, message) {
  const errEl = document.getElementById(fieldId + 'Error');
  const input = document.getElementById(fieldId) ?? document.querySelector(`[name="${fieldId}"]`);
  if (errEl) errEl.textContent = message;
  if (input) input.classList.toggle('invalid', !!message);
}

function clearError(fieldId) {
  showError(fieldId, '');
}

// Live clear on input
['firstName','lastName','email','phone','emergencyName','emergencyNumber','paymentDate'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => clearError(id));
});
['paymentMethod'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => clearError(id));
});

function validateForm() {
  let valid = true;

  // First name
  if (!getVal('firstName')) {
    showError('firstName', 'Please enter your first name.');
    valid = false;
  } else clearError('firstName');

  // Last name
  if (!getVal('lastName')) {
    showError('lastName', 'Please enter your last name.');
    valid = false;
  } else clearError('lastName');

  // Phone
  if (!getVal('phone')) {
    showError('phone', 'Please enter your phone number.');
    valid = false;
  } else clearError('phone');

  // Email
  const email = getVal('email');
  if (!email) {
    showError('email', 'Please enter your email address.');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('email', 'Please enter a valid email address.');
    valid = false;
  } else clearError('email');

  // Emergency contact name
  if (!getVal('emergencyName')) {
    showError('emergencyName', 'Please enter an emergency contact name.');
    valid = false;
  } else clearError('emergencyName');

  // Emergency contact number
  if (!getVal('emergencyNumber')) {
    showError('emergencyNumber', 'Please enter an emergency contact number.');
    valid = false;
  } else clearError('emergencyNumber');

  // Club rules agreement
  if (!document.getElementById('rulesAgreed').checked) {
    document.getElementById('rulesAgreedError').textContent = 'You must agree to the club rules to join.';
    valid = false;
  } else {
    document.getElementById('rulesAgreedError').textContent = '';
  }

  // Payment method
  if (!document.getElementById('paymentMethod').value) {
    showError('paymentMethod', 'Please select your payment method.');
    document.getElementById('paymentMethod').classList.add('invalid');
    valid = false;
  } else {
    clearError('paymentMethod');
    document.getElementById('paymentMethod').classList.remove('invalid');
  }

  // Payment date
  if (!getVal('paymentDate')) {
    showError('paymentDate', 'Please enter the date you paid your membership fee.');
    document.getElementById('paymentDate').classList.add('invalid');
    valid = false;
  } else {
    clearError('paymentDate');
    document.getElementById('paymentDate').classList.remove('invalid');
  }

  // Communications consent
  if (!document.getElementById('consent').checked) {
    document.getElementById('consentError').textContent = 'You must agree to receive communications to join.';
    valid = false;
  } else {
    document.getElementById('consentError').textContent = '';
  }

  return valid;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    // Scroll to first error
    const firstError = form.querySelector('.invalid, .field-error:not(:empty)');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // Collect form data
  const games = [...document.querySelectorAll('input[name="games"]:checked')].map(cb => cb.value);
  const member = {
    id:              Date.now(),
    submittedAt:     new Date().toISOString(),
    firstName:       getVal('firstName'),
    lastName:        getVal('lastName'),
    studentId:       getVal('studentId'),
    phone:           getVal('phone'),
    email:           getVal('email'),
    emergencyName:   getVal('emergencyName'),
    emergencyNumber: getVal('emergencyNumber'),
    games:           games.join(', '),
    paymentMethod:   document.getElementById('paymentMethod').value,
    paymentDate:     getVal('paymentDate'),
    message:         getVal('message'),
  };

  // Save to localStorage
  const existing = JSON.parse(localStorage.getItem('ttg_members') || '[]');
  existing.push(member);
  localStorage.setItem('ttg_members', JSON.stringify(existing));

  // Simulate submission
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').textContent = 'Rolling…';
  submitBtn.querySelector('.btn-icon').textContent = '⏳';

  await new Promise(r => setTimeout(r, 1400));

  // Show success
  form.hidden = true;
  successBox.hidden = false;
  successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// ── SMOOTH ANCHOR OFFSET (for fixed nav) ────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── ACTIVE NAV HIGHLIGHT ────────────────────────────────────
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--gold-light)' : '';
        });
      }
    });
  },
  { threshold: 0.35 }
);

sections.forEach(s => sectionObserver.observe(s));
