// Год в футере
var y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// Плавное появление блоков
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

// Счётчики в статистике
var cio = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (!e.isIntersecting) return;
    var el = e.target;
    var target = +el.dataset.count;
    var suffix = el.dataset.suffix || '';
    var dur = 1100;
    var t0 = performance.now();
    (function tick(now) {
      var p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    cio.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

// Световое пятно под курсором на карточках
document.querySelectorAll('.card, .tile').forEach(function (card) {
  card.addEventListener('pointermove', function (ev) {
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100) + '%');
    card.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100) + '%');
  });
});

// Копирование в буфер (Discord и не только)
document.querySelectorAll('[data-copy]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var text = btn.getAttribute('data-copy');
    var done = function () {
      var old = btn.textContent;
      btn.textContent = 'Скопировано ✓';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = old;
        btn.classList.remove('copied');
      }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  });
});

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

/* ============================================================
   ПАСХАЛКА: секретное слово + скрытый «режим ORBITA»
   - напечатай "orbita" на любой странице (просто начни набирать)
   - или удерживай логотип ~1.5 секунды (удобно на телефоне)
   - или в консоли выполни: orbita()
   - Esc / кнопка справа внизу — выключить
   ============================================================ */
(function () {
  var SECRET = 'orbita';
  var STORE_KEY = 'orbita-mode-activations';
  var active = false;
  var buffer = '';
  var canvas = null, ctx = null, rafId = 0, pill = null, scan = null;
  var stars = [], sparks = [], W = 0, H = 0, dpr = 1;
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Подсказка тем, кто открывает консоль
  console.log('%c🛰  DECT2868 · ORBITA UPLINK READY', 'color:#3fe0ff;font:bold 15px monospace');
  console.log('%cСекрет: напечатай на странице слово %cORBITA%c — просто начни набирать клавишами. Esc выключает режим. Или выполни в консоли %corbita()%c.',
    'color:#98a0bd;font:13px monospace',
    'color:#8b7bff;font:bold 13px monospace',
    'color:#98a0bd;font:13px monospace',
    'color:#ffb648;font:bold 13px monospace',
    'color:#98a0bd;font:13px monospace');

  // Подготовка заголовков для глитч-эффекта
  document.querySelectorAll('.grad').forEach(function (el) {
    el.setAttribute('data-text', el.textContent);
  });

  /* ---------- Уведомление ---------- */
  function toast(title, text) {
    var t = document.createElement('div');
    t.className = 'toast';
    var b = document.createElement('b');
    b.textContent = title;
    var s = document.createElement('span');
    s.textContent = text;
    t.appendChild(b);
    t.appendChild(s);
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 500);
    }, 4500);
  }

  /* ---------- Кнопка-пилюля «режим включён» ---------- */
  function ensurePill() {
    if (pill) return pill;
    pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'mode-pill';
    var dot = document.createElement('span');
    dot.className = 'mp-dot';
    var label = document.createElement('span');
    label.className = 'mp-label';
    label.textContent = 'ORBITA MODE';
    var off = document.createElement('span');
    off.className = 'mp-off';
    off.textContent = 'Esc · выключить';
    pill.appendChild(dot);
    pill.appendChild(label);
    pill.appendChild(off);
    pill.addEventListener('click', function () { setMode(false); });
    document.body.appendChild(pill);
    return pill;
  }

  /* ---------- Сканлайны поверх страницы ---------- */
  function ensureScan() {
    if (scan) return scan;
    scan = document.createElement('div');
    scan.className = 'fx-scan';
    document.body.appendChild(scan);
    return scan;
  }

  /* ---------- Частицы: звёзды + фейерверк ---------- */
  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(window.innerWidth * dpr);
    H = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }

  function seed() {
    stars = [];
    var n = Math.min(130, Math.round(window.innerWidth / 11));
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: (Math.random() * 1.5 + 0.4) * dpr,
        vx: (Math.random() - 0.5) * 0.3 * dpr,
        vy: (-Math.random() * 0.4 - 0.05) * dpr,
        a: Math.random() * 0.5 + 0.3,
        tw: Math.random() * 6.28
      });
    }
  }

  function burst() {
    for (var i = 0; i < 80; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = (Math.random() * 5.5 + 1.2) * dpr;
      sparks.push({
        x: W / 2, y: H / 2,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: (Math.random() * 2 + 1) * dpr,
        life: 1,
        decay: 0.011 + Math.random() * 0.016
      });
    }
  }

  function frame() {
    rafId = requestAnimationFrame(frame);
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx;
      s.y += s.vy;
      s.tw += 0.03;
      if (s.y < -5) s.y = H + 5;
      if (s.x < -5) s.x = W + 5;
      if (s.x > W + 5) s.x = -5;
      ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(s.tw));
      ctx.fillStyle = i % 5 === 0 ? '#3fe0a0' : '#cfe9ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.283);
      ctx.fill();
    }

    for (var j = sparks.length - 1; j >= 0; j--) {
      var p = sparks[j];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy = p.vy * 0.97 + 0.03 * dpr;
      p.life -= p.decay;
      if (p.life <= 0) { sparks.splice(j, 1); continue; }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = '#7dffdc';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, 6.283);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function startFX() {
    if (reduced) return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'fx-canvas';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      window.addEventListener('resize', function () { resize(); seed(); });
    }
    resize();
    seed();
    cancelAnimationFrame(rafId);
    frame();
  }

  function stopFX() {
    cancelAnimationFrame(rafId);
    sparks = [];
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  /* ---------- Включение/выключение режима ---------- */
  function setMode(on) {
    if (on === active) return;
    active = on;
    document.body.classList.toggle('secret-on', on);

    if (on) {
      var n = 1;
      try {
        n = (parseInt(localStorage.getItem(STORE_KEY), 10) || 0) + 1;
        localStorage.setItem(STORE_KEY, String(n));
      } catch (e) {}
      ensureScan();
      ensurePill().classList.add('on');
      startFX();
      burst();
      toast('🛰  Режим ORBITA включён',
        n > 1
          ? 'С возвращением, путешественник! Это твой визит №' + n + ' в режим.'
          : 'Секретное слово найдено. Выключить — Esc или кнопка справа внизу.');
    } else {
      stopFX();
      if (pill) pill.classList.remove('on');
      toast('Режим ORBITA выключен', 'Обычная вселенная восстановлена.');
    }
  }

  /* ---------- Ввод секретного слова ---------- */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

    if (e.key === 'Escape' && active) { setMode(false); return; }
    if (e.key.length !== 1) return;

    buffer = (buffer + e.key.toLowerCase()).slice(-24);
    if (buffer.indexOf(SECRET) !== -1) {
      buffer = '';
      setMode(!active);
    }
  });

  /* ---------- Удержание логотипа (для телефонов) ---------- */
  document.querySelectorAll('.logo').forEach(function (el) {
    var timer = null;
    var start = function () {
      timer = setTimeout(function () { timer = null; setMode(!active); }, 1500);
    };
    var cancel = function () {
      if (timer) { clearTimeout(timer); timer = null; }
    };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointerleave', cancel);
    el.addEventListener('pointercancel', cancel);
  });

  // Команда для консоли: orbita()
  window.orbita = function () {
    setMode(!active);
    return active ? 'ORBITA MODE: ON' : 'ORBITA MODE: OFF';
  };
})();
