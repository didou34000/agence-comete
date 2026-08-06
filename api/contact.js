/* =============================================================
   Réception du formulaire de contact.

   Trois transports, essayés dans cet ordre, selon les variables
   d'environnement présentes dans Vercel :

     1. RESEND_API_KEY   → Resend, avec accusé de réception
     2. SMTP_PASS        → SMTP OVH, avec accusé de réception
     3. rien             → transmission à Formspree, sans accusé

   Le troisième cas existe pour que le formulaire continue de marcher
   tant que rien n'est configuré : aucune fenêtre pendant laquelle le
   site perd des demandes. Dès qu'une clé est posée, l'accusé de
   réception s'active tout seul, sans rien changer au code.

   Variables du transport SMTP :
     SMTP_HOST  smtp-relay.brevo.com  (défaut : ssl0.ovh.net)
     SMTP_PORT  587                   (défaut : 465, TLS implicite)
     SMTP_USER  le login du relais    (défaut : l'adresse de l'agence)
     SMTP_PASS  la clé SMTP           ← le seul vrai secret
     MAIL_FROM  facultatif, pour forcer l'adresse d'expédition

   Deux limites connues, verifiees :
   - Resend, plan gratuit : UN seul domaine, et southconciergerie.fr
     occupe la place avec des envois en production.
   - OVH sur lagencedusud.com : offre en redirection seule, aucun compte
     e-mail, donc aucun mot de passe SMTP a donner.
   D'ou Brevo, dont le relais est gratuit jusqu'a 300 envois par jour.
   ============================================================= */

const DESTINATAIRE = 'bonjour@lagencedusud.com';
const EXPEDITEUR = "L'Agence du Sud <bonjour@lagencedusud.com>";
const FORMSPREE = 'https://formspree.io/f/xwvggeev';
const TELEPHONE = '07 67 37 70 14';

/* --- Utilitaires --- */

const echapper = (v) =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Un en-tête ne doit jamais contenir de saut de ligne : c'est par là qu'on
// injecte un destinataire caché dans un mail.
const propre = (v, max = 200) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim().slice(0, max);

const emailValide = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);

/* Découpe un corps multipart/form-data en champs texte. Le formulaire n'a
   aucun fichier à envoyer, donc pas besoin d'aller plus loin. C'est ce que
   produit `new FormData(form)` côté navigateur, et l'oublier faisait
   arriver tous les champs vides. */
function lireMultipart(brut, type) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(type);
  if (!m) return {};
  const sep = '--' + (m[1] || m[2]).trim();
  const champs = {};
  for (const bloc of brut.split(sep)) {
    const coupe = bloc.indexOf('\r\n\r\n');
    if (coupe < 0) continue;
    const nom = /name="([^"]*)"/i.exec(bloc.slice(0, coupe));
    if (!nom) continue;
    champs[nom[1]] = bloc.slice(coupe + 4).replace(/\r\n$/, '');
  }
  return champs;
}

async function lireCorps(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const brut = typeof req.body === 'string' ? req.body : await new Promise((resolve, reject) => {
    let d = '';
    req.on('data', (c) => { d += c; if (d.length > 100_000) req.destroy(); });
    req.on('end', () => resolve(d));
    req.on('error', reject);
  });
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) { try { return JSON.parse(brut); } catch { return {}; } }
  if (type.includes('multipart/form-data')) return lireMultipart(brut, type);
  return Object.fromEntries(new URLSearchParams(brut));
}

/* --- Contenu des deux messages --- */

