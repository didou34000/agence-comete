/**
 * TourViewer — enveloppe du moteur de rendu 360°.
 *
 * Toute l'application (éditeur, prévisualisation, visite exportée) passe par
 * cette couche : elle traduit le manifeste de visite (tour.json, indépendant
 * du moteur) en configuration Pannellum. Pour changer de moteur plus tard
 * (Three.js, scène 3D reconstruite…), c'est LE seul fichier à remplacer :
 * il suffit de réimplémenter TourViewer.create() avec la même interface.
 *
 * Interface :
 *   const tv = TourViewer.create({ container, tour, assetBase, editMode })
 *   tv.goTo(id) / tv.next() / tv.prev() / tv.currentId()
 *   tv.getView() → { yaw, pitch, hfov }
 *   tv.coordsFromEvent(mouseEvent) → { pitch, yaw }   (placement de hotspots)
 *   tv.toggleFullscreen() / tv.on(event, cb) / tv.destroy()
 *   tv.orderedIds — positions dans l'ordre défini
 */
(function (global) {
  "use strict";

  /* Taille de texture maximale supportée par le GPU : décide si l'on peut
     afficher les panoramas 8192 px ou s'il faut la version 4096 px (mobiles). */
  let cachedMaxTexture = null;
  function maxTextureSize() {
    if (cachedMaxTexture) return cachedMaxTexture;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      cachedMaxTexture = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 4096;
    } catch {
      cachedMaxTexture = 4096;
    }
    return cachedMaxTexture;
  }

  /* Meilleure version d'un panorama : la plus grande qui tienne dans le GPU. */
  function bestSource(node) {
    const max = maxTextureSize();
    const sources = [...node.panorama.sources].sort((a, b) => b.width - a.width);
    return (sources.find((s) => s.width <= max) || sources[sources.length - 1]).src;
  }

  function nodeById(tour, id) {
    return tour.nodes.find((n) => n.id === id) || null;
  }

  /**
   * Nom montré au visiteur, ou chaîne vide.
   *
   * Tant qu'une position n'a pas reçu de vrai nom de pièce, elle porte le nom
   * du fichier de l'appareil (« Img 20260818 132836 00 006 ») : illisible et
   * sans intérêt pour qui visite. Le drapeau `auto_label` le signale ; pour les
   * visites créées avant son introduction, la forme du nom suffit à trancher.
   */
  function displayLabel(node) {
    if (!node) return "";
    if (node.auto_label) return "";
    if (node.auto_label === undefined && /^img[\s_-]*\d{6,}/i.test(node.label)) return "";
    return node.label;
  }
  global.TourViewer = global.TourViewer || {};

  /* Orientation à l'arrivée dans une position :
     1. valeur explicite du lien s'il y en a une ;
     2. si les deux positions ont un offset nord défini, on conserve le cap
        réel (« sameAzimuth » : on continue de regarder dans la même direction) ;
     3. sinon, la vue initiale de la position cible. */
  function resolveTarget(link, from, to) {
    const yaw = link.targetYaw !== null && link.targetYaw !== undefined
      ? link.targetYaw
      : (from.northOffset !== null && to.northOffset !== null ? "sameAzimuth" : to.view.yaw);
    const pitch = link.targetPitch !== null && link.targetPitch !== undefined
      ? link.targetPitch
      : to.view.pitch;
    return { yaw, pitch };
  }

  /**
   * Marqueur de passage.
   *
   * Deux formes selon l'endroit visé, comme dans les visites immobilières
   * professionnelles :
   *   - posé vers le sol (le cas courant, on désigne le seuil d'une porte) :
   *     un disque en perspective, qui se lit comme une empreinte au sol vers
   *     laquelle on avance ;
   *   - visé plus haut : un anneau avec un chevron, qui indique une direction.
   * Le nom de la pièce n'apparaît qu'au survol (ou en permanence sur mobile,
   * où il n'y a pas de survol) : la vue reste dégagée.
   */
  function decorateHotspot(div, args) {
    div.classList.add("tv-hotspot");
    if (args.floor) div.classList.add("tv-hotspot--floor");

    const mark = document.createElement("div");
    mark.className = "tv-hotspot-mark";
    mark.innerHTML = args.floor
      ? `<svg viewBox="0 0 72 48" width="72" height="48" aria-hidden="true">
           <ellipse class="tv-ring-outer" cx="36" cy="30" rx="30" ry="15"/>
           <ellipse class="tv-ring-inner" cx="36" cy="30" rx="19" ry="9.5"/>
           <path class="tv-chevron" d="M28 26.5l8 5 8-5" fill="none"/>
         </svg>`
      : `<svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">
           <circle class="tv-ring-outer" cx="24" cy="24" r="20"/>
           <circle class="tv-ring-inner" cx="24" cy="24" r="13"/>
           <path class="tv-chevron" d="M20.5 17l7 7-7 7" fill="none"/>
         </svg>`;

    div.appendChild(mark);
    if (args.label) {
      const label = document.createElement("span");
      label.className = "tv-hotspot-label";
      label.textContent = args.label;
      div.appendChild(label);
    }
  }

  /* Styles des hotspots injectés une seule fois : viewer.js reste le seul
     fichier à embarquer pour obtenir un rendu complet. */
  let styleInjected = false;
  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;
    const css = `
.tv-hotspot {
  cursor: pointer; user-select: none; -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.tv-hotspot-mark { position: relative; line-height: 0; }
/* halo de respiration : attire l'œil sans clignoter */
.tv-hotspot-mark::after {
  content: ""; position: absolute; inset: 12%;
  border-radius: 50%; background: rgba(255, 255, 255, 0.35);
  filter: blur(7px); opacity: 0; animation: tv-pulse 2.8s ease-in-out infinite;
}
@keyframes tv-pulse {
  0%, 100% { opacity: 0.18; transform: scale(0.9); }
  50%      { opacity: 0.42; transform: scale(1.06); }
}
.tv-hotspot svg { overflow: visible; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.45)); }
.tv-ring-outer {
  fill: rgba(255, 255, 255, 0.14);
  stroke: rgba(255, 255, 255, 0.92); stroke-width: 2;
}
.tv-ring-inner { fill: rgba(255, 255, 255, 0.30); stroke: none; }
.tv-chevron { stroke: #fff; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.tv-hotspot-mark, .tv-hotspot-label { transition: transform 0.18s ease, opacity 0.18s ease; }
.tv-hotspot:hover .tv-hotspot-mark { transform: scale(1.12); }
.tv-hotspot:hover .tv-ring-outer { fill: rgba(255, 255, 255, 0.26); }
.tv-hotspot:active .tv-hotspot-mark { transform: scale(0.96); }

/* Le nom ne s'affiche qu'au survol : la vue reste dégagée. */
.tv-hotspot-label {
  padding: 5px 12px; border-radius: 999px;
  background: rgba(14, 14, 16, 0.72);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 0.01em;
  white-space: nowrap; opacity: 0; transform: translateY(-3px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
.tv-hotspot:hover .tv-hotspot-label { opacity: 1; transform: translateY(0); }
/* Marqueur au sol : le nom se place au-dessus du disque. */
.tv-hotspot--floor { flex-direction: column-reverse; }

/* Sans survol (tactile), le nom reste visible en permanence. */
@media (hover: none) {
  .tv-hotspot-label { opacity: 1; transform: none; font-size: 12.5px; padding: 4px 10px; }
  .tv-hotspot-mark::after { animation: none; opacity: 0.25; }
}
@media (prefers-reduced-motion: reduce) {
  .tv-hotspot-mark::after { animation: none; }
  .tv-travelling::after { animation: none; }
}

/* Déplacement en cours : les marqueurs s'effacent pour dégager la vue, et un
   filet de progression discret remplace l'attente muette. */
.tv-travelling { position: relative; }
.tv-travelling .tv-hotspot { opacity: 0; transition: opacity 0.2s ease; }
.tv-travelling::after {
  content: ""; position: absolute; top: 0; left: 0; height: 2px;
  background: rgba(255, 255, 255, 0.85); z-index: 20;
  animation: tv-progress 0.8s ease-out forwards;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}
@keyframes tv-progress {
  from { width: 0; opacity: 1; }
  70%  { width: 82%; opacity: 1; }
  to   { width: 100%; opacity: 0; }
}

/* Cache-trépied (nadir) */
.tv-nadir { pointer-events: none; }
.tv-nadir-disc {
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; position: relative;
  /* le bord se fond dans le sol au lieu de découper un cercle net */
  box-shadow: 0 0 40px 22px rgba(16, 16, 18, 0.5);
}
/* voile radial : opaque au centre, transparent au bord */
.tv-nadir-disc::before {
  content: ""; position: absolute; inset: -6%;
  border-radius: 50%; background: inherit;
  -webkit-mask-image: radial-gradient(circle, #000 58%, transparent 92%);
  mask-image: radial-gradient(circle, #000 58%, transparent 92%);
}
/* filet clair discret, comme une plaque posée au sol */
.tv-nadir-disc::after {
  content: ""; position: absolute; inset: 16%;
  border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.16);
}
.tv-nadir-logo {
  position: relative; width: 72%; height: auto;
  opacity: 0.92; filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}
.tv-nadir-text {
  position: relative;
  color: rgba(255, 255, 255, 0.85); font-size: 15px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase; text-align: center;
  padding: 0 16%;
}
`;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Cache-nadir : le disque qui masque le trépied.
   *
   * Une caméra 360° se voit elle-même par en dessous : au point le plus bas de
   * chaque panorama, on retrouve le pied, le sol étiré et parfois le
   * photographe. Le cache est un hotspot ancré au nadir (pitch -90°), non
   * cliquable, agrandi par Pannellum à mesure qu'on zoome dessus (`scale`)
   * pour rester couvrant. Il accueille au choix une pastille sobre ou un logo,
   * ce qui en fait aussi une signature discrète sur chaque vue.
   */
  function nadirHotspot(nadir) {
    if (!nadir || nadir.mode === "none") return null;
    return {
      id: "nadir-patch",
      // Légèrement au-dessus du pôle exact : à -90° pile, la projection du
      // marqueur est indéterminée (toutes les directions y convergent).
      pitch: -89.9,
      yaw: 0,
      cssClass: "tv-nadir-anchor",
      // Pas de `scale` : le facteur de Pannellum diverge quand le point visé
      // s'approche de 90° de l'axe de vue, ce qui fait exploser la taille du
      // disque dès qu'on regarde à l'horizontale. La taille est pilotée à la
      // main sur le niveau de zoom (voir applyNadirScale).
      createTooltipFunc: (div) => {
        div.classList.add("tv-nadir");
        const disc = document.createElement("div");
        disc.className = "tv-nadir-disc";
        disc.dataset.baseSize = String(nadir.size ?? 190);
        disc.style.width = disc.style.height = `${nadir.size ?? 190}px`;
        disc.style.background = nadir.color ?? "#101012";
        if (nadir.logo) {
          const img = document.createElement("img");
          img.src = nadir.logo;
          img.alt = "";
          img.className = "tv-nadir-logo";
          disc.appendChild(img);
        } else if (nadir.text) {
          const span = document.createElement("span");
          span.className = "tv-nadir-text";
          span.textContent = nadir.text;
          disc.appendChild(span);
        }
        div.appendChild(disc);
      },
      createTooltipArgs: {},
    };
  }

  // Les scènes sont construites avant l'instance ; elles s'y réfèrent par
  // cette boîte, remplie juste après la création.
  const handleRef = { current: null };

  function buildScene(tour, node, assetBase) {
    const hotSpots = node.links
      .map((link) => {
        const to = nodeById(tour, link.to);
        if (!to) return null; // lien orphelin : ignoré au rendu
        const target = resolveTarget(link, node, to);
        return {
          id: `link-${node.id}-${to.id}`,
          pitch: link.pitch,
          yaw: link.yaw,
          cssClass: "tv-hotspot-anchor",
          createTooltipFunc: decorateHotspot,
          createTooltipArgs: {
            // Un libellé hérité du nom de fichier n'est pas montré au
            // visiteur : le marqueur se suffit à lui-même.
            label: link.label || displayLabel(to),
            // Un passage désigné vers le bas se lit comme une empreinte au sol ;
            // plus haut, comme une flèche de direction.
            floor: link.pitch <= -8,
          },
          // Navigation confiée à l'enveloppe plutôt qu'au moteur, afin
          // d'accompagner le changement d'un mouvement vers le passage.
          clickHandlerFunc: (evt, args) => {
            if (evt && evt.preventDefault) evt.preventDefault();
            args.travel();
          },
          clickHandlerArgs: {
            travel: () => handleRef.current?.travel(to.id, {
              targetYaw: target.yaw,
              targetPitch: target.pitch,
            }),
          },
        };
      })
      .filter(Boolean);

    // Le cache-trépied est propre à la visite : défini une fois, appliqué à
    // toutes les positions. Un logo est résolu par rapport aux images du bundle.
    const nadir = tour.settings?.nadir;
    const patch = nadirHotspot(
      nadir && nadir.logo ? { ...nadir, logo: assetBase + nadir.logo } : nadir
    );
    if (patch) hotSpots.push(patch);

    return {
      type: "equirectangular",
      panorama: assetBase + bestSource(node),
      preview: assetBase + node.panorama.thumbnail,
      yaw: node.view.yaw,
      pitch: node.view.pitch,
      hfov: node.view.hfov,
      northOffset: node.northOffset ?? 0,
      hotSpots,
    };
  }

  function create({ container, tour, assetBase = "", editMode = false, startNodeId = null }) {
    injectStyles();
    const el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) throw new Error("TourViewer : conteneur introuvable.");
    if (!global.pannellum) throw new Error("TourViewer : pannellum.js n'est pas chargé.");

    const ordered = [...tour.nodes].sort((a, b) => a.order - b.order);
    const orderedIds = ordered.map((n) => n.id);
    const scenes = {};
    for (const node of ordered) scenes[node.id] = buildScene(tour, node, assetBase);

    const first = startNodeId && scenes[startNodeId]
      ? startNodeId
      : (tour.startNodeId && scenes[tour.startNodeId] ? tour.startNodeId : orderedIds[0]);

    const viewer = global.pannellum.viewer(el, {
      default: {
        firstScene: first,
        sceneFadeDuration: tour.settings?.sceneFadeDuration ?? 900,
        autoLoad: true,
        showZoomCtrl: true,
        showFullscreenCtrl: false, // l'interface fournit son propre bouton
        compass: false,
        autoRotate: tour.settings?.autoRotate ? -2 : false,
        friction: 0.15,
        strings: {
          loadingLabel: "Chargement…",
          loadButtonLabel: "Cliquez pour<br>charger le<br>panorama",
        },
      },
      scenes,
    });

    /* Pré-chargement des positions voisines : dès qu'une scène est affichée,
       les panoramas reliés sont téléchargés en arrière-plan pour des
       transitions instantanées. */
    const prefetched = new Set();
    function prefetchNeighbors(sceneId) {
      const node = nodeById(tour, sceneId);
      if (!node) return;
      for (const link of node.links) {
        const to = nodeById(tour, link.to);
        if (!to) continue;
        const src = assetBase + bestSource(to);
        if (prefetched.has(src)) continue;
        prefetched.add(src);
        const img = new Image();
        img.src = src;
      }
    }
    viewer.on("load", () => { prefetchNeighbors(viewer.getScene()); applyNadirScale(); });
    viewer.on("scenechange", (sceneId) => prefetchNeighbors(sceneId));

    /* Entretien du cache-trépied à chaque mouvement de vue :
       - sa taille apparente varie à l'inverse du champ de vision, comme le
         sol qu'il masque ;
       - il n'est affiché que lorsque le point sous la caméra entre réellement
         dans le champ. Ailleurs, sa position calculée part à l'infini (le pôle
         est une direction singulière) et le disque se retrouverait projeté
         très loin de l'écran. */
    function applyNadirScale() {
      const discs = el.querySelectorAll(".tv-nadir-disc");
      if (!discs.length) return;
      const hfov = viewer.getHfov();
      const canvas = el.querySelector("canvas");
      if (!hfov || !canvas) return;
      const vfov = hfov * (canvas.clientHeight / Math.max(1, canvas.clientWidth));
      const inView = viewer.getPitch() - vfov / 2 < -72;
      for (const disc of discs) {
        const holder = disc.parentElement;
        if (holder) holder.style.display = inView ? "" : "none";
        const base = Number(disc.dataset.baseSize) || 190;
        const size = Math.max(40, Math.min(2400, (base * 100) / hfov));
        disc.style.width = disc.style.height = `${size.toFixed(0)}px`;
      }
    }
    /* Suivi continu : la vue peut changer par la souris, le doigt, le clavier,
       le gyroscope ou une animation. Plutôt que de tenter d'intercepter chaque
       origine, on réévalue à chaque image — le calcul est négligeable. */
    let nadirRaf = 0;
    const nadirLoop = () => {
      applyNadirScale();
      nadirRaf = requestAnimationFrame(nadirLoop);
    };
    nadirRaf = requestAnimationFrame(nadirLoop);

    /**
     * Passage d'une position à l'autre.
     *
     * Volontairement sobre : une courte pause pour que le clic soit ressenti,
     * puis le fondu du moteur. Les tentatives d'animer un rapprochement vers
     * le passage se lisaient comme une latence plutôt que comme un
     * déplacement — le fondu seul est plus net.
     */
    const FADE = tour.settings?.sceneFadeDuration ?? 900;

    function travelTo(id, { targetYaw = null, targetPitch = null } = {}) {
      if (id === viewer.getScene() || !scenes[id]) return;
      el.classList.add("tv-travelling");
      setTimeout(() => {
        if (targetYaw !== null) viewer.loadScene(id, targetPitch, targetYaw);
        else viewer.loadScene(id);
        setTimeout(() => el.classList.remove("tv-travelling"), FADE * 0.7);
      }, 140);
    }

    const handle = {
      raw: viewer,
      orderedIds,
      currentId: () => viewer.getScene(),
      goTo(id) {
        const from = nodeById(tour, viewer.getScene());
        const link = from?.links.find((l) => l.to === id);
        const to = nodeById(tour, id);
        // L'orientation d'arrivée est conservée s'il existe un passage entre
        // les deux pièces, même en sautant depuis une vignette.
        if (link && to) {
          const t = resolveTarget(link, from, to);
          travelTo(id, { targetYaw: t.yaw, targetPitch: t.pitch });
        } else {
          travelTo(id);
        }
      },
      travel: travelTo,
      next() {
        const i = orderedIds.indexOf(viewer.getScene());
        handle.goTo(orderedIds[(i + 1) % orderedIds.length]);
      },
      prev() {
        const i = orderedIds.indexOf(viewer.getScene());
        handle.goTo(orderedIds[(i - 1 + orderedIds.length) % orderedIds.length]);
      },
      getView: () => ({
        yaw: round1(viewer.getYaw()),
        pitch: round1(viewer.getPitch()),
        hfov: round1(viewer.getHfov()),
      }),
      coordsFromEvent(event) {
        const [pitch, yaw] = viewer.mouseEventToCoords(event);
        return { pitch: round1(pitch), yaw: round1(yaw) };
      },
      toggleFullscreen: () => viewer.toggleFullscreen(),
      on: (evt, cb) => viewer.on(evt, cb),
      off: (evt, cb) => viewer.off(evt, cb),
      destroy() {
        cancelAnimationFrame(nadirRaf);
        try { viewer.destroy(); } catch { /* déjà détruit */ }
        el.innerHTML = "";
      },
    };

    handleRef.current = handle;
    if (editMode) el.classList.add("tv-edit-mode");
    return handle;
  }

  function round1(v) { return Math.round(v * 10) / 10; }

  global.TourViewer = { create, maxTextureSize, displayLabel };
})(window);
