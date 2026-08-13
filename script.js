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
   adresse et la fonction le renvoie sur /merci.
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
const ctaMobile = $('.cta-mobile');
if (progression || haut || ctaMobile) {
  let enAttente = false;
  const mesurer = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? Math.min(scrollY / max, 1) : 0;
    if (progression) progression.style.width = `${(ratio * 100).toFixed(2)}%`;
    if (haut) haut.toggleAttribute('data-visible', scrollY > innerHeight);
    // Sous le hero, la barre d'appel n'ajoute rien : elle attend.
    if (ctaMobile) ctaMobile.toggleAttribute('data-visible', scrollY > innerHeight * 0.75);
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

/* ===== Fenêtre navigateur : les sites défilent, et on peut reprendre la main
   Une image qui changeait toutes les cinq secondes captait l'attention en
   plein milieu de la lecture. À 6,5 secondes on a le temps de regarder un
   site avant que le suivant arrive. Le défilement s'arrête dès qu'on
   survole la fenêtre, dès qu'on met le focus sur une pastille, dès qu'on
   clique, et quand l'onglet passe en arrière-plan. Il ne démarre pas du
   tout si le visiteur a demandé moins d'animations.                  */
const vues = $$('[data-vue]');
const mobiles = $$('[data-mob]');   // le téléphone, dans le même ordre que les vues
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

  let courant = 0;

  const montrer = i => {
    courant = i;                      // seul endroit qui fixe la vue affichée
    vues.forEach((v, n) => {
      v.toggleAttribute('data-actif', n === i);
      puces.children[n].setAttribute('aria-selected', String(n === i));
      puces.children[n].tabIndex = n === i ? 0 : -1;
    });
    const vue = vues[i];
    charger(vue);
    if (urlVue && vue.dataset.url) urlVue.textContent = vue.dataset.url;
    badgeDemo?.toggleAttribute('data-visible', vue.hasAttribute('data-demo'));

    // Le téléphone suit l'écran du Mac : même site, version mobile.
    if (mobiles.length === vues.length) {
      charger(mobiles[i]);
      mobiles.forEach((m, n) => m.toggleAttribute('data-actif', n === i));
    }
  };

  vues.forEach((vue, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', vue.dataset.url || `Site ${i + 1}`);
    b.addEventListener('click', () => { montrer(i); relancer(); });
    // on précharge au survol : le clic paraît instantané
    b.addEventListener('pointerenter', () => charger(vue));
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const suiv = (i + d + vues.length) % vues.length;
      montrer(suiv);
      puces.children[suiv].focus();
      relancer();
    });
    puces.appendChild(b);
  });

  /* --- Défilement automatique ---
     Il ne démarre que lorsque la fenêtre est réellement à l'écran, et
     seulement une fois la page chargée puis un moment de calme passé.
     Le faire tourner en aveugle coûtait 300 ms de blocage du fil
     principal pendant le chargement, pour une animation que personne ne
     regardait : le carrousel est en haut, on est déjà plus bas. */
  const DUREE = 6500;
  let minuteur = null, fige = false, aLEcran = true, pretADemarrer = false;

  /* On DÉCODE avant de montrer, jamais l'inverse. Afficher une image pas
     encore décodée forçait le décodage pendant le rendu, sur le fil
     principal : jusqu'à 400 ms de blocage sur un seul basculement. */
  /* Le basculement ne fait plus QUE changer un attribut, ce qui se résume
     à une transition d'opacité que le compositeur gère seul.

     Avant, chaque tour appelait `charger()`, donc réécrivait le `srcset`
     d'un <source> : le navigateur relançait la sélection de source et
     recalculait la mise en page de tout le <picture>. Mesuré en
     production : 1187 ms de calcul de style et une tâche de 501 ms, pour
     une note de performance tombée de 96 à 82. Le chargement est
     désormais fait une seule fois, au calme, avant que ça tourne. */
  const auRepos = window.requestIdleCallback || (f => setTimeout(f, 60));

  const boucle = () => {
    minuteur = null;
    if (fige || !aLEcran || document.hidden) return;
    const suiv = (courant + 1) % vues.length;
    montrer(suiv);
    // La capture d'après est préparée maintenant, dans un temps mort :
    // elle a six secondes et demie pour arriver, et son coût de mise en
    // page ne tombe jamais au moment du basculement.
    auRepos(() => charger(vues[(suiv + 1) % vues.length]), { timeout: 2000 });
    minuteur = setTimeout(boucle, DUREE);
  };
  const arreter = () => { clearTimeout(minuteur); minuteur = null; };
  const demarrer = () => {
    if (minuteur || fige || !aLEcran || !pretADemarrer || mouvementReduit || vues.length < 2) return;
    minuteur = setTimeout(boucle, DUREE);
  };
  // après une action du visiteur, on repart d'un cycle entier
  const relancer = () => { arreter(); demarrer(); };

  const geler = () => { fige = true; arreter(); };
  const degeler = () => { fige = false; demarrer(); };

  const zone = fenetre.parentElement || fenetre;
  zone.addEventListener('pointerenter', geler);
  zone.addEventListener('pointerleave', degeler);
  puces.addEventListener('pointerenter', geler);
  puces.addEventListener('pointerleave', degeler);
  puces.addEventListener('focusin', geler);
  puces.addEventListener('focusout', degeler);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) arreter(); else demarrer();
  });

  // Sous le Mac entier, pas sous la fenêtre : à l'intérieur du capot les
  // pastilles tomberaient sur le fond sombre, où elles ne se voient plus.
  (fenetre.closest('.mac') || fenetre).after(puces);
  montrer(0);

  // Hors de l'écran, le carrousel ne consomme rien.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entrees => {
      aLEcran = entrees.some(e => e.isIntersecting);
      if (aLEcran) demarrer(); else arreter();
    }, { threshold: 0.25 }).observe(fenetre);
  }

  // On attend la fin du chargement, puis un moment de calme : le premier
  // affichage a la priorité sur une image qui tourne. Les captures sont
  // alors préparées une par une, chacune dans son propre temps mort, pour
  // ne jamais enchaîner huit recalculs de mise en page d'affilée.
  const armer = () => {
    auRepos(() => {
      charger(vues[1]);          // une seule, la suivante ; le reste vient au fil de l'eau
      pretADemarrer = true;
      demarrer();
    }, { timeout: 2000 });
  };
  const auCalme = () => (window.requestIdleCallback || (f => setTimeout(f, 800)))(armer, { timeout: 3000 });
  if (document.readyState === 'complete') auCalme();
  else addEventListener('load', auCalme, { once: true });
}

