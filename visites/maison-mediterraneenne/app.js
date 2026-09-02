/**
 * Visite exportée : interface autonome autour de TourViewer.
 * Les données sont incluses dans index.html (window.TOUR_DATA) : la visite
 * fonctionne sur n'importe quel hébergement statique, sans backend.
 */
(function () {
  "use strict";

  const tour = window.TOUR_DATA;
  const loading = document.getElementById("loading");
  const errorBox = document.getElementById("error");
  const errorMsg = document.getElementById("error-message");
  const chips = document.getElementById("chips");
  const sceneTitle = document.getElementById("scene-title");

  const byId = {};
  for (const node of tour.nodes) byId[node.id] = node;

  let tv;
  try {
    tv = TourViewer.create({ container: "viewer", tour, assetBase: "" });
  } catch (err) {
    showError(err.message);
    return;
  }

  /* --- accès direct aux positions ---------------------------------------
     Des vignettes plutôt que des libellés : les noms hérités des fichiers de
     l'appareil photo n'ont aucun sens pour un visiteur, et une image dit
     immédiatement de quelle pièce il s'agit. Le nom n'apparaît que s'il a été
     saisi, en infobulle et pour les lecteurs d'écran. */
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
    img.src = node.panorama.thumbnail;
    img.alt = "";
    img.loading = "lazy";
    chip.appendChild(img);
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
