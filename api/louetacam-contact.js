const recipient='contact@southconciergerie.fr';
const clean=(v,max)=>typeof v==='string'?v.replace(/[\r\n\x00-\x1f]/g,' ').trim().slice(0,max):'';
export function validateContact(body){
 if(!body||typeof body!=='object')throw Error('Message illisible.');
 const data={nom:clean(body.nom,120),email:clean(body.email,160),tel:clean(body.tel,40),sujet:clean(body.sujet,120),message:typeof body.message==='string'?body.message.trim():''};
 if(!data.nom)throw Error('Indiquez votre nom.');
 if(!/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(data.email)||/[\r\n]/.test(body.email||''))throw Error('Indiquez une adresse email valide.');
 if(data.tel&&(!/^[+\d\s().-]+$/.test(data.tel)||data.tel.replace(/\D/g,'').length<8))throw Error('Vérifiez votre numéro de téléphone.');
 if(!data.sujet)throw Error('Choisissez un sujet.');
 if(data.message.length<10||data.message.length>5000)throw Error('Votre message doit contenir entre 10 et 5 000 caractères.');
 if(body.privacy!=='accepted')throw Error('Veuillez lire les informations de confidentialité.');
 return data;
}
export async function sendContact(data){
 const subject=`[Louetacam · Contact] ${data.sujet}`;
 const text=`Message depuis louetacam.fr\n\nNom : ${data.nom}\nEmail : ${data.email}\nTéléphone : ${data.tel||'Non renseigné'}\nSujet : ${data.sujet}\n\n${data.message}\n\nRépondez directement à cet email pour joindre cette personne.`;
 if(process.env.RESEND_API_KEY){
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.RESEND_FROM||'Louetacam <bonjour@lagencedusud.com>',to:[recipient],reply_to:data.email,subject,text}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('mail-provider');return;
 }
 if(process.env.SMTP_PASS){
  const {default:nodemailer}=await import('nodemailer');const host=process.env.SMTP_HOST||'ssl0.ovh.net';const port=Number(process.env.SMTP_PORT||(/ovh\.net$/i.test(host)?465:587));const user=process.env.SMTP_USER||'bonjour@lagencedusud.com';
  const transport=nodemailer.createTransport({host,port,secure:port===465,requireTLS:port!==465,auth:{user,pass:process.env.SMTP_PASS},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:20000});
  try{const result=await transport.sendMail({from:`Louetacam <${process.env.MAIL_FROM||'bonjour@lagencedusud.com'}>`,to:recipient,replyTo:data.email,subject,text});if(!result.accepted?.some(x=>String(x).toLowerCase()===recipient))throw Error('not-accepted');}finally{transport.close();}return;
 }
 throw Error('mail-not-configured');
}
function reply(req,res,status,body){
 if((req.headers.accept||'').includes('application/json'))return res.status(status).json(body);
 if(body.ok){res.setHeader('Location','/merci-contact');return res.status(303).end();}
 res.setHeader('Content-Type','text/html; charset=utf-8');
 return res.status(status).end(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Message non envoyé</title><body style="font:18px/1.7 system-ui;max-width:40rem;margin:3rem auto;padding:20px"><h1>Message non envoyé</h1><p>${body.erreur}</p><a href="/contact">Revenir au formulaire</a></body></html>`);
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(req,res,405,{ok:false,erreur:'Méthode non autorisée.'});}
 const origins=new Set(['https://louetacam.fr','https://www.louetacam.fr',...(process.env.VERCEL_URL?[`https://${process.env.VERCEL_URL}`]:[])]);
 if(req.headers.origin&&!origins.has(req.headers.origin))return reply(req,res,403,{ok:false,erreur:'Envoyez votre message depuis louetacam.fr.'});
 let body;
 try{if(Number(req.headers['content-length'])>20000)throw Error();if(req.body&&typeof req.body==='object'){if(Buffer.byteLength(JSON.stringify(req.body))>20000)throw Error();body=req.body;}else{let raw=typeof req.body==='string'?req.body:'';if(req.body==null)for await(const c of req){raw+=c;if(Buffer.byteLength(raw)>20000)throw Error();}if(Buffer.byteLength(raw)>20000)throw Error();body=(req.headers['content-type']||'').includes('application/json')?JSON.parse(raw):Object.fromEntries(new URLSearchParams(raw));}}catch{return reply(req,res,400,{ok:false,erreur:'Message illisible ou trop volumineux.'});}
 if(clean(body?._gotcha,100))return reply(req,res,200,{ok:true});
 let data;try{data=validateContact(body);}catch(e){return reply(req,res,400,{ok:false,erreur:e.message});}
 try{await sendContact(data);return reply(req,res,200,{ok:true});}catch{return reply(req,res,502,{ok:false,erreur:'L’envoi a échoué. Réessayez ou écrivez à contact@louetacam.fr.'});}
}
