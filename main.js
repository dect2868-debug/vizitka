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
