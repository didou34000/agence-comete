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

/* Reglages SMTP, calcules a un seul endroit pour que le diagnostic dise
   exactement ce que l'envoi fait. Un diagnostic qui affiche autre chose
   que la realite fait perdre plus de temps qu'il n'en gagne. */
function reglagesSmtp() {
  const hote = process.env.SMTP_HOST || 'ssl0.ovh.net';
  // OVH sert le TLS implicite sur 465 ; les relais (Brevo, Mailjet,
  // Sendgrid) ecoutent en STARTTLS sur 587.
  const port = Number(process.env.SMTP_PORT || (/ovh\.net$/i.test(hote) ? 465 : 587));
  const boite = process.env.SMTP_USER || DESTINATAIRE;
  const expediteur = process.env.MAIL_FROM
    || (boite.endsWith('@lagencedusud.com') ? boite : DESTINATAIRE);
  return { hote, port, boite, expediteur };
}

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

/* --- Contenu des deux messages ---

   Gabarit en tableaux et styles en ligne : c'est la seule mise en forme
   que tous les logiciels de messagerie rendent pareil, Outlook compris.
   Le logo est une image distante, et la plupart des messageries les
   bloquent au premier message : le nom de l'agence est donc du VRAI
   texte a cote, jamais une image. Images coupees, le courrier reste
   entier et signe. --------------------------------------------------- */

const SITE = 'https://lagencedusud.com';
const CREME = '#FAF5EC', ENCRE = '#17130E', GRIS = '#6E6459', BLEU = '#1730D6', SOLEIL = '#FF4D00';

function gabarit(contenu) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREME};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREME};">
  <tr><td align="center" style="padding:28px 16px 40px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">

      <tr><td style="padding:0 0 22px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:10px;vertical-align:middle;">
            <img src="${SITE}/assets/img/logo-mark.png" width="30" height="36" alt=""
                 style="display:block;border:0;width:30px;height:36px;">
          </td>
          <td style="vertical-align:middle;font-family:Georgia,'Times New Roman',serif;
                     font-size:23px;line-height:1;color:${ENCRE};letter-spacing:-.01em;">
            L&rsquo;Agence du Sud
          </td>
        </tr></table>
      </td></tr>

      <tr><td style="background:#FFFFFF;border:1px solid #17130E1F;border-radius:14px;
                     padding:30px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',
                     Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${ENCRE};">
        ${contenu}
      </td></tr>

      <tr><td style="padding:20px 6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',
                     Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:${GRIS};">
        L&rsquo;Agence du Sud &middot; Montpellier, H&eacute;rault<br>
        <a href="tel:+33767377014" style="color:${GRIS};text-decoration:none;">${TELEPHONE}</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:${DESTINATAIRE}" style="color:${GRIS};text-decoration:none;">${DESTINATAIRE}</a>
        &nbsp;&middot;&nbsp;
        <a href="${SITE}" style="color:${BLEU};text-decoration:none;">lagencedusud.com</a>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

function messages(d) {
  const lignes = [
    ['Nom', d.nom],
    ['Email', d.email],
    ['Téléphone', d.tel || 'non renseigné'],
    ['Besoin', d.besoin || 'non précisé'],
  ];
  const tableau = lignes
    .map(([k, v]) => `<tr>`
      + `<td style="padding:5px 16px 5px 0;color:${GRIS};white-space:nowrap;">${k}</td>`
      + `<td style="padding:5px 0;color:${ENCRE};font-weight:700;">${echapper(v)}</td></tr>`)
    .join('');

  const projet = d.message
    ? `<p style="margin:22px 0 0;padding:16px 18px;background:${CREME};border-radius:10px;`
      + `white-space:pre-wrap;color:${ENCRE};">${echapper(d.message)}</p>`
    : `<p style="margin:22px 0 0;color:${GRIS};">Aucun message&nbsp;: à rappeler.</p>`;

  const pourMoi = {
    sujet: `Demande de maquette · ${propre(d.nom, 60)}`,
    html: gabarit(
      `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:${SOLEIL};font-weight:700;">Nouvelle demande</p>`
      + `<p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.25;color:${ENCRE};">`
      + `${echapper(propre(d.nom, 60))} vous a écrit depuis le site.</p>`
      + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:15px;">${tableau}</table>`
      + projet
      + `<p style="margin:24px 0 0;font-size:13px;color:${GRIS};">`
      + `Répondez directement à ce message, il part vers l’adresse du visiteur.</p>`),
    texte: lignes.map(([k, v]) => `${k} : ${v}`).join('\n')
         + '\n\n' + (d.message || '(aucun message)')
         + '\n\nRepondez directement a ce message.',
  };

  const prenom = propre(d.nom, 60).split(' ')[0] || '';

  const pourLui = {
    sujet: 'Votre demande est bien arrivée · L’Agence du Sud',
    html: gabarit(
      `<p style="margin:0 0 18px;">Bonjour ${echapper(prenom)},</p>`
      + `<p style="margin:0 0 18px;">Votre message est bien arrivé. Je le lis moi-même, et je vous réponds `
      + `<b>sous 24&nbsp;heures</b> les jours ouvrés, avec un premier avis sur votre projet et un créneau `
      + `pour se parler.</p>`
      + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">`
      + `<tr><td style="background:${ENCRE};border-radius:100px;">`
      + `<a href="tel:+33767377014" style="display:inline-block;padding:11px 22px;color:${CREME};`
      + `text-decoration:none;font-size:15px;font-weight:700;">Si c’est pressé&nbsp;: ${TELEPHONE}</a>`
      + `</td></tr></table>`
      + `<p style="margin:0 0 4px;">À très vite,</p>`
      + `<p style="margin:0;color:${GRIS};">Dorian</p>`),
    texte: `Bonjour ${prenom},

Votre message est bien arrive. Je le lis moi-meme et je vous reponds `
         + `sous 24 heures les jours ouvres, avec un premier avis et un creneau pour se parler.

`
         + `Si c'est presse : ${TELEPHONE}

A tres vite,
Dorian
L'Agence du Sud, Montpellier
${SITE}`,
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
  const { hote, port, boite, expediteur } = reglagesSmtp();
  const transport = nodemailer.createTransport({
    host: hote,
    port,
    // 465 parle TLS d'entrée de jeu ; 587 démarre en clair puis passe en
    // STARTTLS. Figer `true` interdisait tout relais sur 587, dont Brevo.
    secure: port === 465,
    auth: { user: boite, pass: process.env.SMTP_PASS },
  });

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
      reglages: reglagesSmtp(),
      cles: {
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        SMTP_PASS: !!process.env.SMTP_PASS,
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
