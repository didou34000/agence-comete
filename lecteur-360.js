/* ══════════════════════════════════════════════════════════════════════
   LECTEUR VIDÉO 360, auto-hébergé et sans bibliothèque

   Pourquoi pas une bibliothèque : videojs-vr, Pannellum-video et les
   autres pèsent entre 200 et 600 Ko, et la plupart appellent un CDN.
   Ça casserait deux choses tenues depuis le début : le « aucun domaine
   tiers » et le poids de page. Ici tout tient en un fichier de quelques
   kilo-octets, chargé seulement sur les pages qui en ont besoin.

   Le principe est simple : la vidéo équirectangulaire devient une texture
   posée à l'intérieur d'une sphère, et la caméra est au centre. On tourne
   la caméra, pas la sphère.

   Rien ne démarre tant qu'on n'a pas cliqué : ni téléchargement de la
   vidéo, ni contexte WebGL. Une affiche tient la place avant.
   ══════════════════════════════════════════════════════════════════════ */

(() => {
  const SOMMET = `
    attribute vec3 position; attribute vec2 uv;
    uniform mat4 projection, vue;
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projection * vue * vec4(position, 1.0); }`;

  const FRAGMENT = `
    precision mediump float;
    uniform sampler2D image; varying vec2 vUv;
    void main() { gl_FragColor = texture2D(image, vUv); }`;

  /* Sphère UV. On la construit à l'envers (faces vers l'intérieur) : le
     spectateur est au centre, il regarde la paroi. */
  function sphere(segments = 48, anneaux = 32) {
    const pos = [], uvs = [], idx = [];
    for (let y = 0; y <= anneaux; y++) {
      const v = y / anneaux, phi = v * Math.PI;
      for (let x = 0; x <= segments; x++) {
        const u = x / segments, theta = u * Math.PI * 2;
        pos.push(
          -Math.cos(theta) * Math.sin(phi),
           Math.cos(phi),
           Math.sin(theta) * Math.sin(phi));
        uvs.push(1 - u, v);
      }
    }
    for (let y = 0; y < anneaux; y++)
      for (let x = 0; x < segments; x++) {
        const a = y * (segments + 1) + x, b = a + segments + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    return { pos, uvs, idx };
  }

  function matriceProjection(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0];
  }

  /* Rotation de la caméra : lacet puis tangage, en colonne-major. */
  function matriceVue(lacet, tangage) {
    const cy = Math.cos(lacet), sy = Math.sin(lacet);
    const cp = Math.cos(tangage), sp = Math.sin(tangage);
    return [cy,sy*sp,-sy*cp,0, 0,cp,sp,0, sy,-cy*sp,cy*cp,0, 0,0,0,1];
  }

  function compiler(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function demarrer(bloc) {
    const src = bloc.dataset.video;

    /* La toile est créée ici, pas dans le HTML : tant qu'on n'a pas
       cliqué, la page ne porte aucun contexte graphique. */
    const toile = document.createElement('canvas');
    const gl = toile.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) { bloc.dataset.echec = 'webgl'; return false; }
    bloc.prepend(toile);

    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.loop = true; video.playsInline = true;
    /* Le son n'est pas le defaut : il ne s'active que sur les blocs qui
       portent data-son. La lecture partant d'un clic, le navigateur
       autorise le son, qu'un autoplay muet n'aurait pas. */
    video.muted = !bloc.hasAttribute('data-son');
    video.setAttribute('playsinline', '');

    const prog = gl.createProgram();
    gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, SOMMET));
    gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog); gl.useProgram(prog);

    const g = sphere();
    const tampon = (data, type, Tableau) => {
      const b = gl.createBuffer();
      gl.bindBuffer(type, b); gl.bufferData(type, new Tableau(data), gl.STATIC_DRAW);
      return b;
    };
    tampon(g.pos, gl.ARRAY_BUFFER, Float32Array);
    const aPos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    tampon(g.uvs, gl.ARRAY_BUFFER, Float32Array);
    const aUv = gl.getAttribLocation(prog, 'uv');
    gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    tampon(g.idx, gl.ELEMENT_ARRAY_BUFFER, Uint16Array);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const uProj = gl.getUniformLocation(prog, 'projection');
    const uVue  = gl.getUniformLocation(prog, 'vue');

    /* Orientation d'ouverture. Chaque tournage a un « devant » different
       (ici le capot de la voiture) et le zero de la sphere ne tombe
       jamais dessus par hasard. Les deux attributs se reglent en degres
       dans le HTML, ce qui evite de re-encoder la video pour cadrer. */
    const deg = v => (parseFloat(v) || 0) * Math.PI / 180;
    let lacet = deg(bloc.dataset.lacet), tangage = deg(bloc.dataset.tangage);
    let tire = false, dx = 0, dy = 0;
    const LIMITE = Math.PI / 2 - 0.02;   // on ne bascule pas par-dessus les pôles

    /* Champ de vision. Plus il est large, plus on voit de la scene d'un
       coup, au prix de la deformation aux bords, inevitable des qu'on
       aplatit une sphere. Les bornes tiennent le reglage entre un
       tele-objectif et un tres grand angle, au-dela ca ne montre plus
       rien d'utile. */
    const CHAMP_MIN = 0.6, CHAMP_MAX = 2.2;
    const borner = v => Math.max(CHAMP_MIN, Math.min(CHAMP_MAX, v));
    let champ = borner(deg(bloc.dataset.champ) || 1.7);

    /* Molette et pincement : le visiteur cadre comme il veut. */
    bloc.addEventListener('wheel', e => {
      e.preventDefault();
      champ = borner(champ + e.deltaY * 0.0015);
    }, { passive: false });

    let ecart0 = 0, champ0 = 0;
    bloc.addEventListener('touchstart', e => {
      if (e.touches.length !== 2) return;
      ecart0 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                          e.touches[0].clientY - e.touches[1].clientY);
      champ0 = champ;
    }, { passive: true });
    bloc.addEventListener('touchmove', e => {
      if (e.touches.length !== 2 || !ecart0) return;
      e.preventDefault();
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                           e.touches[0].clientY - e.touches[1].clientY);
      champ = borner(champ0 * ecart0 / d);
    }, { passive: false });
    bloc.addEventListener('touchend', () => { ecart0 = 0; }, { passive: true });

    const pointe = e => (e.touches ? e.touches[0] : e);
    bloc.addEventListener('pointerdown', e => {
      tire = true; dx = pointe(e).clientX; dy = pointe(e).clientY;
      bloc.setPointerCapture?.(e.pointerId);
      bloc.dataset.tire = '';
    });
    bloc.addEventListener('pointermove', e => {
      if (!tire) return;
      const p = pointe(e);
      lacet   -= (p.clientX - dx) * 0.005;
      tangage -= (p.clientY - dy) * 0.005;
      tangage = Math.max(-LIMITE, Math.min(LIMITE, tangage));
      dx = p.clientX; dy = p.clientY;
    });
    const relacher = () => { tire = false; delete bloc.dataset.tire; };
    bloc.addEventListener('pointerup', relacher);
    bloc.addEventListener('pointercancel', relacher);
    bloc.addEventListener('pointerleave', relacher);

    /* Clavier : le lecteur doit rester utilisable sans souris. */
    bloc.tabIndex = 0;
    bloc.addEventListener('keydown', e => {
      const pas = 0.12;
      if (e.key === 'ArrowLeft')  lacet += pas;
      else if (e.key === 'ArrowRight') lacet -= pas;
      else if (e.key === 'ArrowUp')    tangage = Math.min(LIMITE, tangage + pas);
      else if (e.key === 'ArrowDown')  tangage = Math.max(-LIMITE, tangage - pas);
      else if (e.key === '+' || e.key === '=') champ = borner(champ - 0.15);
      else if (e.key === '-' || e.key === '_') champ = borner(champ + 0.15);
      else if (e.key === ' ' || e.key === 'Spacebar') {
        const v = bloc._video;
        if (v) { v.paused ? v.play().catch(() => {}) : v.pause(); }
      }
      else return;
      e.preventDefault();
    });

    function dessiner() {
      if (bloc.dataset.arrete !== undefined) return;
      const l = bloc.clientWidth, h = bloc.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (toile.width !== l * dpr || toile.height !== h * dpr) {
        toile.width = l * dpr; toile.height = h * dpr;
        gl.viewport(0, 0, toile.width, toile.height);
      }
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      }
      gl.uniformMatrix4fv(uProj, false, matriceProjection(champ, l / h, 0.1, 100));
      gl.uniformMatrix4fv(uVue,  false, matriceVue(lacet, tangage));
      gl.drawElements(gl.TRIANGLES, g.idx.length, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(dessiner);
    }

    video.addEventListener('loadeddata', () => { bloc.dataset.pret = ''; dessiner(); });

    /* Barre de commandes. Elle est posee en JS et pas dans le HTML :
       tant qu'on n'a pas lance la video, il n'y a rien a commander. */
    const barre = document.createElement('div');
    barre.className = 'video360__barre';
    /* Un bouton de la barre ne doit jamais faire tourner la sphere. */
    barre.addEventListener('pointerdown', e => e.stopPropagation());

    const commande = (classe, action) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'video360__cmd ' + classe;
      b.addEventListener('click', e => { e.stopPropagation(); action(b); });
      barre.appendChild(b);
      return b;
    };

    const lecture = commande('video360__lecture', () => {
      if (video.paused) video.play().catch(() => {}); else video.pause();
    });
    const etatLecture = () => {
      lecture.textContent = video.paused ? 'Lire' : 'Pause';
      lecture.setAttribute('aria-label', video.paused ? 'Reprendre la vidéo' : 'Mettre la vidéo en pause');
    };
    video.addEventListener('play', etatLecture);
    video.addEventListener('pause', etatLecture);
    etatLecture();

    /* Une video qui parle sans bouton pour la taire est une nuisance :
       le commutateur n'existe que si le son existe. */
    if (bloc.hasAttribute('data-son')) {
      const son = commande('video360__son', b => {
        video.muted = !video.muted;
        b.textContent = video.muted ? 'Activer le son' : 'Couper le son';
        b.setAttribute('aria-pressed', String(!video.muted));
      });
      son.textContent = video.muted ? 'Activer le son' : 'Couper le son';
      son.setAttribute('aria-pressed', String(!video.muted));
    }
    bloc.appendChild(barre);

    video.play().catch(() => { bloc.dataset.echec = 'lecture'; });
    bloc._video = video;
    return true;
  }

  /* ══════════════════════════════════════════════════════════════
     PANORAMA DU HERO

     Le fond du hero n'est pas une photo mais un panorama qui tourne
     très lentement : sur une page qui vend des visites virtuelles, le
     fond montre le produit au lieu de le raconter.

     La photo reste dessous et n'est jamais retirée. C'est elle qu'on
     voit si WebGL manque, si la texture tarde, ou si le visiteur a
     demandé moins d'animations, auquel cas on n'initialise rien.

     La boucle s'arrête dès que le hero sort du champ : une rotation
     qu'on ne voit pas n'a aucune raison de consommer du GPU.
     ══════════════════════════════════════════════════════════════ */
  document.querySelectorAll('[data-pano]').forEach(fond => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const toile = document.createElement('canvas');
    const gl = toile.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    const image = new Image();
    image.decoding = 'async';
    image.onerror = () => {};
    image.onload = () => {
      toile.className = 'hero-photo__pano';
      fond.prepend(toile);

      const prog = gl.createProgram();
      gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, SOMMET));
      gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(prog); gl.useProgram(prog);

      const g = sphere();
      const tampon = (data, type, Tableau) => {
        const b = gl.createBuffer();
        gl.bindBuffer(type, b); gl.bufferData(type, new Tableau(data), gl.STATIC_DRAW);
        return b;
      };
      tampon(g.pos, gl.ARRAY_BUFFER, Float32Array);
      const aPos = gl.getAttribLocation(prog, 'position');
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      tampon(g.uvs, gl.ARRAY_BUFFER, Float32Array);
      const aUv = gl.getAttribLocation(prog, 'uv');
      gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
      tampon(g.idx, gl.ELEMENT_ARRAY_BUFFER, Uint16Array);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

      const uProj = gl.getUniformLocation(prog, 'projection');
      const uVue  = gl.getUniformLocation(prog, 'vue');

      const DEPART = parseFloat(fond.dataset.lacet || 0) * Math.PI / 180;
      const TANGAGE = parseFloat(fond.dataset.tangage || 0) * Math.PI / 180;
      const CHAMP = (parseFloat(fond.dataset.champ) || 82) * Math.PI / 180;
      /* Un tour complet en dix minutes : à l'échelle d'une visite, le
         mouvement se sent sans jamais attirer l'œil. */
      const VITESSE = (Math.PI * 2) / 600000;

      let lacet = DEPART, dernier = 0, visible = true, boucle = 0;

      const dessiner = horodatage => {
        boucle = requestAnimationFrame(dessiner);
        if (dernier) lacet += (horodatage - dernier) * VITESSE;
        dernier = horodatage;
        const l = fond.clientWidth, h = fond.clientHeight;
        if (!l || !h) return;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        if (toile.width !== l * dpr || toile.height !== h * dpr) {
          toile.width = l * dpr; toile.height = h * dpr;
          gl.viewport(0, 0, toile.width, toile.height);
        }
        gl.uniformMatrix4fv(uProj, false, matriceProjection(CHAMP, l / h, 0.1, 100));
        gl.uniformMatrix4fv(uVue,  false, matriceVue(lacet, TANGAGE));
        gl.drawElements(gl.TRIANGLES, g.idx.length, gl.UNSIGNED_SHORT, 0);
      };

      const observateur = new IntersectionObserver(entrees => {
        visible = entrees[0].isIntersecting;
        if (visible && !boucle) { dernier = 0; boucle = requestAnimationFrame(dessiner); }
        else if (!visible && boucle) { cancelAnimationFrame(boucle); boucle = 0; }
      });
      observateur.observe(fond);
      fond.dataset.panoPret = '';
    };
    image.src = fond.dataset.pano;
  });

  document.querySelectorAll('[data-video360]').forEach(bloc => {
    const bouton = bloc.querySelector('[data-lire]');
    if (!bouton) return;
    bouton.addEventListener('click', () => {
      bloc.dataset.lance = '';
      if (!demarrer(bloc)) bloc.dataset.lance = undefined;
    }, { once: true });
  });
})();

