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
      var r = btn.getBoundingClientRect();
      confettiAt(r.left + r.width / 2, r.top + r.height / 2, 16);
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
   СИСТЕМА ПАСХАЛОК: реестр, награды и новые эффекты
   - слово ORBITA  → скрытый космический режим
   - Konami-код    → радужный режим + конфетти
   - слово DEBUG   → режим отладки (рамки всех элементов)
   - 5 кликов по подсказке в футере → хакерский терминал
   - клавиша ?     → шпаргалка по секретам
   Прогресс хранится в localStorage, страница «Секреты» показывает его.
   ============================================================ */
var EGGS = [
  { id: 'orbita', name: 'Режим ORBITA', hint: 'слово из 6 букв — название флагман-проекта',
    effect: 'Скрытый космический режим: звёзды, глитч заголовка и своя палитра' },
  { id: 'konami', name: 'Konami-код', hint: 'стрелки: ↑↑↓↓←→←→ и B A',
    effect: 'Радужный режим всего сайта и конфетти на весь экран' },
  { id: 'debug', name: 'Режим отладки', hint: 'слово из 5 букв — как в DevTools',
    effect: 'Подсвечиваются рамки всех элементов страницы' },
  { id: 'hacker', name: 'Хакерский терминал', hint: '5 кликов по подсказке в футере',
    effect: 'Сайт превращается в зелёный моноширинный терминал' },
  { id: 'cheat', name: 'Шпаргалка', hint: 'клавиша вопроса на клавиатуре',
    effect: 'Мгновенные подсказки по ещё не найденным секретам' }
];
var EGG_STORE = 'vizitka-eggs';

function eggList() {
  try { return JSON.parse(localStorage.getItem(EGG_STORE)) || []; } catch (e) { return []; }
}
function eggIsFound(id) { return eggList().indexOf(id) !== -1; }
function eggMeta(id) {
  for (var i = 0; i < EGGS.length; i++) if (EGGS[i].id === id) return EGGS[i];
  return null;
}
function eggFound(id) {
  if (!id || eggIsFound(id)) return false;
  var list = eggList();
  list.push(id);
  try { localStorage.setItem(EGG_STORE, JSON.stringify(list)); } catch (e) {}
  var meta = eggMeta(id);
  vizToast('⭐ Пасхалка найдена: ' + (meta ? meta.name : id),
    'Открыто ' + list.length + ' из ' + EGGS.length + ' секретов. Страница «Секреты» обновлена.');
  try {
    document.dispatchEvent(new CustomEvent('eggfound', { detail: { id: id, total: list.length } }));
  } catch (e) {}
  return true;
}

/* ---------- Общее уведомление ---------- */
function restackToasts() {
  var list = document.querySelectorAll('.toast');
  for (var i = 0; i < list.length; i++) list[i].style.setProperty('--ti', i);
}
function vizToast(title, text) {
  // Больше четырёх уведомлений — самое старое закрываем
  var all = document.querySelectorAll('.toast');
  if (all.length >= 4 && all[0].parentNode) all[0].parentNode.removeChild(all[0]);

  var t = document.createElement('div');
  t.className = 'toast';
  var b = document.createElement('b');
  b.textContent = title;
  var s = document.createElement('span');
  s.textContent = text;
  t.appendChild(b);
  t.appendChild(s);
  document.body.appendChild(t);
  restackToasts();
  requestAnimationFrame(function () { t.classList.add('show'); });
  setTimeout(function () {
    t.classList.remove('show');
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
      restackToasts();
    }, 500);
  }, 4500);
}

/* ---------- Конфетти ---------- */
function confettiAt(x, y, n) {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) {}
  var colors = ['#3fe0a0', '#3fe0ff', '#8b7bff', '#ffb648', '#ff5f8f', '#ffffff'];
  for (var i = 0; i < n; i++) {
    var s = document.createElement('span');
    s.className = 'confetti';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.background = colors[i % colors.length];
    s.style.setProperty('--tx', (Math.random() * 260 - 130).toFixed(0) + 'px');
    s.style.setProperty('--ty', (Math.random() * 320 + 120).toFixed(0) + 'px');
    s.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
    s.style.setProperty('--d', (Math.random() * 0.35).toFixed(2) + 's');
    document.body.appendChild(s);
    (function (el) {
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1900);
    })(s);
  }
}
function confettiRain() {
  var w = window.innerWidth;
  for (var i = 0; i < 6; i++) confettiAt((w / 6) * (i + 0.5) - Math.random() * 60, -8, 14);
}

/* ---------- Секретная страница «Секреты» ---------- */
(function renderSecrets() {
  var wrap = document.querySelector('[data-egg-list]');
  if (!wrap) return;
  var cards = wrap.querySelectorAll('.egg-card');

  function update() {
    var found = 0;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var ok = eggIsFound(c.getAttribute('data-egg'));
      if (ok) {
        found++;
        if (!c.classList.contains('found')) {
          c.classList.add('found');
          var st = c.querySelector('.ec-state');
          if (st) st.textContent = 'найдено ✓';
        }
      }
    }
    var cnt = document.getElementById('egg-count');
    if (cnt) cnt.textContent = found;
    var bar = document.getElementById('egg-bar');
    if (bar) bar.style.width = (found / EGGS.length * 100) + '%';
    var note = document.getElementById('egg-note');
    if (note) {
      note.textContent = found === EGGS.length
        ? 'Все секреты найдены — ты настоящий исследователь сайта.'
        : 'Найдено ' + found + ' из ' + EGGS.length + '. Подсказки есть на карточках.';
    }
    var reset = document.getElementById('egg-reset');
    if (reset) reset.style.display = found ? '' : 'none';
  }

  document.addEventListener('eggfound', update);
  update();

  var reset = document.getElementById('egg-reset');
  if (reset) {
    reset.addEventListener('click', function () {
      try { localStorage.removeItem(EGG_STORE); } catch (e) {}
      update();
      document.querySelectorAll('.egg-card.found').forEach(function (c) {
        c.classList.remove('found');
        var st = c.querySelector('.ec-state');
        if (st) st.textContent = 'не найдено';
      });
      vizToast('Прогресс сброшен', 'Все 5 секретов снова скрыты. Охота начинается заново.');
    });
  }
})();

