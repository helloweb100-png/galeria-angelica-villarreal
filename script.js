/* ==========================================================================
   Galería Angélica Villarreal · Comportamiento
   Todo degrada con elegancia: sin anime.js (CDN caída) o sin JS la página se ve completa.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     CONFIGURACIÓN
     Número de WhatsApp del negocio, en formato 52 + 10 dígitos, solo números.
     Mientras esté vacío, el botón flotante y el envío del formulario se ocultan
     y el sitio muestra un aviso elegante en su lugar.
     ====================================================================== */
  const WHATSAPP_NUMERO = '';
  const NEGOCIO = 'Galería Angélica Villarreal';

  /* ---------- Utilidades ---------- */
  const doc = document.documentElement;
  if (window.__avT) { clearTimeout(window.__avT); }   // el script arrancó: cancela el respaldo del <head>

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeO = (t) => 1 - Math.pow(1 - t, 3);
  const seguro = (fn) => { try { return fn(); } catch (e) { return null; } };

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const PIN = doc.classList.contains('js') && !REDUCE;   // efectos ligados al scroll

  /* ---------- WhatsApp ---------- */
  const digitos = String(WHATSAPP_NUMERO).replace(/\D/g, '');
  const wa = digitos.length === 10 ? '52' + digitos : digitos;
  const HAS_WA = wa.length >= 11 && wa.length <= 15;
  const waUrl = (texto) => 'https://wa.me/' + wa + '?text=' + encodeURIComponent(texto);

  /* ---------- Cola de tareas "cuando el cargador termina" ---------- */
  const listoCbs = [];
  const onListo = (fn) => { if (doc.classList.contains('listo')) { seguro(fn); } else { listoCbs.push(fn); } };

  /* ---------- Interpolador: usa anime.js si está disponible, si no requestAnimationFrame ---------- */
  function tween(o) {
    const dur = o.dur || 1000;
    if (window.anime) {
      const obj = { v: 0 };
      window.anime({
        targets: obj, v: 1, duration: dur, easing: o.ease || 'easeOutCubic',
        update: function () { o.update(obj.v); },
        complete: function () { o.update(1); if (o.done) { o.done(); } }
      });
      return;
    }
    const t0 = performance.now();
    const paso = function (now) {
      const t = clamp((now - t0) / dur);
      o.update(easeO(t));
      if (t < 1) { requestAnimationFrame(paso); } else if (o.done) { o.done(); }
    };
    requestAnimationFrame(paso);
  }

  /* ======================================================================
     WHATSAPP: enlaces con mensaje, botón flotante, formulario
     ====================================================================== */
  function iniciarWhatsApp() {
    doc.classList.add(HAS_WA ? 'has-wa' : 'sin-wa');
    if (!HAS_WA) { return; }
    $$('[data-wa]').forEach(function (a) {
      a.href = waUrl(a.dataset.wa);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  function iniciarFormulario() {
    const f = $('#formContacto');
    if (!f) { return; }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!HAS_WA) { return; }
      if (!f.reportValidity()) { return; }
      const d = new FormData(f);
      const nombre = String(d.get('nombre') || '').trim();
      const interes = String(d.get('interes') || '').trim();
      const extra = String(d.get('mensaje') || '').trim();
      let t = 'Hola, soy ' + nombre + '. ' + interes + '.';
      if (extra) { t += ' ' + extra; }
      t += ' Los contacto desde la página de la ' + NEGOCIO + '.';
      window.open(waUrl(t.replace(/\s+/g, ' ').trim()), '_blank', 'noopener');
    });
  }

  /* ======================================================================
     MENÚ MÓVIL
     ====================================================================== */
  function iniciarMenu() {
    const btn = $('#burger');
    const nav = $('#menu');
    if (!btn || !nav) { return; }
    const set = function (abrir) {
      doc.classList.toggle('menu-open', abrir);
      btn.setAttribute('aria-expanded', String(abrir));
      btn.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    };
    btn.addEventListener('click', function () { set(!doc.classList.contains('menu-open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); } });
    window.matchMedia('(min-width: 960px)').addEventListener('change', function () { set(false); });
  }

  /* ======================================================================
     CARGADOR: arco dorado que se llena y cortina que se abre (≤ 2.4 s)
     ====================================================================== */
  function iniciarLoader() {
    const loader = $('#loader');
    const num = $('#loaderNum');
    const arc = $('#loaderArc');
    let hecho = false;
    const fin = function () {
      if (hecho) { return; }
      hecho = true;
      doc.classList.add('listo');
      listoCbs.splice(0).forEach(function (fn) { seguro(fn); });
      if (loader) {
        loader.classList.add('out');
        setTimeout(function () { loader.hidden = true; }, 760);
      }
    };
    if (!loader || !num || !arc) { fin(); return; }
    const CIRC = 2 * Math.PI * 102;
    arc.style.strokeDasharray = String(CIRC);
    arc.style.strokeDashoffset = String(CIRC);
    tween({
      dur: REDUCE ? 450 : 1600, ease: 'easeInOutQuad',
      update: function (v) {
        num.textContent = String(Math.round(v * 100));
        arc.style.strokeDashoffset = String(CIRC * (1 - v));
      },
      done: fin
    });
    setTimeout(fin, 2000);   // seguro: nunca pasa de ~2.4 s en total
  }

  /* ======================================================================
     REVELADOS al entrar en pantalla
     ====================================================================== */
  function iniciarRevelados() {
    const els = $$('.rv');
    if (!els.length) { return; }
    onListo(function () {
      if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
      const io = new IntersectionObserver(function (ens) {
        ens.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
      els.forEach(function (e) { io.observe(e); });
    });
  }

  /* ======================================================================
     CONTADORES (anime.js si está disponible)
     ====================================================================== */
  function iniciarContadores() {
    const els = $$('[data-count]');
    if (!els.length) { return; }
    if (PIN) { els.forEach(function (el) { el.textContent = '0'; }); }
    onListo(function () {
      if (!PIN || !('IntersectionObserver' in window)) {
        els.forEach(function (el) { el.textContent = el.dataset.count; });
        return;
      }
      const io = new IntersectionObserver(function (ens) {
        ens.forEach(function (en) {
          if (!en.isIntersecting) { return; }
          const el = en.target;
          const to = parseInt(el.dataset.count, 10) || 0;
          io.unobserve(el);
          tween({ dur: 2200, ease: 'easeOutExpo', update: function (v) { el.textContent = String(Math.round(v * to)); } });
        });
      }, { threshold: .6 });
      els.forEach(function (el) { io.observe(el); });
    });
  }

  /* ======================================================================
     MANIFIESTO: las palabras se encienden con el scroll
     ====================================================================== */
  function iniciarPalabras() {
    const box = $('[data-words]');
    if (!box || !PIN) { return null; }
    const texto = box.textContent.replace(/\s+/g, ' ').trim();
    box.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = texto;
    box.appendChild(sr);
    const spans = texto.split(' ').map(function (palabra) {
      const s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = palabra + ' ';
      box.appendChild(s);
      return s;
    });
    return function (vh) {
      const r = box.getBoundingClientRect();
      const p = clamp((vh * .86 - r.top) / (vh * .45 + r.height));
      const n = Math.round(p * spans.length);
      spans.forEach(function (s, i) { s.classList.toggle('on', i < n); });
    };
  }

  /* ======================================================================
     TELÓN: la pintura se abre hasta ocupar toda la pantalla
     ====================================================================== */
  function iniciarTelon() {
    const sec = $('[data-telon]');
    if (!sec || !PIN) { return null; }
    return function (vh) {
      const r = sec.getBoundingClientRect();
      const total = r.height - vh;
      const p = total > 0 ? clamp(-r.top / total) : 1;
      sec.style.setProperty('--e', easeIO(clamp(p / .68)).toFixed(4));
      sec.style.setProperty('--t', clamp((p - .55) / .3).toFixed(3));
    };
  }

  /* ======================================================================
     SERIES: el scroll vertical desplaza la sala hacia un lado
     ====================================================================== */
  function iniciarTrack() {
    const sec = $('[data-pin]');
    const track = sec && $('[data-track]', sec);
    if (!sec || !track || !PIN) { return null; }
    const bar = $('.series__bar', sec);
    let maxX = 0;
    const medir = function () {
      maxX = Math.max(0, track.scrollWidth - doc.clientWidth);
      sec.style.setProperty('--pin-h', Math.round(maxX + window.innerHeight) + 'px');
    };
    medir();
    window.addEventListener('resize', medir);
    window.addEventListener('load', medir);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(medir); }
    return function (vh) {
      const r = sec.getBoundingClientRect();
      const total = r.height - vh;
      const p = total > 0 ? clamp(-r.top / total) : 0;
      track.style.transform = 'translate3d(' + (-(p * maxX)).toFixed(1) + 'px,0,0)';
      if (bar) { bar.style.setProperty('--sp', p.toFixed(4)); }
    };
  }

  /* ======================================================================
     VISITA: la línea dorada avanza con el scroll
     ====================================================================== */
  function iniciarPasos() {
    const box = $('[data-steps]');
    if (!box || !PIN) { return null; }
    const pasos = $$('.step', box);
    return function (vh) {
      const r = box.getBoundingClientRect();
      const p = clamp((vh * .72 - r.top) / r.height);
      box.style.setProperty('--tp', p.toFixed(3));
      pasos.forEach(function (s, i) { s.classList.toggle('on', p > (i + .25) / pasos.length); });
    };
  }

  /* ======================================================================
     HERO: inclinación 3D con el puntero + vaivén constante + paralaje
     ====================================================================== */
  function iniciarHero() {
    const hero = $('.hero');
    const stage = $('.stage');
    const wrap = $('.hero__stage');
    if (!hero || !stage) { return null; }
    let tx = 0, ty = 0, cx = 0, cy = 0, visible = true;
    if (FINE) {
      hero.addEventListener('pointermove', function (e) {
        const r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - .5) * 2;
        ty = ((e.clientY - r.top) / r.height - .5) * 2;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ens) { visible = ens[0].isIntersecting; }).observe(hero);
    }
    if (!REDUCE) {
      (function bucle(now) {
        requestAnimationFrame(bucle);
        if (!visible) { return; }
        const t = now / 1000;
        cx = lerp(cx, tx, .06);
        cy = lerp(cy, ty, .06);
        stage.style.setProperty('--ry', (cx * 11 + Math.sin(t * .55) * 5).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (-cy * 8 + Math.cos(t * .42) * 2.5).toFixed(2) + 'deg');
      })(performance.now());
    }
    return function (vh, y) {
      if (REDUCE || !wrap || y > vh * 1.3) { return; }
      wrap.style.translate = '0 ' + (y * .1).toFixed(1) + 'px';
    };
  }

  /* ======================================================================
     POLVO DE ORO (canvas): partículas que suben y reaccionan al puntero
     ====================================================================== */
  function crearPolvo(canvas, opc) {
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (!ctx) { return; }
    const o = Object.assign({ color: '230,182,97', dens: 15000, max: 90, vel: 16, alpha: 1 }, opc || {});
    const caja = canvas.parentElement;
    let w = 1, h = 1, P = [], visible = false, raf = 0, last = 0, mx = -999, my = -999;

    const nueva = function (ini) {
      return {
        x: Math.random() * w, y: ini ? Math.random() * h : h + 12,
        r: .6 + Math.random() * 2, vy: -(5 + Math.random() * o.vel), vx: (Math.random() - .5) * 6,
        ph: Math.random() * 6.283, tw: .6 + Math.random() * 1.4, al: (.35 + Math.random() * .65) * o.alpha
      };
    };
    const pintar = function (now, dt) {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(now / 1800 + p.ph) * 6) * dt;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 9000) {
          const d = Math.sqrt(d2) || 1, f = (1 - d2 / 9000) * 70 * dt;
          p.x += dx / d * f; p.y += dy / d * f;
        }
        if (p.y < -12) { P[i] = nueva(false); continue; }
        if (p.x < -12) { p.x = w + 12; } else if (p.x > w + 12) { p.x = -12; }
        const a = (.3 + .7 * Math.abs(Math.sin(now / 900 * p.tw + p.ph))) * p.al;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + o.color + ',' + (a * .14).toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r * 4, 0, 6.283);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + o.color + ',' + a.toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
    };
    const bucle = function (now) {
      raf = requestAnimationFrame(bucle);
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      pintar(now, dt);
    };
    const medir = function () {
      const r = caja.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(o.max, Math.round(w * h / o.dens));
      P = Array.from({ length: n }, function () { return nueva(true); });
      if (REDUCE) { pintar(performance.now(), 0); }
    };
    medir();
    window.addEventListener('resize', medir);
    if (REDUCE) { return; }
    caja.addEventListener('pointermove', function (e) {
      const r = caja.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });
    caja.addEventListener('pointerleave', function () { mx = -999; my = -999; });
    const arrancar = function (v) {
      if (v && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(bucle); }
      if (!v && visible) { visible = false; cancelAnimationFrame(raf); }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ens) { arrancar(ens[0].isIntersecting); }).observe(caja);
    } else { arrancar(true); }
  }

  /* ======================================================================
     CARRUSEL 3D: gira solo, se acelera con el scroll y se arrastra
     ====================================================================== */
  function iniciarOrbita() {
    const box = $('[data-orbit]');
    if (!box) { return null; }
    const ring = $('.orbit__ring', box);
    const items = $$('.orbit__item', ring);
    const n = items.length;
    if (!n) { return null; }
    let rot = 0, vel = 0, drag = false, lastX = 0, movido = 0, visible = false, R = 0, boost = 0;

    const distribuir = function () {
      const f = $('.frame', items[0]);
      const cw = (f && f.offsetWidth) || 200;
      R = Math.round((cw / 2) / Math.tan(Math.PI / n) * 1.1);
      items.forEach(function (it, i) {
        it.style.transform = 'rotateY(' + (i * 360 / n) + 'deg) translateZ(' + R + 'px) translateY(-50%)';
      });
    };
    distribuir();
    window.addEventListener('resize', distribuir);
    window.addEventListener('load', distribuir);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ens) { visible = ens[0].isIntersecting; }, { rootMargin: '120px' }).observe(box);
    } else { visible = true; }

    box.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) { return; }
      drag = true; movido = 0; lastX = e.clientX; box.classList.add('grab');
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) { return; }
      const dx = e.clientX - lastX;
      lastX = e.clientX; movido += Math.abs(dx);
      rot += dx * .32; vel = dx * .32;
    }, { passive: true });
    const fin = function () { drag = false; box.classList.remove('grab'); };
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);
    // si el gesto fue un arrastre, no abras el visor
    box.addEventListener('click', function (e) {
      if (movido > 6) { e.preventDefault(); e.stopPropagation(); movido = 0; }
    }, true);

    let ult = performance.now();
    (function bucle(now) {
      requestAnimationFrame(bucle);
      const dt = Math.min(.05, (now - ult) / 1000);
      ult = now;
      if (!visible) { return; }
      if (!drag) {
        vel = lerp(vel, 0, .05);
        rot += (REDUCE ? 0 : (9 + boost) * dt) + vel;
      }
      boost *= .93;
      ring.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + rot.toFixed(2) + 'deg)';
    })(ult);

    return { boost: function (v) { boost = clamp(boost + v * .3, -45, 45); } };
  }

  /* ======================================================================
     MIRADA GUIADA: puntos dorados sobre la pintura
     ====================================================================== */
  function iniciarHotspots() {
    const hs = $$('.hs');
    if (!hs.length) { return; }
    const cerrar = function () { hs.forEach(function (x) { x.classList.remove('open'); x.setAttribute('aria-expanded', 'false'); }); };
    hs.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        const abierto = b.classList.contains('open');
        cerrar();
        if (!abierto) { b.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
      });
    });
    document.addEventListener('click', cerrar);
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') { cerrar(); } });
  }

  /* ======================================================================
     INCLINACIÓN 3D en marcos (solo con ratón)
     ====================================================================== */
  function iniciarTilt() {
    if (!FINE || REDUCE) { return; }
    $$('[data-tilt]').forEach(function (el) {
      const fr = $('.frame', el);
      if (!fr) { return; }
      el.addEventListener('pointermove', function (e) {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        fr.style.transform = 'perspective(1000px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg) scale(1.02)';
      });
      el.addEventListener('pointerleave', function () { fr.style.transform = ''; });
    });
  }

  /* ======================================================================
     CURSOR DORADO (solo con ratón; no oculta el cursor del sistema)
     ====================================================================== */
  function iniciarCursor() {
    if (!FINE || REDUCE) { return; }
    const c = $('.cursor');
    if (!c) { return; }
    const txt = $('span', c);
    doc.classList.add('has-cursor');
    let x = -100, y = -100, cx = -100, cy = -100;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      c.classList.add('on');
      const t = e.target;
      const ver = t && t.closest ? t.closest('[data-obra], [data-coleccion], [data-orbit]') : null;
      const enlace = t && t.closest ? t.closest('a, button, summary, input, select, textarea') : null;
      c.classList.toggle('is-view', !!ver);
      c.classList.toggle('is-link', !ver && !!enlace);
      if (txt && ver) { txt.textContent = ver.hasAttribute('data-orbit') && !t.closest('[data-obra]') ? 'Girar' : 'Ver'; }
    }, { passive: true });
    doc.addEventListener('mouseleave', function () { c.classList.remove('on'); });
    (function bucle() {
      requestAnimationFrame(bucle);
      cx = lerp(cx, x, .2); cy = lerp(cy, y, .2);
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
    })();
  }

  /* ======================================================================
     COLECCIONES: series completas que se recorren en el visor.
     Cada foto es [archivo sin extensión, ancho, alto] y el orden es el de recorrido
     (en el Viacrucis, el de las estaciones: la 1.ª foto es la Estación 1, y así sucesivamente).
     ====================================================================== */
  const COLECCIONES = {
    viacrucis: {
      titulo: 'Viacrucis', etiqueta: 'Estación', ruta: 'assets/img/colecciones/viacrucis/',
      desc: 'Estación por estación, el camino del Viacrucis llevado al lienzo con toda la intensidad del pincel.',
      fotos: [['01',840,1400],['02',830,1400],['03',829,1400],['04',847,1400],['05',826,1400],['06',823,1400],['07',828,1400],['08',832,1400],['09',803,1400],['10',809,1400],['11',836,1400],['12',826,1400],['13',838,1400],['14',855,1400],['15',827,1400]]
    },
    flor: {
      titulo: 'Flor del desierto', ruta: 'assets/img/colecciones/flor-del-desierto/',
      desc: 'El desierto también florece: color, espina y luz en una colección que huele a tierra caliente.',
      fotos: [['01',1123,1400],['02',930,1400],['03',1056,1400],['04',1059,1400],['05',1049,1400],['06',1053,1400],['07',929,1400],['08',1053,1400],['09',1044,1400],['10',844,1400],['11',844,1400],['12',703,1400],['13',974,1400],['14',702,1400],['15',975,1400],['16',685,1400],['17',938,1400],['18',941,1400],['19',919,1400],['20',1060,1400],['21',696,1400],['22',703,1400],['23',1078,1400],['24',923,1400],['25',916,1400],['26',926,1400],['27',930,1400],['28',907,1400],['29',915,1400],['30',919,1400],['31',1049,1400]]
    },
    vangogh: {
      titulo: 'Van Gogh', ruta: 'assets/img/colecciones/van-gogh/',
      desc: 'Representación de obras de Vincent van Gogh: la artista conversa con el maestro, pincelada a pincelada.',
      fotos: [['01',1038,1400],['02',1400,1168],['03',1400,1044],['04',1400,934],['05',1400,1120],['06',1400,704],['07',1117,1400],['08',1400,1117],['09',1117,1400],['10',1119,1400],['11',1165,1400],['12',1400,1162],['13',1400,1182],['14',758,1400],['15',886,1400],['16',695,1400],['17',1400,1173],['18',1161,1400],['19',1157,1400],['20',1400,1171],['21',1400,1159],['22',1400,1163],['23',1400,1109],['24',1400,1083],['25',1080,1400],['26',1400,1107],['27',1400,1097],['28',1400,1096],['29',1400,1099],['30',1400,1106]]
    }
  };

  /* ======================================================================
     VISOR DE OBRA (lightbox) con navegación y mensaje de WhatsApp por obra
     ====================================================================== */
  function iniciarVisor() {
    const lb = $('#lightbox');
    if (!lb) { return; }
    const stage = $('#lbStage');
    const tTitle = $('#lbTitle');
    const tMeta = $('#lbMeta');
    const cta = $('#lbCta');
    const grid = $$('#obras [data-obra], #apariciones [data-obra], #diversas [data-obra]');
    const ids = grid.map(function (b) { return b.dataset.obra; });
    let actual = 0, ultimo = null, timer = 0, sx = 0;
    let col = null;   // colección abierta (Viacrucis, Flor del desierto, Van Gogh); null si se mira una obra suelta

    const pintarObra = function (i) {
      actual = (i + ids.length) % ids.length;
      const src = grid[actual];
      const frame = $('.frame', src).cloneNode(true);
      $$('img', frame).forEach(function (im) { im.loading = 'eager'; });
      stage.replaceChildren(frame);
      stage.classList.remove('swap');
      void stage.offsetWidth;
      stage.classList.add('swap');
      tTitle.textContent = src.dataset.titulo || '';
      tMeta.textContent = src.dataset.desc || '';
      if (HAS_WA) {
        cta.href = waUrl('Hola, me interesa la obra “' + (src.dataset.titulo || '') + '” que vi en la página de la ' + NEGOCIO + '. ¿Me comparten información?');
        cta.target = '_blank'; cta.rel = 'noopener';
      } else {
        cta.href = '#contacto'; cta.removeAttribute('target'); cta.removeAttribute('rel');
      }
    };
    // Una foto de una colección: se arma al momento y solo se pide al servidor la que se está viendo (más la vecina)
    const pintarColeccion = function (i) {
      const n = col.fotos.length;
      actual = (i + n) % n;
      const f = col.fotos[actual];
      const num = actual + 1;
      const titulo = col.titulo + ' · ' + (col.etiqueta ? col.etiqueta + ' ' + num : num + ' de ' + n);
      const frame = document.createElement('span');
      frame.className = 'frame';
      frame.style.setProperty('--arn', (f[1] / f[2]).toFixed(4));
      const crop = document.createElement('span');
      crop.className = 'crop';
      const im = document.createElement('img');
      im.src = col.ruta + f[0] + '.jpg';
      im.width = f[1]; im.height = f[2];
      im.alt = 'Pintura de la serie ' + col.titulo + (col.etiqueta ? ', ' + col.etiqueta.toLowerCase() + ' ' + num : ', obra ' + num + ' de ' + n);
      im.decoding = 'async';
      crop.appendChild(im);
      frame.appendChild(crop);
      stage.replaceChildren(frame);
      stage.classList.remove('swap');
      void stage.offsetWidth;
      stage.classList.add('swap');
      tTitle.textContent = titulo;
      tMeta.textContent = col.desc;
      if (HAS_WA) {
        cta.href = waUrl('Hola, me interesa la obra “' + titulo + '” que vi en la página de la ' + NEGOCIO + '. ¿Me comparten información?');
        cta.target = '_blank'; cta.rel = 'noopener';
      } else {
        cta.href = '#contacto'; cta.removeAttribute('target'); cta.removeAttribute('rel');
      }
      [actual + 1, actual - 1].forEach(function (j) { const g = col.fotos[(j + n) % n]; new Image().src = col.ruta + g[0] + '.jpg'; });
    };
    const pintar = function (i) { if (col) { pintarColeccion(i); } else { pintarObra(i); } };
    const abrirColeccion = function (id, trigger) {
      if (!COLECCIONES[id]) { return; }
      clearTimeout(timer);
      col = COLECCIONES[id];
      ultimo = trigger || document.activeElement;
      pintar(0);
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add('open'); });
      doc.classList.add('lb-open');
      const cerrarBtn = $('.lb__close', lb);
      if (cerrarBtn) { cerrarBtn.focus(); }
    };
    const abrir = function (id, trigger) {
      const i = ids.indexOf(id);
      if (i < 0) { return; }
      col = null;
      clearTimeout(timer);
      ultimo = trigger || document.activeElement;
      pintar(i);
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add('open'); });
      doc.classList.add('lb-open');
      const cerrarBtn = $('.lb__close', lb);
      if (cerrarBtn) { cerrarBtn.focus(); }
    };
    const cerrar = function () {
      if (lb.hidden) { return; }
      lb.classList.remove('open');
      doc.classList.remove('lb-open');
      timer = setTimeout(function () { lb.hidden = true; stage.replaceChildren(); }, 360);
      if (ultimo && ultimo.focus) { ultimo.focus({ preventScroll: true }); }
    };

    document.addEventListener('click', function (e) {
      const t = e.target;
      if (!t || !t.closest) { return; }
      const dispCol = t.closest('[data-coleccion]');
      if (dispCol && !lb.contains(dispCol)) { e.preventDefault(); abrirColeccion(dispCol.dataset.coleccion, dispCol); return; }
      const disp = t.closest('[data-obra]');
      if (disp && !lb.contains(disp)) { e.preventDefault(); abrir(disp.dataset.obra, disp); return; }
      if (t.closest('[data-lb-close]') || t === lb || t === stage) { cerrar(); return; }
      if (t.closest('[data-lb-prev]')) { pintar(actual - 1); return; }
      if (t.closest('[data-lb-next]')) { pintar(actual + 1); }
    });
    window.addEventListener('keydown', function (e) {
      if (lb.hidden) { return; }
      if (e.key === 'Escape') { cerrar(); }
      else if (e.key === 'ArrowLeft') { pintar(actual - 1); }
      else if (e.key === 'ArrowRight') { pintar(actual + 1); }
      else if (e.key === 'Tab') {
        const foco = $$('button, a[href]', lb).filter(function (el) { return el.offsetParent !== null; });
        if (!foco.length) { return; }
        const a = foco[0], z = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { pintar(actual + (dx < 0 ? 1 : -1)); }
    }, { passive: true });
  }

  /* ======================================================================
     MOTOR DE SCROLL: una sola lectura por fotograma
     ====================================================================== */
  const tareas = [];
  const estado = { y: window.scrollY, vel: 0 };
  let pendiente = false;

  function fotograma() {
    pendiente = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    estado.vel = y - estado.y;
    estado.y = y;
    for (let i = 0; i < tareas.length; i++) { seguro(function () { tareas[i](vh, y); }); }
  }
  function alScroll() { if (!pendiente) { pendiente = true; requestAnimationFrame(fotograma); } }

  /* ======================================================================
     ARRANQUE
     ====================================================================== */
  function init() {
    seguro(iniciarWhatsApp);
    seguro(iniciarFormulario);
    seguro(iniciarMenu);
    seguro(iniciarRevelados);
    seguro(iniciarContadores);
    seguro(iniciarTilt);
    seguro(iniciarCursor);
    seguro(iniciarHotspots);
    seguro(iniciarVisor);

    const anio = $('#anio');
    if (anio) { anio.textContent = String(new Date().getFullYear()); }

    // Barra de progreso + encabezado
    const barra = $('.progress');
    const header = $('.site-header');
    tareas.push(function (vh, y) {
      const max = doc.scrollHeight - vh;
      if (barra) { barra.style.setProperty('--sp', max > 0 ? clamp(y / max).toFixed(4) : '0'); }
      if (header) { header.classList.toggle('is-stuck', y > 30); }
    });

    [seguro(iniciarPalabras), seguro(iniciarTelon), seguro(iniciarTrack), seguro(iniciarPasos), seguro(iniciarHero)]
      .forEach(function (t) { if (t) { tareas.push(t); } });

    const orbita = seguro(iniciarOrbita);
    if (orbita) { tareas.push(function () { orbita.boost(estado.vel); }); }

    seguro(function () { crearPolvo($('#dustHero'), { color: '201,146,46', dens: 17000, max: 70, vel: 14, alpha: .9 }); });
    seguro(function () { crearPolvo($('#dustNight'), { color: '230,182,97', dens: 12000, max: 110, vel: 20, alpha: 1 }); });

    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll);
    window.addEventListener('load', alScroll);
    fotograma();

    seguro(iniciarLoader);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