/* ===== Comparateurs avant / après =====
   Le champ `range` reste dans le document pour le clavier et les lecteurs
   d'écran, mais il ne pilote plus le glissement au doigt : sur mobile, le
   navigateur consommait le geste horizontal avant que le champ ne le voie,
   et la séparation ne bougeait pas.

   On écoute donc les événements pointeur sur le cadre lui-même, ce qui
   couvre souris, doigt et stylet du même code. `setPointerCapture` garde
   le doigt attaché même s'il sort de l'image, et `touch-action: pan-y`
   laisse la page défiler verticalement pendant qu'on tire.

   Sans JavaScript, la séparation reste à 50 %, ce qui montre déjà les
   deux moitiés.                                                        */
$$('.compare__cadre').forEach(cadre => {
  const curseur = $('.compare__curseur', cadre);
  if (!curseur) return;

  const placer = valeur => {
    // Arrondi au centième : sans lui, une division de largeurs sort des
    // « 20.00000000000001% » dans la feuille de style.
    const v = Math.round(Math.max(0, Math.min(100, valeur)) * 100) / 100;
    cadre.style.setProperty('--pos', v + '%');
    curseur.value = String(Math.round(v));
  };

  const depuisPointeur = e => {
    const r = cadre.getBoundingClientRect();
    if (!r.width) return;
    placer(((e.clientX - r.left) / r.width) * 100);
  };

  let tire = false;

  cadre.addEventListener('pointerdown', e => {
    if (e.button != null && e.button !== 0) return;   // clic droit ou molette : on ignore
    tire = true;
    cadre.setPointerCapture?.(e.pointerId);
    depuisPointeur(e);
    e.preventDefault();                               // pas de sélection de texte pendant le tir
  });

  cadre.addEventListener('pointermove', e => {
    if (!tire) return;
    depuisPointeur(e);
  });

  const relacher = e => {
    if (!tire) return;
    tire = false;
    cadre.releasePointerCapture?.(e.pointerId);
  };
  cadre.addEventListener('pointerup', relacher);
  cadre.addEventListener('pointercancel', relacher);

  // Le clavier passe toujours par le champ : flèches, Début, Fin.
  curseur.addEventListener('input', () => placer(Number(curseur.value)));

  placer(Number(curseur.value));
});

/* ===== FAQ =====
   Plusieurs questions peuvent rester ouvertes en même temps. Refermer
   les autres au premier clic aurait effacé les trois réponses affichées
   d'emblée, et obligerait à rouvrir pour comparer deux réponses.       */

/* ===== Formulaire de contact ===== */
const form = $('#formContact');
if (form) {
  // On lit l'attribut, pas la propriété : sans `action`, `form.action`
  // renvoie l'adresse de la page et on croirait à un point d'envoi.
  // Accepte une adresse absolue en https, ou un chemin du site comme
  // /api/contact. Tout le reste (mailto:, vide) fait basculer sur le
  // brouillon de mail, qui reste le filet de sécurité.
  const cible = form.getAttribute('action') || '';
  const POINT_ENVOI = /^(https:\/\/|\/(?!\/))/.test(cible) ? cible : '';

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
      // On envoie du JSON, pas le FormData tel quel : `body: donnees`
      // part en multipart/form-data, un format que le point d'arrivée
      // devait décoder alors qu'on n'a aucun fichier à transmettre.
      const reponse = await fetch(POINT_ENVOI, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(donnees))
      });
      if (!reponse.ok) {
        // Notre fonction renvoie un message lisible ; un service tiers, non.
        let detail = '';
        try { detail = (await reponse.json()).erreur || ''; } catch { /* pas du JSON */ }
        throw new Error(detail || String(reponse.status));
      }
      form.reset();
      form.removeAttribute('data-touche');
      dire('');
      // Le formulaire s'efface au profit du panneau de confirmation :
      // une ligne de texte ne marque pas assez le passage à l'étape suivante.
      $('.formulaire__succes', form)?.removeAttribute('hidden');
      form.setAttribute('data-envoye', '');
    } catch (e) {
      const message = e && /\D/.test(e.message || '') ? e.message : '';
      dire(message || ('L’envoi a échoué. Écrivez-nous directement à ' + MAIL_CONTACT + '.'), 'ko');
    } finally {
      bouton?.removeAttribute('aria-busy');
      if (bouton && libelleBouton) bouton.textContent = libelleBouton;
    }
  });
}