/* ══════════════════════════════════════════════════════════════════
   VISITE INTEGREE

   La visite vit dans son propre dossier, autonome. On l'ouvre ici dans
   un cadre plutot que d'obliger a quitter la page, mais seulement au
   clic : une visite pese une dizaine de mega, la charger d'office
   ferait payer a chaque visiteur une chose que la plupart ne
   demanderont pas. Tant qu'on n'a rien clique, il n'y a qu'une image.

   Le cadre est en meme origine (X-Frame-Options SAMEORIGIN), et la
   visite n'ayant aucun cookie ni domaine tiers, rien n'est a declarer
   au bandeau de consentement.
   ══════════════════════════════════════════════════════════════════ */
document.querySelectorAll('[data-visite]').forEach(bloc => {
  const bouton = bloc.querySelector('[data-ouvrir]');
  if (!bouton) return;

  const ouvrir = () => {
    const cadre = document.createElement('iframe');
    cadre.src = bloc.dataset.visite;
    cadre.title = bloc.dataset.titre || 'Visite virtuelle 360';
    cadre.loading = 'lazy';
    cadre.allowFullscreen = true;
    bloc.appendChild(cadre);
    /* Le focus suit l'action, sinon le clavier reste derriere le cadre. */
    cadre.addEventListener('load', () => cadre.focus(), { once: true });
    return cadre;
  };

  bouton.addEventListener('click', () => {
    if (bloc.dataset.ouverte !== undefined) return;
    bloc.dataset.ouverte = '';
    ouvrir();
  });

  /* ── choix du lieu ───────────────────────────────────────────────
     Six demonstrations pour six types de lieux. Tant que rien n'est
     ouvert, changer d'onglet ne fait que changer l'affiche : toujours
     aucun megaoctet charge sans qu'on l'ait demande. Une fois la
     visite ouverte, l'onglet remplace le cadre. */
  const choix = document.querySelector(`[data-choix="${bloc.id}"]`);
  if (!choix) return;
  const onglets = [...choix.querySelectorAll('[data-lieu]')];
  const affiche = bloc.querySelector('.visite-integree__affiche');
  const cartel = bloc.querySelector('.visite-integree__cartel');
  const pied = document.querySelector(`[data-pied="${bloc.id}"]`);
  const plein = document.querySelector(`[data-plein="${bloc.id}"]`);

  onglets.forEach(onglet => {
    onglet.addEventListener('click', () => {
      onglets.forEach(o => o.setAttribute('aria-selected', String(o === onglet)));
      bloc.dataset.visite = onglet.dataset.lieu;
      bloc.dataset.titre = onglet.dataset.titre;
      if (affiche) {
        affiche.src = onglet.dataset.affiche;
        affiche.alt = onglet.dataset.alt || '';
      }
      if (cartel) cartel.textContent = onglet.dataset.cartel || '';
      if (pied) pied.innerHTML = onglet.dataset.legende || '';
      if (plein) plein.href = onglet.dataset.lieu;

      const cadre = bloc.querySelector('iframe');
      if (cadre) cadre.remove();
      if (bloc.dataset.ouverte !== undefined) ouvrir();
    });
  });
});
