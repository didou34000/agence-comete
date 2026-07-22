const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ===== Menu burger (mobile) ===== */
const burger = document.querySelector('.burger');
const nav = document.getElementById('menu');
if (burger && nav) {
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ===== Révélation au scroll ===== */
const revealTargets = document.querySelectorAll(
  '.section-title, .section-kicker, .section-intro, .stat, .service, .card, .options, ' +
  '.tl-step, .france-text, .france-visual, .duo-card, .work, .quote, .faq details, ' +
  '.contact-infos, .contact-form'
);

if (!reduceMotion) {
  revealTargets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('visible');
        observer.unobserve(el);
        // Une fois l'animation terminée (700 ms + délai en cascade éventuel),
        // on retire les classes pour rendre la main aux transitions de survol
        const delay = parseFloat(el.style.transitionDelay) || 0;
        setTimeout(() => {
          el.classList.remove('reveal', 'visible');
          el.style.transitionDelay = '';
        }, 750 + delay + 250);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(el => observer.observe(el));

  // Décalage en cascade pour les grilles
  document.querySelectorAll('.cards, .portfolio-grid, .services, .quotes, .stats').forEach(grid => {
    [...grid.children].forEach((child, i) => {
      child.style.transitionDelay = `${i * 90}ms`;
    });
  });
}

/* ===== Compteurs animés ===== */
const counters = document.querySelectorAll('[data-count]');
const easeOut = t => 1 - Math.pow(1 - t, 3);

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    counterObserver.unobserve(el);
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion) {
      el.textContent = target.toLocaleString('fr-FR');
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOut(p) * target).toLocaleString('fr-FR');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });

counters.forEach(el => counterObserver.observe(el));

/* ===== Effet 3D au survol des cartes =====
   Les durées de transition vivent en CSS (.tilting) : le JS ne touche
   qu'au transform, pour ne pas écraser les transitions de box-shadow
   ni celles du reveal. */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.card, .service, .work, .duo-card').forEach(el => {
    el.addEventListener('mousemove', e => {
      if (el.classList.contains('reveal')) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add('tilting');
      el.style.transform =
        `perspective(700px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.classList.remove('tilting');
      el.style.transform = '';
    });
  });

  /* Boutons magnétiques */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      btn.style.translate = `${(x * 8).toFixed(1)}px ${(y * 6).toFixed(1)}px`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.translate = ''; });
  });
}

/* ===== Hero : le mot qui alterne =====
   Boucle auto-replanifiée (pas de setInterval) : deux cycles ne peuvent pas
   se chevaucher, et le mot ne peut jamais rester invisible. */
const swapWord = document.getElementById('swapWord');
if (swapWord && !reduceMotion) {
  const words = ['parler', 'cliquer', 'rêver', 'briller'];
  const PAUSE = 2600, SLIDE = 300;
  let wi = 0;

  const cycle = () => {
    if (document.hidden) { setTimeout(cycle, PAUSE); return; }
    swapWord.classList.add('out');
    setTimeout(() => {
      wi = (wi + 1) % words.length;
      swapWord.textContent = words[wi];
      swapWord.classList.remove('out');   // seul état à annuler, jamais bloquant
      setTimeout(cycle, PAUSE);
    }, SLIDE);
  };
  setTimeout(cycle, PAUSE);

  // Filet de sécurité si l'onglet change pendant une transition
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) swapWord.classList.remove('out');
  });
}

/* ===== Hero : réalisations et démos défilent dans la fenêtre navigateur =====
   Les visuels sont chargés au fil de l'eau (data-src) pour ne pas peser
   sur le premier affichage. */
const shots = [...document.querySelectorAll('.browser-screen .shot')];
const heroUrl = document.getElementById('heroUrl');
const heroDemo = document.querySelector('.browser-demo');

if (shots.length > 1 && !reduceMotion) {
  const DELAY = 3800;
  let si = 0;

  const load = el => {
    if (el && el.dataset.src) {
      el.src = el.dataset.src;
      el.removeAttribute('data-src');
    }
  };

  const nextShot = () => {
    if (document.hidden) { setTimeout(nextShot, DELAY); return; }
    shots[si].classList.remove('is-on');
    si = (si + 1) % shots.length;
    const cur = shots[si];
    load(cur);
    cur.classList.add('is-on');
    if (heroUrl && cur.dataset.url) heroUrl.textContent = cur.dataset.url;
    if (heroDemo) heroDemo.classList.toggle('show', cur.hasAttribute('data-demo'));
    load(shots[(si + 1) % shots.length]);   // on prépare la suivante
    setTimeout(nextShot, DELAY);
  };

  load(shots[1]);
  setTimeout(nextShot, DELAY);
}

/* ===== Barre de progression de lecture + bouton retour en haut ===== */
const progressBar = document.getElementById('progress');
const toTop = document.getElementById('toTop');

const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  if (progressBar) progressBar.style.width = (ratio * 100).toFixed(2) + '%';
  if (toTop) toTop.classList.toggle('show', window.scrollY > 900);
};

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
onScroll();

if (toTop) {
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

/* ===== FAQ : une seule question ouverte à la fois ===== */
const faqItems = document.querySelectorAll('.faq details');
faqItems.forEach(d => {
  d.addEventListener('toggle', () => {
    if (d.open) faqItems.forEach(other => { if (other !== d) other.open = false; });
  });
});

/* ===== Formulaire : ouvre le mail prérempli =====
   Pour un envoi sans logiciel de mail, créez un formulaire gratuit sur
   formspree.io et remplacez ce gestionnaire par :
   <form action="https://formspree.io/f/VOTRE_ID" method="POST"> */
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const subject = `[Maquette offerte] ${data.get('besoin')} · ${data.get('nom')}`;
    const body = [
      `Nom : ${data.get('nom')}`,
      `Email : ${data.get('email')}`,
      `Téléphone : ${data.get('tel') || 'non renseigné'}`,
      `Besoin : ${data.get('besoin')}`,
      '',
      data.get('message')
    ].join('\n');

    let url = `mailto:bonjour@agence-comete.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Les liens mailto trop longs sont ignorés par certains systèmes :
    // au-delà du seuil, on copie le message et on ouvre un brouillon court
    if (url.length > 1800) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(body).catch(() => {});
      }
      const hint = form.querySelector('.form-hint');
      if (hint) hint.textContent = 'Votre message était long : il a été copié, collez-le dans le brouillon qui s’ouvre.';
      const shortBody = 'Bonjour,\n\n(Message copié automatiquement : collez-le ici.)';
      url = `mailto:bonjour@agence-comete.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shortBody)}`;
    }

    window.location.href = url;
  });
}