function messages(d) {
  const lignes = [
    ['Nom', d.nom],
    ['Email', d.email],
    ['Téléphone', d.tel || 'non renseigné'],
    ['Besoin', d.besoin || 'non précisé'],
  ];
  const tableau = lignes
    .map(([k, v]) => `<tr><td style="padding:4px 14px 4px 0;color:#6E6459">${k}</td>`
                   + `<td style="padding:4px 0;color:#17130E"><b>${echapper(v)}</b></td></tr>`)
    .join('');
  const projet = d.message
    ? `<p style="margin:18px 0 0;white-space:pre-wrap;color:#17130E">${echapper(d.message)}</p>`
    : `<p style="margin:18px 0 0;color:#6E6459">Aucun message, à rappeler.</p>`;

  const pourMoi = {
    sujet: `Demande de maquette · ${propre(d.nom, 60)}`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.55">
      <p style="margin:0 0 14px;color:#6E6459">Nouvelle demande depuis lagencedusud.com</p>
      <table style="border-collapse:collapse">${tableau}</table>${projet}
    </div>`,
    texte: lignes.map(([k, v]) => `${k} : ${v}`).join('\n') + '\n\n' + (d.message || '(aucun message)'),
  };

  const pourLui = {
    sujet: 'Votre demande est bien arrivée · L’Agence du Sud',
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#17130E">
      <p style="margin:0 0 16px">Bonjour ${echapper(propre(d.nom, 60).split(' ')[0] || '')},</p>
      <p style="margin:0 0 16px">Votre message est bien arrivé. Je le lis moi-même, et je vous réponds
      sous 24&nbsp;heures les jours ouvrés, avec un premier avis sur votre projet et un créneau pour
      se parler.</p>
      <p style="margin:0 0 16px">Si c’est pressé, le plus simple reste le téléphone :
      <a href="tel:+33767377014" style="color:#1730D6">${TELEPHONE}</a>.</p>
      <p style="margin:0 0 6px">À très vite,</p>
      <p style="margin:0;color:#6E6459">Dorian · L’Agence du Sud, Montpellier<br>
      <a href="https://lagencedusud.com" style="color:#1730D6">lagencedusud.com</a></p>
    </div>`,
    texte: `Bonjour,\n\nVotre message est bien arrivé. Je le lis moi-même et je vous réponds sous 24 heures `
         + `les jours ouvrés, avec un premier avis et un créneau pour se parler.\n\n`
         + `Si c'est pressé : ${TELEPHONE}\n\nDorian, L'Agence du Sud, Montpellier\nhttps://lagencedusud.com`,
  };

  return { pourMoi, pourLui };
}

/* --- Transports --- */

async function parResend(d) {
  const { pourMoi, pourLui } = messages(d);
  const envoyer = (corps) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(corps),
  });

  const r1 = await envoyer({
    from: process.env.RESEND_FROM || EXPEDITEUR,
    to: [DESTINATAIRE],
    reply_to: d.email,
    subject: pourMoi.sujet,
    html: pourMoi.html,
    text: pourMoi.texte,
  });
  if (!r1.ok) throw new Error(`resend notification ${r1.status}: ${(await r1.text()).slice(0, 200)}`);

  // L'accusé part après la notification : si c'est lui qui échoue, la
  // demande est déjà arrivée et rien n'est perdu.
  const r2 = await envoyer({
    from: process.env.RESEND_FROM || EXPEDITEUR,
    to: [d.email],
    reply_to: DESTINATAIRE,
    subject: pourLui.sujet,
    html: pourLui.html,
    text: pourLui.texte,
  });
  return { transport: 'resend', accuse: r2.ok };
}

async function parSmtp(d) {
  const { pourMoi, pourLui } = messages(d);
  const { default: nodemailer } = await import('nodemailer');
  const boite = process.env.SMTP_USER || DESTINATAIRE;
  const hote = process.env.SMTP_HOST || 'ssl0.ovh.net';
  /* Le port se déduit de l'hébergeur quand il n'est pas donné : OVH sert
     le TLS implicite sur 465, la quasi-totalité des relais (Brevo,
     Mailjet, Sendgrid) écoutent en STARTTLS sur 587. Fixer 465 pour tout
     le monde faisait échouer la connexion sans rien dire d'utile. */
  const port = Number(process.env.SMTP_PORT || (/ovh\.net$/i.test(hote) ? 465 : 587));
  const transport = nodemailer.createTransport({
    host: hote,
    port,
    // 465 parle TLS d'entrée de jeu ; 587 démarre en clair puis passe en
    // STARTTLS. Figer `true` interdisait tout relais sur 587, dont Brevo.
    secure: port === 465,
    auth: { user: boite, pass: process.env.SMTP_PASS },
  });

  /* Qui expédie.

     Chez OVH, l'identifiant de connexion EST une adresse du domaine, et
     le serveur refuse tout From qui ne lui correspond pas : on envoie
     donc sous cette adresse-là.

     Chez un relais comme Brevo, l'identifiant ressemble à
     b48099001@smtp-brevo.com : ce n'est pas une adresse d'expédition,
     c'est un login. On envoie alors sous l'adresse de l'agence, qui doit
     être déclarée comme expéditeur vérifié chez le relais.

     MAIL_FROM tranche à la main si besoin. */
  const expediteur = process.env.MAIL_FROM
    || (boite.endsWith('@lagencedusud.com') ? boite : DESTINATAIRE);
  const de = `L'Agence du Sud <${expediteur}>`;

  await transport.sendMail({
    from: de, to: DESTINATAIRE, replyTo: d.email,
    subject: pourMoi.sujet, html: pourMoi.html, text: pourMoi.texte,
  });
  let accuse = true;
  try {
    await transport.sendMail({
      from: de, to: d.email, replyTo: DESTINATAIRE,
      subject: pourLui.sujet, html: pourLui.html, text: pourLui.texte,
    });
  } catch { accuse = false; }
  return { transport: 'smtp', accuse };
}

