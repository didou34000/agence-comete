/* ══════════════════════════════════════════════════════════════════════
   CONSENTEMENT — bandeau, et chargement conditionnel de Google Analytics

   Parti pris : blocage préalable strict. Tant que le visiteur n'a pas
   cliqué « Accepter », RIEN de Google n'est chargé — pas de gtag.js, pas
   une requête, pas un cookie. On ne se contente pas du mode consentement
   de Google, qui charge quand même le script : ici le <script> n'est
   inséré qu'après le clic.

   C'est la lecture stricte de ce qu'attend la CNIL pour une mesure
   d'audience non exemptée, et surtout la seule qui permette d'écrire la
   vérité dans la politique de confidentialité : un visiteur qui refuse,
   ou qui ne clique rien, n'a effectivement aucun cookie.

   Refuser est exactement aussi accessible qu'accepter : deux boutons de
   même taille, côte à côte, même niveau de contraste. La CNIL l'exige,
   et un bandeau qui piège est de toute façon un mauvais bandeau.
   ══════════════════════════════════════════════════════════════════════ */

(() => {
  const MESURE = 'G-NRC77XVWCL';
  const CLE    = 'lads-consentement';       // 'oui' | 'non'
  const $ = (s, r = document) => r.querySelector(s);

  /* localStorage peut jeter : navigation privée, cookies bloqués par le
     navigateur, iframe restreinte. Dans le doute on considère qu'aucun
     choix n'a été fait, et on ne charge rien. */
  const lire = () => { try { return localStorage.getItem(CLE); } catch { return null; } };
  const ecrire = v => { try { localStorage.setItem(CLE, v); } catch { /* tant pis */ } };

  function chargerAnalytics() {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied',
      ad_personalization: 'denied', analytics_storage: 'granted'
    });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MESURE;
    document.head.appendChild(s);
    gtag('js', new Date());
    /* anonymize_ip est implicite en GA4, mais on le dit : la politique
       de confidentialité l'affirme, autant que le code le montre. */
    gtag('config', MESURE, { anonymize_ip: true });
  }

  /* Efface les cookies posés par une visite précédente où l'on avait
     accepté : sans ça, « je change d'avis » ne changerait rien. */
  function effacerCookiesGA() {
    document.cookie.split(';').forEach(c => {
      const nom = c.split('=')[0].trim();
      if (!/^_ga/.test(nom)) return;
      const hote = location.hostname.replace(/^www\./, '');
      [location.hostname, '.' + hote, hote].forEach(d => {
        document.cookie = nom + '=; Max-Age=0; path=/; domain=' + d;
      });
      document.cookie = nom + '=; Max-Age=0; path=/';
    });
  }

  function fermer() { $('.consent')?.remove(); }

  function decider(choix) {
    ecrire(choix);
    if (choix === 'oui') chargerAnalytics(); else effacerCookiesGA();
    fermer();
  }

  function bandeau() {
    if ($('.consent')) return;
    const d = document.createElement('div');
    d.className = 'consent';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-labelledby', 'consent-t');
    d.setAttribute('aria-describedby', 'consent-d');
    d.innerHTML = `
      <div class="consent__boite">
        <p class="consent__titre" id="consent-t">Mesure d’audience</p>
        <p class="consent__texte" id="consent-d">Ce site utilise Google Analytics pour savoir quelles pages
          sont lues. Cela dépose des cookies. Sans votre accord, rien n’est chargé et aucun cookie
          n’est posé. <a href="/confidentialite">En savoir plus</a>.</p>
        <div class="consent__actions">
          <button type="button" class="btn btn--fantome" data-consent="non">Refuser</button>
          <button type="button" class="btn" data-consent="oui">Accepter</button>
        </div>
      </div>`;
    document.body.appendChild(d);
    d.querySelectorAll('[data-consent]').forEach(b =>
      b.addEventListener('click', () => decider(b.dataset.consent)));
    d.querySelector('[data-consent="non"]').focus();
  }

  const choix = lire();
  if (choix === 'oui') chargerAnalytics();
  else if (choix !== 'non') bandeau();

  /* Le choix doit rester révocable : n'importe quel lien vers #cookies
     rouvre le bandeau. Il y en a un dans le pied de page. */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href$="#cookies"], [data-rouvrir-consentement]');
    if (!a) return;
    e.preventDefault();
    try { localStorage.removeItem(CLE); } catch { /* rien */ }
    bandeau();
  });
})();
