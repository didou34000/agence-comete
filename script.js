/* =============================================================
   COMÈTE — comportements
   -------------------------------------------------------------
   Doctrine : le CSS s'occupe de l'apparence et des apparitions au
   défilement (`animation-timeline: view()`). Le JavaScript ne gère
   que ce qui a besoin d'un état : le menu, le carrousel, la FAQ,
   le formulaire. Tout est facultatif — sans JS, la page reste
   entièrement lisible et le formulaire fonctionne toujours.
   ============================================================= */

/* -------------------------------------------------------------
   RÉGLAGE À FAIRE UNE FOIS : l'adresse qui reçoit le formulaire.
   Laissée vide, le formulaire ouvre le logiciel de mail (comme
   avant). Dès qu'une URL est renseignée — Formspree, Web3Forms,
   Brevo, une fonction serverless… — l'envoi se fait sans quitter
   la page, avec message de confirmation.
   Exemple : "https://formspree.io/f/xxxxxxxx"
   ------------------------------------------------------------- */
const POINT_ENVOI = '';
const MAIL_CONTACT = 'bonjour@agence-comete.fr';

const mouvementReduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ===== En-tête : état au défilement ===== */
const entete = $('.entete');
if (entete) {
  const majEntete = () => entete.toggleAttribute('data-defile', scrollY > 8);
  addEventListener('scroll', majEntete, { passive: true });
  majEntete();
}

/* ===== Menu mobile ===== */
const burger = $('.burger');
const nav = $('#menu');
if (burger && nav) {
  const fermer = () => {
    nav.removeAttribute('data-ouvert');
    burger.setAttribute('aria-expanded', 'false');
  };
  const basculer = () => {
    const ouvert = nav.toggleAttribute('data-ouvert');
    burger.setAttribute('aria-expanded', String(ouvert));
  };

  burger.addEventListener('click', basculer);
  $$('a', nav).forEach(a => a.addEventListener('click', fermer));

  addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.hasAttribute('data-ouvert')) {
      fermer();
      burger.focus();
    }
  });
  // Un clic en dehors referme, sans piéger le clic sur le bouton lui-même.
  document.addEventListener('pointerdown', e => {
    if (!nav.hasAttribute('data-ouvert')) return;
    if (!nav.contains(e.target) && !burger.contains(e.target)) fermer();
  });
  // Le menu déroulant n'a plus de raison d'être une fois en desktop.
  matchMedia('(min-width: 781px)').addEventListener('change', e => e.matches && fermer());
}

/* ===== Barre de progression + retour en haut ===== */
const progression = $('.progression');
const haut = $('.haut');
if (progression || haut) {
  let enAttente = false;
  const mesurer = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? Math.min(scrollY / max, 1) : 0;
    if (progression) progression.style.width = `${(ratio * 100).toFixed(2)}%`;
    if (haut) haut.toggleAttribute('data-visible', scrollY > innerHeight);
    enAttente = false;
  };
  addEventListener('scroll', () => {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(mesurer);
  }, { passive: true });
  mesurer();

  haut?.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: mouvementReduit ? 'auto' : 'smooth' });
  });
}

/* ===== Titre : le mot qui alterne =====
   Les mots sont empilés dans une grille : la largeur réservée est
   celle du plus long, donc la ligne du titre ne bouge jamais.      */
const mots = $$('[data-mot]');
if (mots.length > 1 && !mouvementReduit) {
  const PAUSE = 3600, GLISSE = 420;
  let i = 0;

  const tour = () => {
    if (document.hidden) return setTimeout(tour, PAUSE);
    const sortant = mots[i];
    i = (i + 1) % mots.length;
    const entrant = mots[i];

    sortant.setAttribute('data-sort', '');
    sortant.setAttribute('aria-hidden', 'true');
    entrant.removeAttribute('data-sort');
    entrant.removeAttribute('aria-hidden');

    setTimeout(tour, PAUSE + GLISSE);
  };
  setTimeout(tour, PAUSE);
}

/* ===== Fenêtre navigateur : les réalisations défilent =====
   Une seule chose bouge dans le hero : c'est celle-ci.            */
const vues = $$('[data-vue]');
const urlVue = $('#urlVue');
const badgeDemo = $('#badgeDemo');