/* ---------- Konami-код → радуга ---------- */
var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
var kIdx = 0;
var dbgBuf = '';

function toggleRainbow() {
  var on = !document.body.classList.contains('rainbow-on');
  document.body.classList.toggle('rainbow-on', on);
  if (on) {
    eggFound('konami');
    confettiRain();
    vizToast('🌈 Konami-код принят', 'Радужный режим включён. Введи код ещё раз, чтобы выключить.');
  } else {
    vizToast('Радуга ушла', 'Обычные цвета восстановлены.');
  }
}
function toggleDebug() {
  var on = !document.body.classList.contains('debug-on');
  document.body.classList.toggle('debug-on', on);
  if (on) {
    eggFound('debug');
    vizToast('🛠 Режим отладки включён', 'Видны рамки всех элементов. Напиши DEBUG ещё раз, чтобы выключить.');
  } else {
    vizToast('Режим отладки выключен', 'Страница снова чистая.');
  }
}
function showCheat() {
  var isNew = eggFound('cheat');
  var left = [];
  for (var i = 0; i < EGGS.length; i++) if (!eggIsFound(EGGS[i].id)) left.push(EGGS[i]);
  if (!isNew && !left.length) {
    vizToast('🗝 Шпаргалка', 'Все 5 пасхалок уже найдены. Прогресс — на странице «Секреты».');
    return;
  }
  vizToast('🗝 Шпаргалка по секретам', left.length
    ? 'Осталось ' + left.length + ': ' + left.slice(0, 2).map(function (g) { return g.hint; }).join(' · ')
    : 'Все 5 пасхалок открыты — смотри страницу «Секреты».');
}

document.addEventListener('keydown', function (e) {
  var t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

  var k = e.key;

  // Konami-код
  if (k === KONAMI[kIdx]) {
    kIdx++;
    if (kIdx === KONAMI.length) { kIdx = 0; toggleRainbow(); }
  } else {
    kIdx = (k === KONAMI[0]) ? 1 : 0;
  }

  // Слово DEBUG
  if (k.length === 1) {
    dbgBuf = (dbgBuf + k.toLowerCase()).slice(-16);
    if (dbgBuf.indexOf('debug') !== -1) { dbgBuf = ''; toggleDebug(); }
  }

  // Шпаргалка
  if (k === '?') showCheat();
});

/* ---------- 5 кликов по подсказке в футере → терминал ---------- */
(function hackerTrigger() {
  var clicks = 0, timer = null;
  document.querySelectorAll('.egg-hint').forEach(function (el) {
    el.addEventListener('click', function (ev) {
      ev.preventDefault();
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(function () { clicks = 0; }, 1500);
      if (clicks >= 5) {
        clicks = 0;
        var on = !document.body.classList.contains('hacker-on');
        document.body.classList.toggle('hacker-on', on);
        if (on) {
          eggFound('hacker');
          confettiRain();
          vizToast('💻 Терминал подключён', 'Весь сайт перешёл в хакерский режим. Кликни по подсказке ещё 5 раз, чтобы выключить.');
        } else {
          vizToast('Терминал отключён', 'Интерфейс вернулся в обычное состояние.');
        }
      }
    });
  });
})();

/* ---------- 3D-наклон карточек и плиток ---------- */
(function tilt() {
  var hoverable = false;
  try { hoverable = window.matchMedia('(hover:hover)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (!hoverable) return;

  document.querySelectorAll('.card, .tile').forEach(function (el) {
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width - 0.5;
      var py = (ev.clientY - r.top) / r.height - 0.5;
      el.classList.add('tilt-live');
      el.style.setProperty('--ry', (px * 8).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-py * 8).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', function () {
      el.classList.remove('tilt-live');
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
    });
  });
})();

/* ---------- Прогресс-бары навыков ---------- */
(function bars() {
  var rows = document.querySelectorAll('.bar-row');
  if (!rows.length) return;
  var fill = function (row) {
    var el = row.querySelector('i[data-level]');
    if (el) el.style.width = (+el.dataset.level || 0) + '%';
  };
  try {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        fill(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    rows.forEach(function (row) { io.observe(row); });
    // Подстраховка: если наблюдатель не сработал, заполняем бары статично
    setTimeout(function () {
      rows.forEach(function (row) {
        var el = row.querySelector('i[data-level]');
        if (el && !el.style.width) fill(row);
      });
    }, 1200);
  } catch (e) {
    rows.forEach(fill);
  }
})();

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

  /* ---------- Уведомление (общее) ---------- */
  var toast = vizToast;

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
      eggFound('orbita');
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
