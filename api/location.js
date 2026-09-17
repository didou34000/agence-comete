import { products, packs, durations, rentalContact } from '../data/location.js';
const MAX_BODY = 20000;
const clean = (value, max = 200) => typeof value === 'string' ? value.replace(/[\r\n\x00-\x1f]+/g, ' ').trim().slice(0,max) : '';
const list = value => value == null ? [] : Array.isArray(value) ? value : [value];
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const errorText = `L’envoi a échoué. Vos informations sont conservées. Écrivez à ${rentalContact.email} ou appelez le ${rentalContact.phone}.`;
async function readBody(req) {
  if (Number(req.headers['content-length']) > MAX_BODY) throw new Error('too-large');
  if (req.body && typeof req.body === 'object') {
    if (Buffer.byteLength(JSON.stringify(req.body)) > MAX_BODY) throw new Error('too-large');
    return req.body;
  }
  let raw = typeof req.body === 'string' ? req.body : '';
  if (req.body == null) for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_BODY) throw new Error('too-large');
  }
  if (Buffer.byteLength(raw) > MAX_BODY) throw new Error('too-large');
  if ((req.headers['content-type'] || '').includes('application/json')) return JSON.parse(raw);
  const params = new URLSearchParams(raw);
  return {...Object.fromEntries(params),materiel:params.getAll('materiel'),accessoires:params.getAll('accessoires')};
}
export function validateRental(body, now = new Date()) {
  if (!body || typeof body !== 'object') throw new Error('Demande illisible.');
  const data = {nom:clean(body.nom,100),prenom:clean(body.prenom,100),tel:clean(body.tel,40),email:clean(body.email,160),duree:clean(body.duree,30),date:clean(body.date,10),message:typeof body.message==='string'?body.message.slice(0,5000):'',pack:clean(body.pack,40)};
  if (!data.nom || !data.prenom) throw new Error('Renseignez votre nom et votre prénom.');
  if (!/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(data.email) || /[\r\n]/.test(body.email || '')) throw new Error('Renseignez une adresse email valide.');
  if (data.tel.replace(/\D/g,'').length < 8 || !/^[+\d\s().-]+$/.test(data.tel)) throw new Error('Renseignez un numéro de téléphone valide.');
  const ids = [...new Set(list(body.materiel))];
  if (!ids.length || ids.some(id => !products.some(p=>p.id===id))) throw new Error('Sélectionnez au moins un matériel du catalogue.');
  data.products = products.filter(p=>ids.includes(p.id));
  if (!Object.hasOwn(durations,data.duree)) throw new Error('Choisissez une durée de location.');
  const day = new Date(`${data.date}T12:00:00Z`);
  const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris'}).format(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0,10)!==data.date || data.date < today) throw new Error('Choisissez une date valide, aujourd’hui ou plus tard.');
  const accessoryIds = [...new Set(list(body.accessoires))];
  const allowed = data.products.flatMap(p=>p.optionalAccessories.filter(a=>a.enabled));
  if (accessoryIds.some(id=>!allowed.some(a=>a.id===id))) throw new Error('Un accessoire ne correspond pas au matériel choisi.');
  data.accessories = allowed.filter(a=>accessoryIds.includes(a.id));
  if (data.pack) {
    const pack = packs.find(p=>p.id===data.pack);
    if (!pack || pack.products.length!==ids.length || pack.products.some(id=>!ids.includes(id)) || pack.accessories.length!==accessoryIds.length || pack.accessories.some(id=>!accessoryIds.includes(id))) throw new Error('Le pack et le matériel choisi ne correspondent pas.');
    data.packName = pack.name;
  }
  return data;
}
export function rentalMessage(data) {
  const date = data.date.split('-').reverse().join('/');
  const lines = [
    ['Nom',data.nom], ['Prénom',data.prenom], ['Téléphone',data.tel], ['Email',data.email],
    ['Matériel',data.products.map(p=>p.name).join(', ')], ['Durée',durations[data.duree]], ['Date souhaitée',date],
    ['Accessoires',data.accessories.map(a=>a.name).join(', ') || 'Aucun demandé'], ['Pack',data.packName || 'Aucun'],
    ['Tarif indicatif hors options',data.duree==='plusieurs'||data.packName?'Sur demande':data.products.map(p=>`${p.name} : ${data.duree==='journee'?p.dayPrice:p.halfDayPrice} €`).join(' ; ')],
    ['Message',data.message || 'Aucun message'],
  ];
  return {
    subject:`Demande de location – ${data.products.map(p=>p.name).join(' + ')} – ${date}`,
    text:lines.map(([key,value])=>`${key} : ${value}`).join('\n')+'\n\nDemande de disponibilité, réservation à confirmer.\nRépondez directement à cet email pour joindre le client.',
    html:`<!doctype html><html lang="fr"><meta charset="utf-8"><body style="background:#FAF5EC;color:#17130E;font:16px/1.6 Arial,sans-serif;padding:24px"><h1 style="font-family:Georgia,serif;font-size:28px">Nouvelle demande de location</h1><p>L’Agence du Sud · Montpellier</p><table>${lines.map(([k,v])=>`<tr><th style="text-align:left;vertical-align:top;padding:8px 24px 8px 0">${escape(k)}</th><td style="white-space:pre-wrap;padding:8px 0">${escape(v)}</td></tr>`).join('')}</table><p>Demande de disponibilité, réservation à confirmer.</p><p>Répondez directement à cet email pour joindre le client.</p></body></html>`
  };
}
export async function sendRental(data) {
  const message = rentalMessage(data);
  // Le destinataire n’est jamais fourni par le navigateur. L’expéditeur reste
  // celui du domaine déjà validé dans le service d’envoi de l’agence.
  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.RESEND_FROM || "L'Agence du Sud <bonjour@lagencedusud.com>",to:[rentalContact.email],reply_to:data.email,...message}),signal:AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(`mail-provider-${response.status}`);
    return;
  }
  if (!process.env.SMTP_PASS) throw new Error('mail-not-configured');
  const {default:nodemailer} = await import('nodemailer');
  const host=process.env.SMTP_HOST || 'ssl0.ovh.net';
  const port=Number(process.env.SMTP_PORT || (/ovh\.net$/i.test(host)?465:587));
  const user=process.env.SMTP_USER || 'bonjour@lagencedusud.com';
  const from=process.env.MAIL_FROM || (user.endsWith('@lagencedusud.com')?user:'bonjour@lagencedusud.com');
  const transport=nodemailer.createTransport({host,port,secure:port===465,requireTLS:port!==465,auth:{user,pass:process.env.SMTP_PASS},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000});
  try {
    const result=await transport.sendMail({from:`L'Agence du Sud <${from}>`,to:rentalContact.email,replyTo:data.email,...message});
    if (!result.accepted?.some(address=>String(address).toLowerCase()===rentalContact.email)) throw new Error('recipient-not-accepted');
  } finally { transport.close(); }
}
function reply(req,res,status,body){
  if ((req.headers.accept||'').includes('application/json')) return res.status(status).json(body);
  if(body.ok){res.setHeader('Location','/merci-location');return res.status(303).end();}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.status(status).end(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Demande de location</title><body style="font:18px/1.6 system-ui;max-width:38rem;margin:3rem auto;padding:0 20px"><h1>La demande n’a pas été envoyée.</h1><p>${escape(body.erreur)}</p><p><a href="/location-materiel-montpellier#reservation">Revenir au formulaire</a></p></body></html>`);
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,erreur:'Méthode non autorisée.'});}
  // Same-origin requests only when the browser supplies an Origin header.
  if(req.headers.origin){
    const allowed=new Set(['https://lagencedusud.com','https://www.lagencedusud.com',...(process.env.VERCEL_URL?[`https://${process.env.VERCEL_URL}`]:[])]);
    if(process.env.NODE_ENV!=='production'){allowed.add('http://localhost:4178');allowed.add('http://127.0.0.1:4178');}
    if(!allowed.has(req.headers.origin)) return reply(req,res,403,{ok:false,erreur:'Veuillez envoyer la demande depuis le formulaire du site.'});
  }
  let body;
  try{body=await readBody(req);}catch{return reply(req,res,400,{ok:false,erreur:'Demande illisible ou trop volumineuse.'});}
  if(clean(body?._gotcha)) return reply(req,res,200,{ok:true});
  let data;
  try{data=validateRental(body);}catch(e){return reply(req,res,400,{ok:false,erreur:e.message});}
  try{await sendRental(data);return reply(req,res,200,{ok:true});}catch{
    console.error('location: échec de transmission au service email');
    return reply(req,res,502,{ok:false,erreur:errorText});
  }
}