if (vues.length > 1 && !mouvementReduit) {
  const PAUSE = 5000;
  let i = 0;

  // Charge les images au fil de l'eau plutôt qu'au premier affichage.
  const charger = el => {
    if (!el) return;
    $$('source[data-srcset]', el.parentElement).forEach(s => {
      if (s.dataset.srcset && !s.srcset) { s.srcset = s.dataset.srcset; }
    });
    if (el.dataset.src && !el.getAttribute('src')) el.src = el.dataset.src;
  };

  const suivante = () => {
    if (document.hidden) return setTimeout(suivante, PAUSE);
    vues[i].removeAttribute('data-actif');
    i = (i + 1) % vues.length;
    const vue = vues[i];
    charger(vue);
    vue.setAttribute('data-actif', '');
    if (urlVue && vue.dataset.url) urlVue.textContent = vue.dataset.url;
    badgeDemo?.toggleAttribute('data-visible', vue.hasAttribute('data-demo'));
    charger(vues[(i + 1) % vues.length]);
    setTimeout(suivante, PAUSE);
  };

  charger(vues[1]);
  setTimeout(suivante, PAUSE);
}

/* ===== FAQ : une seule question ouverte ===== */
const questions = $$('.faq details');
questions.forEach(d => d.addEventListener('toggle', () => {
  if (d.open) questions.forEach(a => { if (a !== d) a.open = false; });
}));

/* ===== Formulaire de contact ===== */
const form = $('#formContact');
if (form) {
  const etat = $('.formulaire__etat', form);
  const bouton = $('button[type="submit"]', form);
  const libelleBouton = bouton?.textContent;

  const dire = (message, ton) => {
    if (!etat) return;
    etat.textContent = message;
    if (ton) etat.setAttribute('data-ton', ton); else etat.removeAttribute('data-ton');
  };

  const versMailto = donnees => {
    const sujet = `[Maquette offerte] ${donnees.get('besoin')} · ${donnees.get('nom')}`;
    const corps = [
      `Nom : ${donnees.get('nom')}`,
      `Email : ${donnees.get('email')}`,
      `Téléphone : ${donnees.get('tel') || 'non renseigné'}`,
      `Besoin : ${donnees.get('besoin')}`,
      '',
      donnees.get('message')
    ].join('\n');

    let url = `mailto:${MAIL_CONTACT}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    // Certains systèmes ignorent les mailto trop longs : on copie le
    // message et on n'ouvre qu'un brouillon court.
    if (url.length > 1800) {
      navigator.clipboard?.writeText(corps).catch(() => {});
      dire('Message long : il a été copié, collez-le dans le brouillon qui s’ouvre.', null);
      url = `mailto:${MAIL_CONTACT}?subject=${encodeURIComponent(sujet)}`
          + `&body=${encodeURIComponent('Bonjour,\n\n(Message copié automatiquement : collez-le ici.)')}`;
    } else {
      dire('Votre logiciel de mail s’ouvre avec le message prérempli.', null);
    }
    location.href = url;
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    form.setAttribute('data-touche', '');       // les champs ne rougissent qu'ici

    if (!form.reportValidity()) {
      dire('Il manque une information au-dessus.', 'ko');
      return;
    }
    const donnees = new FormData(form);
    if (donnees.get('_appat')) return;          // pot de miel anti-robot

    if (!POINT_ENVOI) return versMailto(donnees);

    bouton?.setAttribute('aria-busy', 'true');
    if (bouton) bouton.textContent = 'Envoi…';
    dire('Envoi en cours…', null);

    try {
      const reponse = await fetch(POINT_ENVOI, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: donnees
      });
      if (!reponse.ok) throw new Error(reponse.status);
      form.reset();
      form.removeAttribute('data-touche');
      dire('Message reçu. On vous répond sous 24 h, jours ouvrés.', 'ok');
    } catch {
      dire('L’envoi a échoué. Écrivez-nous directement à ' + MAIL_CONTACT + '.', 'ko');
    } finally {
      bouton?.removeAttribute('aria-busy');
      if (bouton && libelleBouton) bouton.textContent = libelleBouton;
    }
  });
}
