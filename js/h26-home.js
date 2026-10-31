/* HSC Result 2026 Homepage — front-end interactions (v1.5.0)
   Reveal-on-scroll + animated charts (overview summary, year bars, board table).
   FAQ uses native <details>. Matches the eduboardresults checker look. */
(function () {
  var root = document.querySelector('.h26-root');
  if (!root) return;

  /* Reveal on scroll */
  var reveals = root.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Respect reduced-motion: leave every bar/ring at its final inline value and
     skip the grow-in animation entirely. Values are already set inline in the
     markup, so this is also the no-JS / no-IntersectionObserver end state. */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) return;

  /* Animate a group of bars/rings the first time its container scrolls in. */
  function animateWhenVisible(container, selector, prop, fallback) {
    if (!container) return;
    var els = [].slice.call(container.querySelectorAll(selector));
    if (!els.length) return;
    var targets = els.map(function (el) { return el.style.getPropertyValue(prop) || fallback; });
    els.forEach(function (el) { el.style.setProperty(prop, prop === '--val' ? '0' : '0%'); });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          els.forEach(function (el, i) { el.style.setProperty(prop, targets[i]); });
          obs.disconnect();
        }
      });
    }, { threshold: 0.2 });
    obs.observe(container);
  }

  var about = root.querySelector('#about');
  animateWhenVisible(about, '.h26-ring-bar', '--val', '0');
  animateWhenVisible(about, '.h26-ovr-fill', '--w', '0%');

  var stats = root.querySelector('#stats');
  animateWhenVisible(stats, '.h26-ring-bar', '--val', '0');
  animateWhenVisible(stats, '.h26-ovr-fill', '--w', '0%');
  animateWhenVisible(stats, '.h26-vbar-fill', '--h', '3%');
  animateWhenVisible(stats, '.h26-gfill', '--w', '0%');

  var boards = root.querySelector('#boards');
  animateWhenVisible(boards, '.h26-lc-fill, .h26-lc-gpa-fill', '--w', '0%');

  /* Interactive SMS builder */
  var sb = root.querySelector('.h26-smsbuild');
  if (sb) {
    var boardSel = sb.querySelector('.h26-smsf-board');
    var rollIn   = sb.querySelector('.h26-smsf-roll');
    var yearIn   = sb.querySelector('.h26-smsf-year');
    var msgEl    = sb.querySelector('.h26-smsbuild-msg');
    var copyBtn  = sb.querySelector('.h26-smsbuild-copy');
    var sendLink = sb.querySelector('.h26-smsbuild-send');
    var sendNo   = sb.getAttribute('data-send') || '16222';

    function buildMsg() {
      var board = (boardSel && boardSel.value) ? boardSel.value : '—';
      var roll  = (rollIn && rollIn.value.trim()) ? rollIn.value.trim() : '—';
      var year  = (yearIn && yearIn.value.trim()) ? yearIn.value.trim() : '2026';
      return 'HSC ' + board + ' ' + roll + ' ' + year;
    }
    function ready() {
      return boardSel && boardSel.value && rollIn && rollIn.value.trim();
    }
    function refresh() {
      var msg = buildMsg();
      if (msgEl) msgEl.textContent = msg;
      var ok = ready();
      if (sendLink) {
        // sms: URI — body support varies by device, but the number + prefilled text is standard.
        sendLink.setAttribute('href', ok ? ('sms:' + sendNo + '?&body=' + encodeURIComponent(msg)) : '#');
        sendLink.classList.toggle('is-disabled', !ok);
        sendLink.setAttribute('aria-disabled', ok ? 'false' : 'true');
      }
      if (copyBtn) copyBtn.disabled = !ok;
    }
    rollIn && rollIn.addEventListener('input', function () {
      rollIn.value = rollIn.value.replace(/[^0-9]/g, '');
      refresh();
    });
    yearIn && yearIn.addEventListener('input', function () {
      yearIn.value = yearIn.value.replace(/[^0-9]/g, '');
      refresh();
    });
    boardSel && boardSel.addEventListener('change', refresh);

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (!ready()) return;
        var msg = buildMsg();
        var done = function () {
          var lbl = copyBtn.querySelector('span');
          if (!lbl) return;
          var old = lbl.textContent;
          lbl.textContent = 'Copied!';
          copyBtn.classList.add('is-copied');
          setTimeout(function () { lbl.textContent = old; copyBtn.classList.remove('is-copied'); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(msg).then(done).catch(done);
        } else {
          var t = document.createElement('textarea');
          t.value = msg; document.body.appendChild(t); t.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(t); done();
        }
      });
    }
    if (sendLink) {
      sendLink.addEventListener('click', function (e) { if (!ready()) e.preventDefault(); });
    }
    refresh();
  }
})();
