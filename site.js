// Nestling concept site: small interactions for the click-through prototype.
(function () {
  var RASP = '#C92C63', PLUM = '#3A1F40';
  var store = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem('nestling:' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem('nestling:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var gbp = function (n) { return '£' + n; };

  // Package choice: highlight the chosen row, remember it for the next steps.
  function applyPack(p) {
    if (!p) return;
    document.querySelectorAll('[data-k="package"]').forEach(function (el) { el.textContent = p.name; });
    document.querySelectorAll('[data-k="price"]').forEach(function (el) { el.textContent = gbp(p.price); });
    document.querySelectorAll('[data-k="session"]').forEach(function (el) { el.textContent = p.session; });
    document.querySelectorAll('[data-k="onday"]').forEach(function (el) { el.textContent = gbp(p.price - 50); });
  }
  var radios = document.querySelectorAll('input[name="pack"]');
  function paint() {
    radios.forEach(function (r) {
      var lab = r.closest('label'); if (!lab) return;
      lab.classList.toggle('is-on', r.checked);
      lab.classList.toggle('is-off', !r.checked);
      var ring = lab.querySelector('.ring');
      if (ring) {
        ring.style.borderColor = r.checked ? RASP : '#C9A9B6';
        ring.style.display = 'flex'; ring.style.alignItems = 'center'; ring.style.justifyContent = 'center';
        ring.innerHTML = r.checked ? '<span style="width:12px;height:12px;border-radius:50%;background:' + RASP + ';animation:popin .4s both"></span>' : '';
      }
    });
  }
  radios.forEach(function (r) {
    r.addEventListener('change', function () {
      var p = { name: r.value, price: parseInt(r.dataset.price, 10), session: r.dataset.session };
      store.set('pack', p); paint(); applyPack(p);
    });
  });
  var saved = store.get('pack');
  if (saved && radios.length) {
    radios.forEach(function (r) { r.checked = r.value === saved.name; });
  }
  if (radios.length) paint();
  applyPack(saved);

  // Pills: one choice per group. Gallery pills also filter the photos.
  document.querySelectorAll('.pill').forEach(function (b) {
    b.addEventListener('click', function () {
      var group = b.parentElement;
      group.querySelectorAll('.pill').forEach(function (o) {
        var on = o === b;
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
        o.style.background = on ? PLUM : '#FFFFFF';
        o.style.color = on ? '#FFFFFF' : PLUM;
        o.style.borderColor = on ? PLUM : '#D9B8C2';
      });
      var f = b.dataset.filter;
      if (f) {
        document.querySelectorAll('figure[data-cat]').forEach(function (fig) {
          fig.style.display = (f === 'all' || fig.dataset.cat === f) ? '' : 'none';
        });
      }
    });
  });

  // Mobile menu: close it when a link inside is followed on the same page.
  document.querySelectorAll('.mmenu a').forEach(function (a) {
    a.addEventListener('click', function () { var d = a.closest('details'); if (d) d.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.mmenu[open]').forEach(function (d) { d.open = false; });
  });

  // Forms in the prototype do not submit anywhere.
  document.querySelectorAll('form').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });
})();
