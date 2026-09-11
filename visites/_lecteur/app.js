/**
 * Visite exportée : interface autonome autour de TourViewer.
 * Les données sont incluses dans index.html (window.TOUR_DATA) : la visite
 * fonctionne sur n'importe quel hébergement statique, sans backend.
 */
(function () {
  "use strict";

  const tour = window.TOUR_DATA;
  /* Le lecteur est commun a toutes les demonstrations : chaque visite le
     charge depuis /visites/_lecteur/ et declare seulement ou trouver ses
     propres panoramas. Un seul exemplaire de pannellum pour tout le site. */
  const ASSET_BASE = window.TOUR_BASE || "./";
  const loading = document.getElementById("loading");
  const errorBox = document.getElementById("error");
  const errorMsg = document.getElementById("error-message");
  const chips = document.getElementById("chips");
  const sceneTitle = document.getElementById("scene-title");

  /* Une indication courte rend le geste immédiat, surtout pour une visite à
     position unique : elle disparaît dès que la personne commence à explorer. */
  const aide = document.createElement("div");
  aide.className = "tour-aide";
  aide.setAttribute("aria-hidden", "true");
  aide.innerHTML = '<span class="tour-aide__main">Glissez pour regarder à 360°</span><span class="tour-aide__sub">Pincez ou utilisez la molette pour zoomer</span>';
  document.body.appendChild(aide);

  let aideMasquee = false;
  function masquerAide() {
    if (aideMasquee) return;
    aideMasquee = true;
    aide.classList.add("tour-aide--masquee");
  }
  document.getElementById("viewer").addEventListener("pointerdown", masquerAide, { once: true });
  document.getElementById("viewer").addEventListener("wheel", masquerAide, { once: true, passive: true });
  window.setTimeout(masquerAide, 6500);

  const byId = {};
  for (const node of tour.nodes) byId[node.id] = node;

  let tv;
  try {
    tv = TourViewer.create({ container: "viewer", tour, assetBase: ASSET_BASE });
  } catch (err) {
    showError(err.message);
    return;
  }

  /* --- accès direct aux positions ---------------------------------------
     Une vignette ET son nom. L'image seule laissait deviner : deux extérieurs
     verts se ressemblent à 100 px de large. Le nom n'est écrit que s'il a été
     saisi : un libellé hérité d'un nom de fichier ne dit rien à personne. */
  const chipEls = {};
  tv.orderedIds.forEach((id, i) => {
    const node = byId[id];
    const named = TourViewer.displayLabel(node);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.role = "tab";
    chip.setAttribute("aria-label", named || `Position ${i + 1}`);
    if (named) chip.title = named;
    const img = document.createElement("img");
    img.src = ASSET_BASE + node.panorama.thumbnail;
    img.alt = "";
    img.loading = "lazy";
    chip.appendChild(img);
    if (named) {
      const nom = document.createElement("span");
      nom.className = "chip__nom";
      nom.textContent = named;
      chip.appendChild(nom);
    }
    chip.addEventListener("click", () => tv.goTo(id));
    chips.appendChild(chip);
    chipEls[id] = chip;
  });

  function syncUi(sceneId) {
    sceneTitle.textContent = TourViewer.displayLabel(byId[sceneId]);
    for (const [id, el] of Object.entries(chipEls)) {
      el.classList.toggle("active", id === sceneId);
    }
    const active = chipEls[sceneId];
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }

  if (tour.nodes.length < 2) {
    document.getElementById("bar").classList.add("bar--seule");
  }

  /* --- boutons ----------------------------------------------------------- */
  document.getElementById("btn-prev").addEventListener("click", () => tv.prev());
  document.getElementById("btn-next").addEventListener("click", () => tv.next());
  document.getElementById("btn-fs").addEventListener("click", () => tv.toggleFullscreen());
  document.getElementById("error-retry").addEventListener("click", () => window.location.reload());

  /* --- événements du viewer ---------------------------------------------- */
  tv.on("load", () => {
    loading.classList.add("hidden");
    syncUi(tv.currentId());
  });
  tv.on("scenechange", (id) => syncUi(id));
  tv.on("error", (msg) => showError(String(msg)));
  tv.on("errorcleared", () => errorBox.classList.add("hidden"));

  /* --- clavier : PageUp/PageDown pour avancer / reculer ------------------- */
  window.addEventListener("keydown", (e) => {
    if (e.key === "PageDown" || e.key === "n") tv.next();
    if (e.key === "PageUp" || e.key === "p") tv.prev();
  });

  function showError(message) {
    loading.classList.add("hidden");
    errorMsg.textContent = message || "Erreur inconnue.";
    errorBox.classList.remove("hidden");
  }

  syncUi(tv.currentId());
})();