async function parFormspree(d) {
  const r = await fetch(FORMSPREE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(d),
  });
  if (!r.ok) throw new Error(`formspree ${r.status}`);
  return { transport: 'formspree', accuse: false };
}

/* --- Point d'entrée --- */

export default async function handler(req, res) {
  /* Point de diagnostic : dit par où partiraient les messages, sans rien
     envoyer. Ne renvoie aucun secret, seulement la présence des réglages
     et l'identifiant de connexion, qui n'est pas un mot de passe.
     Sert à répondre en deux secondes à « pourquoi je ne reçois rien ». */
  if (req.method === 'GET' && /[?&]diagnostic=1/.test(req.url || '')) {
    const transport = process.env.RESEND_API_KEY ? 'resend'
                    : process.env.SMTP_PASS ? 'smtp'
                    : 'formspree';
    return res.status(200).json({
      transport,
      accuseDeReception: transport !== 'formspree',
      reglages: {
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        SMTP_PASS: !!process.env.SMTP_PASS,
        SMTP_HOST: process.env.SMTP_HOST || '(défaut : ssl0.ovh.net)',
        SMTP_PORT: process.env.SMTP_PORT || '(défaut : 465)',
        SMTP_USER: process.env.SMTP_USER || '(défaut : ' + DESTINATAIRE + ')',
        MAIL_FROM: process.env.MAIL_FROM || '(déduit)',
      },
      destinataire: DESTINATAIRE,
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, erreur: 'Méthode non autorisée.' });
  }

  let d;
  try { d = await lireCorps(req); } catch { d = null; }
  if (!d) return res.status(400).json({ ok: false, erreur: 'Requête illisible.' });

  // Pot de miel : un robot remplit tous les champs, un humain ne voit pas
  // celui-là. On répond 200 pour ne rien lui apprendre.
  if (propre(d._gotcha)) return res.status(200).json({ ok: true });

  const donnees = {
    nom: propre(d.nom, 120),
    email: propre(d.email, 160),
    tel: propre(d.tel, 40),
    besoin: propre(d.besoin, 120),
    message: String(d.message == null ? '' : d.message).slice(0, 5000),
  };

  if (!donnees.nom) return res.status(400).json({ ok: false, erreur: 'Il manque votre nom.' });
  if (!emailValide(donnees.email)) {
    return res.status(400).json({ ok: false, erreur: 'Cette adresse email ne semble pas valide.' });
  }

  // Sans JavaScript, le navigateur poste le formulaire lui-même et attend
  // une page, pas du JSON. On le renvoie alors vers /merci.
  const veutJson = (req.headers.accept || '').includes('application/json');

  try {
    let r;
    if (process.env.RESEND_API_KEY) r = await parResend(donnees);
    else if (process.env.SMTP_PASS) r = await parSmtp(donnees);
    else r = await parFormspree(donnees);
    if (!veutJson) { res.setHeader('Location', '/merci'); return res.status(303).end(); }
    return res.status(200).json({ ok: true, ...r });
  } catch (e) {
    console.error('contact:', e && e.message);
    const erreur = `L’envoi a échoué. Écrivez directement à ${DESTINATAIRE} ou appelez le ${TELEPHONE}.`;
    if (!veutJson) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(502).end(
        `<!doctype html><meta charset="utf-8"><title>Envoi impossible</title>`
        + `<p style="font:16px/1.6 system-ui;max-width:34rem;margin:3rem auto;padding:0 1rem">${erreur} `
        + `<a href="/#contact">Revenir au formulaire</a></p>`);
    }
    return res.status(502).json({ ok: false, erreur });
  }
}
