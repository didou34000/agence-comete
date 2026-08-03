/* =============================================================
   L'AGENCE DU SUD, comportements
   -------------------------------------------------------------
   Doctrine : le CSS s'occupe de l'apparence et des apparitions au
   défilement (`animation-timeline: view()`). Le JavaScript ne gère
   que ce qui a besoin d'un état : le menu, le carrousel, la FAQ,
   le formulaire. Tout est facultatif, sans JS, la page reste
   entièrement lisible et le formulaire fonctionne toujours.
   ============================================================= */

/* -------------------------------------------------------------
   L'adresse qui reçoit le formulaire se règle à UN SEUL endroit :
   l'attribut `action` du formulaire, dans index.html. Le script la
   relit ici, il n'y a donc rien à tenir en double.

   Elle doit être en https : Chrome désactive le remplissage
   automatique des champs sur tout formulaire qui poste vers un
   schéma non sécurisé, `mailto:` compris.

   Sans JavaScript, le navigateur poste directement vers cette
   adresse et Formspree affiche sa page de confirmation.
   ------------------------------------------------------------- */
const MAIL_CONTACT = 'bonjour@lagencedusud.com';

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

/* ===== Fenêtre navigateur : le visiteur choisit ce qu'il regarde =====
   Rien ne bouge tout seul. Une image qui changeait toutes les cinq
   secondes juste à côté du paragraphe d'accroche captait l'attention
   par réflexe, en plein milieu de la lecture. On la laisse fixe et on
   donne la main : une pastille par site, sous la fenêtre.           */
const vues = $$('[data-vue]');
const urlVue = $('#urlVue');
const badgeDemo = $('#badgeDemo');
const fenetre = $('.fenetre');

if (vues.length > 1 && fenetre) {
  // Les captures sont chargées à la demande, pas toutes au premier affichage.
  const charger = el => {
    if (!el) return;
    $$('source[data-srcset]', el.parentElement).forEach(s => {
      if (s.dataset.srcset && !s.srcset) { s.srcset = s.dataset.srcset; }
    });
    if (el.dataset.src && !el.getAttribute('src')) el.src = el.dataset.src;
  };

  const puces = document.createElement('div');
  puces.className = 'fenetre__puces';
  puces.setAttribute('role', 'tablist');
  puces.setAttribute('aria-label', 'Choisir le site à afficher');

  const montrer = i => {
    vues.forEach((v, n) => {
      v.toggleAttribute('data-actif', n === i);
      puces.children[n].setAttribute('aria-selected', String(n === i));
      puces.children[n].tabIndex = n === i ? 0 : -1;
    });
    const vue = vues[i];
    charger(vue);
    if (urlVue && vue.dataset.url) urlVue.textContent = vue.dataset.url;
    badgeDemo?.toggleAttribute('data-visible', vue.hasAttribute('data-demo'));
  };

  vues.forEach((vue, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', vue.dataset.url || `Site ${i + 1}`);
    b.addEventListener('click', () => montrer(i));
    // on précharge au survol : le clic paraît instantané
    b.addEventListener('pointerenter', () => charger(vue));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const suiv = (i + d + vues.length) % vues.length;
      montrer(suiv);
      puces.children[suiv].focus();
    });
    puces.appendChild(b);
  });

  fenetre.after(puces);
  montrer(0);
}

/* ===== FAQ =====
   Plusieurs questions peuvent rester ouvertes en même temps. Refermer
   les autres au premier clic aurait effacé les trois réponses affichées
   d'emblée, et obligerait à rouvrir pour comparer deux réponses.       */

/* ===== Formulaire de contact ===== */
const form = $('#formContact');
if (form) {
  // On lit l'attribut, pas la propriété : sans `action`, `form.action`
  // renvoie l'adresse de la page et on croirait à un point d'envoi.
  const cible = form.getAttribute('action') || '';
  const POINT_ENVOI = /^https:\/\//.test(cible) ? cible : '';

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
    if (donnees.get('_gotcha')) return;         // pot de miel anti-robot

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
      dire('');
      // Le formulaire s'efface au profit du panneau de confirmation :
      // une ligne de texte ne marque pas assez le passage à l'étape suivante.
      $('.formulaire__succes', form)?.removeAttribute('hidden');
      form.setAttribute('data-envoye', '');
    } catch {
      dire('L’envoi a échoué. Écrivez-nous directement à ' + MAIL_CONTACT + '.', 'ko');
    } finally {
      bouton?.removeAttribute('aria-busy');
      if (bouton && libelleBouton) bouton.textContent = libelleBouton;
    }
  });
}
