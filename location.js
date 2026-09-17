import { products, packs, durations } from './data/location.js';
const mainPath = '/location-materiel-montpellier';
const productSection = document.querySelector('[data-product]');
if (productSection) {
  const product = products.find(p => p.id === productSection.dataset.product);
  const update = () => {
    const params = new URLSearchParams({materiel: product.id, duree: document.querySelector('[name="product-duration"]:checked').value});
    for (const input of document.querySelectorAll('[name="product-accessory"]:checked')) params.append('accessoires', input.value);
    document.querySelectorAll('[data-product-cta]').forEach(link => { link.href = `${mainPath}?${params}#reservation`; });
  };
  productSection.addEventListener('change', update);
  update();
}
const visual = document.querySelector('[data-parallax]');
if (visual && matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
  visual.addEventListener('pointermove', event => {
    const rect = visual.getBoundingClientRect();
    visual.style.setProperty('--parallax-x', `${((event.clientX - rect.left) / rect.width - .5) * 10}px`);
    visual.style.setProperty('--parallax-y', `${((event.clientY - rect.top) / rect.height - .5) * 8}px`);
  });
  visual.addEventListener('pointerleave', () => { visual.style.setProperty('--parallax-x', '0px'); visual.style.setProperty('--parallax-y', '0px'); });
}
const form = document.querySelector('#formLocation');
if (form) {
  const status = form.querySelector('.loc-form-status');
  const button = form.querySelector('[type=submit]');
  const date = form.elements.date;
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Paris'}).format(new Date());
  date.min = today;
  const productInputs = [...form.querySelectorAll('[name=materiel]')];
  const accessoryInputs = [...form.querySelectorAll('[name=accessoires]')];
  const updateAccessories = () => {
    const selected = productInputs.filter(input => input.checked).map(input => input.value);
    form.querySelectorAll('[data-accessories-for]').forEach(group => {
      const active = selected.includes(group.dataset.accessoriesFor);
      group.hidden = !active;
      group.querySelectorAll('input').forEach(input => { input.disabled = !active; if (!active) input.checked = false; });
    });
    form.querySelector('.loc-accessory-form').hidden = ![...form.querySelectorAll('[data-accessories-for]')].some(group => !group.hidden);
    productInputs[0].setCustomValidity(selected.length ? '' : 'Sélectionnez au moins un matériel.');
  };
  const applyParams = params => {
    const pack = packs.find(p => p.id === params.get('pack'));
    const ids = pack ? pack.products : params.getAll('materiel');
    productInputs.forEach(input => { input.checked = ids.includes(input.value); });
    if (durations[params.get('duree')]) form.elements.duree.value = params.get('duree');
    updateAccessories();
    const accessories = pack ? pack.accessories : params.getAll('accessoires');
    accessoryInputs.forEach(input => { input.checked = !input.disabled && accessories.includes(input.value); });
    form.elements.pack.value = pack?.id || '';
    const note = form.querySelector('.loc-pack-note');
    note.hidden = !pack;
    note.textContent = pack ? `${pack.name} sélectionné · tarif sur demande` : '';
  };
  const clearPack = () => { form.elements.pack.value = ''; form.querySelector('.loc-pack-note').hidden = true; };
  productInputs.forEach(input => input.addEventListener('change', () => { updateAccessories(); clearPack(); }));
  accessoryInputs.forEach(input => input.addEventListener('change', clearPack));
  applyParams(new URLSearchParams(location.search));
  document.querySelectorAll('[data-pack]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const url = new URL(link.href);
    applyParams(url.searchParams);
    history.replaceState(null, '', url.search + '#reservation');
    document.querySelector('#reservation').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }));
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    updateAccessories();
    if (!form.reportValidity()) return;
    if (form.elements._gotcha.value) return;
    const fd = new FormData(form);
    const body = Object.fromEntries(fd);
    body.materiel = fd.getAll('materiel');
    body.accessoires = fd.getAll('accessoires');
    sending = true;
    button.disabled = true;
    button.setAttribute('aria-busy','true');
    status.textContent = 'Envoi en cours…';
    try {
      const response = await fetch(form.action, {method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.erreur || 'L’envoi n’a pas abouti. Écrivez à contact@southconciergerie.fr.');
      form.setAttribute('data-sent','');
      form.querySelector('.loc-success').hidden = false;
      status.textContent = '';
      form.querySelector('.loc-success').focus();
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' ? 'L’envoi prend plus de temps que prévu. Contactez-nous à contact@southconciergerie.fr avant de renouveler votre demande.' : error.message === 'Failed to fetch' ? 'Connexion interrompue. Vérifiez votre connexion ou écrivez à contact@southconciergerie.fr. Vos informations sont conservées.' : error.message;
      status.focus();
    } finally {
      sending = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
}
