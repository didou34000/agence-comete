const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const origin=process.env.TEST_ORIGIN||'http://localhost:4178';
const routes=['location-materiel-montpellier','location-insta360-x5-montpellier','location-ray-ban-meta-montpellier','location-drone-dji-mini-2-se-montpellier'];
(async()=>{
for(const [engineName,engine] of Object.entries({chromium,webkit})){
const browser=await engine.launch({headless:true,...(engineName==='chromium'?{channel:'chrome'}:{})});
try {
for(const width of [1440,1024,768,390,320]){
 const page=await browser.newPage({viewport:{width,height:960}}); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/_vercel/**',r=>r.fulfill({status:200,body:''}));
 for(const route of routes){
  const response=await page.goto(`${origin}/${route}`);assert(response.ok());
  const reject=page.getByRole('button',{name:'Refuser',exact:true}); if(await reject.isVisible())await reject.click();
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://lagencedusud.com/${route}`);
  for(const schema of await page.locator('script[type="application/ld+json"]').allTextContents()) JSON.parse(schema);
  await page.evaluate(async()=>{for(const img of document.images){img.loading='eager'; await img.decode().catch(()=>{});}});
  assert.equal(await page.locator('img').evaluateAll(images=>images.filter(i=>!i.naturalWidth).length),0,'broken image');
  const dimensions=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(dimensions.page<=dimensions.viewport+1,`${engineName} ${width} ${route}: overflow ${dimensions.page}`);
  if(width===1440 || width===390) await page.screenshot({path:`/tmp/location-${engineName}-${route}-${width}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[],`${engineName} JS errors`);
 console.log(`PASS ${engineName} ${width}px: four pages, images, metadata, no overflow/errors`);
 await page.close();
}
const page=await browser.newPage({viewport:{width:390,height:844}});
await page.goto(`${origin}/location-insta360-x5-montpellier`);
const reject=page.getByRole('button',{name:'Refuser',exact:true});if(await reject.isVisible())await reject.click();
await page.locator('.loc-duration label').filter({has:page.locator('[value=journee]')}).click();
await page.locator('.loc-accessories summary').click();
await page.locator('[name=product-accessory][value=ventouse]').check();
await page.locator('.loc-product-info [data-product-cta]').click();
await page.waitForURL('**/location-materiel-montpellier?**');
assert(await page.locator('[name=materiel][value=insta360-x5]').isChecked());
assert.equal(await page.locator('[name=duree]').inputValue(),'journee');
assert(await page.locator('[name=accessoires][value=ventouse]').isChecked());
await page.locator('[name=nom]').fill('Test');await page.locator('[name=prenom]').fill('Parcours');await page.locator('[name=tel]').fill('0600000000');await page.locator('[name=email]').fill('test@example.com');
await page.locator('[name=date]').fill('2027-12-20');
let payload;
await page.route('**/api/location',r=>{payload=r.request().postDataJSON();return r.fulfill({status:502,contentType:'application/json',body:JSON.stringify({ok:false,erreur:'Erreur de test — aucun email envoyé.'})})});
await page.locator('#formLocation [type=submit]').click();await page.locator('.loc-form-status').filter({hasText:'Erreur de test'}).waitFor();
assert.equal(await page.locator('[name=nom]').inputValue(),'Test');assert(!(await page.locator('.loc-success').isVisible()));
await page.unroute('**/api/location');
await page.route('**/api/location',r=>{payload=r.request().postDataJSON();return r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'})});
await page.locator('#formLocation [type=submit]').click();await page.locator('.loc-success').waitFor();
assert.deepEqual(payload.materiel,['insta360-x5']);assert.deepEqual(payload.accessoires,['ventouse']);assert.equal(payload.duree,'journee');
await page.goto(`${origin}/location-materiel-montpellier?pack=ultimate#reservation`);
assert.equal(await page.locator('[name=materiel]:checked').count(),3);
await page.locator('[data-pack=road-trip]').click();assert.equal(await page.locator('[name=materiel]:checked').count(),1);assert(await page.locator('[name=accessoires][value=ventouse]').isChecked());
await page.locator('[name=materiel][value=insta360-x5]').uncheck();assert.equal(await page.locator('[name=pack]').inputValue(),'');
assert(!(await page.locator('#formLocation').evaluate(form=>form.checkValidity())));
// Verify native menu and FAQ keyboard interaction.
await page.locator('.burger').click();assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false');
await page.locator('.loc-faq summary').first().focus();await page.keyboard.press('Enter');assert(await page.locator('.loc-faq details').first().getAttribute('open')!==null);
const links=await page.locator('a[href]').evaluateAll(links=>[...new Set(links.map(a=>a.href).filter(h=>h.startsWith(location.origin)))].map(h=>h.split('#')[0]));
for(const url of links)assert((await page.request.get(url)).ok(),`broken link ${url}`);
console.log(`PASS ${engineName}: product selection, options, packs, form failure/success, mobile menu, FAQ, internal links`);
await page.close();
}finally{await browser.close();}
}
})().catch(e=>{console.error(e);process.exitCode=1});
