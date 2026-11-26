// Nestling concept site: booking state, due date picker, live calendar, validation, gallery filters.
(function () {
  var RASP = '#C92C63', PLUM = '#3A1F40', PINK = '#F9CAD3', BLUSH = '#FDEBEF', MUTED = '#6B5A66';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  // ---------- state ----------
  var KEY = 'nestling:booking';
  function load() { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var st = load();

  // ---------- dates ----------
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parse(s) { var p = (s || '').split('-').map(Number); return p.length === 3 && p[0] ? new Date(p[0], p[1] - 1, p[2]) : null; }
  function add(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function same(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function long(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var minDue = today, maxDue = add(today, 300);
  function clamp(d) { return d < minDue ? minDue : (d > maxDue ? maxDue : d); }
  var demo = parse('2027-03-14');
  var due = clamp(parse(st.due) || (demo >= today ? demo : add(today, 110)));
  function held() { return [add(due, 5), add(due, 14)]; }
  function rangeLabel() {
    var h = held(), a = h[0], b = h[1];
    if (a.getMonth() === b.getMonth()) return a.getDate() + ' to ' + b.getDate() + ' ' + MONTHS[b.getMonth()];
    return a.getDate() + ' ' + MONTHS[a.getMonth()] + ' to ' + b.getDate() + ' ' + MONTHS[b.getMonth()];
  }

  // ---------- text hooks ----------
  function setText(k, v) { $$('[data-k="' + k + '"]').forEach(function (el) { el.textContent = v; }); }
  function paintDue() {
    var r = rangeLabel();
    setText('due', long(due)); setText('held', r);
    setText('heldsentence', 'We hold ' + r + ' for you.');
    setText('holdcta', 'Hold ' + r);
    setText('heldtitle', r + ' are yours.');
    $$('input[data-due]').forEach(function (inp) {
      if (inp.hasAttribute('data-empty') && !st.duePicked) { inp.value = ''; return; }
      inp.value = long(due);
    });
    $$('[data-held-chips]').forEach(function (box) {
      var tpl = box.firstElementChild; if (!tpl) return;
      var chips = $$(':scope > *', box);
      for (var i = 0; i < 10; i++) {
        var c = chips[i] || box.appendChild(tpl.cloneNode(true));
        var d = add(due, 5 + i);
        var sp = c.querySelector('span'); if (sp) sp.textContent = WD[d.getDay()];
        var tn = [].slice.call(c.childNodes).filter(function (n) { return n.nodeType === 3; }).pop();
        if (tn) tn.nodeValue = String(d.getDate()); else c.appendChild(document.createTextNode(String(d.getDate())));
        c.setAttribute('aria-label', long(d));
      }
    });
    $$('[data-cal]').forEach(function (cal) { cal._view = new Date(due.getFullYear(), due.getMonth(), 1); renderCal(cal, true); });
    paintIcs();
  }
  function setDue(d, picked) {
    due = clamp(d); st.due = iso(due); if (picked) st.duePicked = true; save(); paintDue();
  }

  // ---------- due date fields open the system date picker ----------
  $$('input[data-due]').forEach(function (inp) {
    var wrap = inp.parentElement; if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    var nat = document.createElement('input'); nat.type = 'date'; nat.tabIndex = -1; nat.setAttribute('aria-hidden', 'true');
    nat.min = iso(minDue); nat.max = iso(maxDue);
    nat.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0;margin:0;font-size:16px';
    wrap.appendChild(nat);
    nat.addEventListener('click', function () { nat.value = iso(due); try { nat.showPicker(); } catch (e) {} });
    nat.addEventListener('focus', function () { inp.style.borderColor = RASP; });
    nat.addEventListener('blur', function () { inp.style.borderColor = ''; });
    nat.addEventListener('change', function () { var d = parse(nat.value); if (d) setDue(d, true); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); try { nat.showPicker(); } catch (er) { nat.focus(); } } });
  });

  // ---------- live calendar ----------
  function renderCal(cal, animate) {
    var grid = $('[data-cal-grid]', cal), title = $('[data-cal-title]', cal); if (!grid) return;
    var cell = +(cal.getAttribute('data-cell') || 52), v = cal._view;
    if (title) title.textContent = MONTHS[v.getMonth()] + ' ' + v.getFullYear();
    var heads = $$(':scope > *', grid).slice(0, 7);
    grid.innerHTML = ''; heads.forEach(function (h) { grid.appendChild(h); });
    var lead = (v.getDay() + 6) % 7;
    for (var i = 0; i < lead; i++) grid.appendChild(document.createElement('div'));
    var h = held(), n = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate(), k = 0;
    for (var day = 1; day <= n; day++) {
      var d = new Date(v.getFullYear(), v.getMonth(), day), b = document.createElement('button');
      b.type = 'button'; b.textContent = day;
      var off = d < minDue || d > maxDue, isDue = same(d, due), isHeld = d >= h[0] && d <= h[1];
      var css = 'height:' + cell + 'px;border-radius:16px;display:flex;align-items:center;justify-content:center;font:inherit;font-size:16px;box-sizing:border-box;border:0;padding:0;background:transparent;color:' + MUTED + ';cursor:pointer';
      if (off) css += ';color:#CDBBC4;cursor:default';
      if (isHeld) css += ';background:' + PINK + ';color:' + PLUM + ';font-weight:600' + (animate ? ';animation:popin .4s ' + (0.05 * k++).toFixed(2) + 's both' : '');
      if (isDue) css += ';border:2px solid ' + RASP + ';color:' + PLUM + ';font-weight:600';
      b.style.cssText = css; b.disabled = off;
      b.setAttribute('aria-label', long(d) + (isDue ? ', your due date' : isHeld ? ', held for you' : ''));
      if (!off) {
        (function (dd, el, base) {
          el.addEventListener('mouseenter', function () { if (!same(dd, due)) el.style.boxShadow = 'inset 0 0 0 1.5px ' + PINK; });
          el.addEventListener('mouseleave', function () { el.style.boxShadow = ''; });
          el.addEventListener('click', function () { setDue(dd, true); });
        })(d, b, css);
      }
      grid.appendChild(b);
    }
    var note = $('[data-cal-note]', cal);
    if (!note) { note = document.createElement('button'); note.type = 'button'; note.setAttribute('data-cal-note', ''); note.style.cssText = 'align-self:flex-start;border:0;background:none;padding:2px 0;font:inherit;font-size:14px;font-weight:500;color:' + RASP + ';cursor:pointer;text-decoration:underline;text-underline-offset:3px'; grid.parentNode.insertBefore(note, grid.nextSibling); note.addEventListener('click', function () { var hh = held()[1]; cal._view = new Date(hh.getFullYear(), hh.getMonth(), 1); renderCal(cal, true); }); }
    var hEnd = h[1], vEnd = new Date(v.getFullYear(), v.getMonth() + 1, 0);
    if (hEnd > vEnd) { note.style.display = ''; note.textContent = (h[0] > vEnd ? 'Your held days are in ' : 'Your held days continue in ') + MONTHS[(v.getMonth() + 1) % 12]; }
    else note.style.display = 'none';
    var prev = $('[data-cal-prev]', cal), next = $('[data-cal-next]', cal);
    var minV = new Date(minDue.getFullYear(), minDue.getMonth(), 1), maxV = new Date(maxDue.getFullYear(), maxDue.getMonth(), 1);
    if (prev) { prev.disabled = v <= minV; prev.style.opacity = prev.disabled ? .35 : 1; }
    if (next) { next.disabled = v >= maxV; next.style.opacity = next.disabled ? .35 : 1; }
  }
  $$('[data-cal]').forEach(function (cal) {
    var prev = $('[data-cal-prev]', cal), next = $('[data-cal-next]', cal);
    if (prev) prev.addEventListener('click', function () { cal._view = new Date(cal._view.getFullYear(), cal._view.getMonth() - 1, 1); renderCal(cal, true); });
    if (next) next.addEventListener('click', function () { cal._view = new Date(cal._view.getFullYear(), cal._view.getMonth() + 1, 1); renderCal(cal, true); });
  });

  // ---------- calendar file with the held dates ----------
  function paintIcs() {
    var h = held(), f = function (d) { return iso(d).replace(/-/g, ''); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nestling concept//EN', 'BEGIN:VEVENT', 'UID:ns2703@nestling.example',
      'DTSTAMP:' + f(today) + 'T090000Z', 'DTSTART;VALUE=DATE:' + f(h[0]), 'DTEND;VALUE=DATE:' + f(add(h[1], 1)),
      'SUMMARY:Nestling newborn session window (concept)',
      'DESCRIPTION:Nestling holds ' + rangeLabel() + ' for your newborn session. Text 07700 900321 when your baby arrives. Concept project by Iryna Chelombitko.',
      'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
    $$('a[href$="nestling-dates.ics"], a[data-ics]').forEach(function (a) {
      if (a._url) URL.revokeObjectURL(a._url);
      a._url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.setAttribute('data-ics', ''); a.href = a._url; a.download = 'nestling-dates.ics';
    });
  }

  // ---------- package choice ----------
  var gbp = function (n) { return '£' + n; };
  function applyPack(p) {
    if (!p) return;
    setText('package', p.name); setText('price', gbp(p.price)); setText('session', p.session); setText('onday', gbp(p.price - 50));
  }
  var radios = $$('input[name="pack"]');
  function paintRadios() {
    radios.forEach(function (r) {
      var lab = r.closest('label'); if (!lab) return;
      lab.classList.toggle('is-on', r.checked); lab.classList.toggle('is-off', !r.checked);
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
      st.pack = { name: r.value, price: parseInt(r.dataset.price, 10), session: r.dataset.session }; save(); paintRadios(); applyPack(st.pack);
    });
  });
  if (st.pack && radios.length) radios.forEach(function (r) { r.checked = r.value === st.pack.name; });
  if (radios.length) paintRadios();
  applyPack(st.pack);

  // ---------- pills: one choice per group; time of day is remembered ----------
  function pressPill(b) {
    $$('.pill', b.parentElement).forEach(function (o) {
      var on = o === b;
      o.setAttribute('aria-pressed', on ? 'true' : 'false');
      o.style.background = on ? PLUM : '#FFFFFF'; o.style.color = on ? '#FFFFFF' : PLUM; o.style.borderColor = on ? PLUM : '#D9B8C2';
    });
  }
  $$('.pill').forEach(function (b) {
    b.addEventListener('click', function () {
      pressPill(b);
      if (b.closest('[data-time]')) { st.time = b.textContent.trim(); save(); setText('time', st.time); }
      if (b.dataset.filter) filterGallery(b.dataset.filter);
    });
  });
  if (st.time) {
    $$('[data-time] .pill').forEach(function (b) { if (b.textContent.trim() === st.time) pressPill(b); });
    setText('time', st.time);
  }

  // ---------- gallery: aligned columns for everything, an even grid for a filter ----------
  var css = document.createElement('style');
  css.textContent = '.gal.filtered{display:grid!important}.gal.filtered .gcol{display:contents!important}' +
    '.gal.filtered figure[data-cat]{flex:none!important}.gal.filtered .gph{min-height:0!important;flex:none!important;aspect-ratio:4/5}' +
    '.gal.filtered figure.wide{grid-column:span 2}.gal.filtered figure.wide .gph{aspect-ratio:16/10}' +
    '@keyframes fadeup{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.gal figure.show{animation:fadeup .4s ease both}';
  document.head.appendChild(css);
  function filterGallery(f) {
    $$('.gal').forEach(function (g) {
      var figs = $$('figure[data-cat]', g), vis = figs.filter(function (x) { return f === 'all' || x.dataset.cat === f; });
      var narrow = g.getBoundingClientRect().width < 600, gap = parseFloat(getComputedStyle(g).columnGap) || 12;
      figs.forEach(function (x) { x.style.display = vis.indexOf(x) < 0 ? 'none' : ''; x.classList.remove('wide', 'show'); });
      if (f === 'all') { g.classList.remove('filtered'); g.style.gridTemplateColumns = ''; }
      else {
        var cols = narrow ? 2 : (vis.length === 4 ? 4 : Math.min(vis.length, 3));
        g.classList.add('filtered'); g.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))'; g.style.gap = gap + 'px';
        if (narrow && vis.length % 2) vis[vis.length - 1].classList.add('wide');
      }
      vis.forEach(function (x, i) { void x.offsetWidth; x.style.animationDelay = (i * 0.04) + 's'; x.classList.add('show'); });
    });
  }

  // ---------- your details: remembered, checked before paying ----------
  var forms = $$('form[data-details]');
  forms.forEach(function (fm) {
    $$('input[name], textarea[name]', fm).forEach(function (el) {
      if (st[el.name] != null) el.value = st[el.name];
      el.addEventListener('input', function () { st[el.name] = el.value; save(); check(el, false); if (el.name === 'email') setText('email', el.value); });
    });
    fm.addEventListener('submit', function (e) { e.preventDefault(); });
  });
  function okField(el) {
    var v = (el.value || '').trim();
    if (el.name === 'name') return v.length >= 2;
    if (el.name === 'mobile') return v.replace(/\D/g, '').length >= 10;
    if (el.name === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    return true;
  }
  function check(el, show) {
    var ok = okField(el), msg = $('[data-err-for="' + el.name + '"]');
    if (msg && (show || ok)) msg.style.display = ok ? 'none' : 'block';
    if (show || ok) el.style.borderColor = ok ? '' : RASP;
    return ok;
  }
  $$('[data-k="pay"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var bad = null;
      forms.forEach(function (fm) { $$('input[required]', fm).forEach(function (el) { if (!check(el, true) && !bad) bad = el; }); });
      if (bad) { e.preventDefault(); bad.focus(); bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });
  });
  if (st.email) setText('email', st.email);

  // ---------- mobile menu ----------
  $$('.mmenu a').forEach(function (a) { a.addEventListener('click', function () { var d = a.closest('details'); if (d) d.open = false; }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $$('.mmenu[open]').forEach(function (d) { d.open = false; }); });

  // ---------- before you come: packing checklist ----------
  $$('[data-check]').forEach(function (box) {
    var BK = 'nestling:bring', boxes = $$('input[type=checkbox]', box), out = $('[data-k="packed"]', box), saved = [];
    try { saved = JSON.parse(localStorage.getItem(BK)) || []; } catch (e) {}
    function count() {
      var n = boxes.filter(function (c) { return c.checked; }).length;
      out.textContent = n === boxes.length ? 'All packed' : n + ' of ' + boxes.length + ' packed';
      out.style.color = n === boxes.length ? RASP : '';
      try { localStorage.setItem(BK, JSON.stringify(boxes.filter(function (c) { return c.checked; }).map(function (c) { return c.value; }))); } catch (e) {}
    }
    boxes.forEach(function (c) { c.checked = saved.indexOf(c.value) > -1; c.addEventListener('change', count); });
    count();
  });

  $$('form:not([data-details])').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });
  paintDue();
})();
