/* HSC Result 2026 Homepage — visitor reviews (v1.5.0)
   Star picker + validation + AJAX submit. Reviews are held for admin approval,
   so a submitted review is not shown immediately. */
(function () {
  'use strict';

  var form = document.getElementById('h26-review-form');
  if (!form || typeof window.h26ReviewData === 'undefined') return;

  var pickWrap = document.getElementById('rv-pick');
  var stars    = pickWrap ? Array.prototype.slice.call(pickWrap.querySelectorAll('.rv-pick-star')) : [];
  var nameEl   = document.getElementById('rv-name');
  var emailEl  = document.getElementById('rv-email');
  var commEl   = document.getElementById('rv-comment');
  var submit   = document.getElementById('rv-submit');
  var msgEl    = document.getElementById('rv-msg');

  var rating = 0;

  function paint(n) {
    stars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
  }
  stars.forEach(function (b) {
    var val = parseInt(b.getAttribute('data-val'), 10);
    b.addEventListener('mouseenter', function () { paint(val); });
    b.addEventListener('focus', function () { paint(val); });
    b.addEventListener('click', function () {
      rating = val; paint(val);
      b.setAttribute('aria-checked', 'true');
      stars.forEach(function (o) { if (o !== b) o.setAttribute('aria-checked', 'false'); });
    });
  });
  if (pickWrap) {
    pickWrap.addEventListener('mouseleave', function () { paint(rating); });
    pickWrap.addEventListener('blur', function () { paint(rating); }, true);
  }

  function setMsg(text, kind) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = 'rv-msg' + (kind ? ' ' + kind : '');
  }

  submit.addEventListener('click', function () {
    var name    = (nameEl && nameEl.value || '').trim();
    var email   = (emailEl && emailEl.value || '').trim();
    var comment = (commEl && commEl.value || '').trim();

    if (!rating)  { setMsg('Please select a star rating.', 'err'); return; }
    if (!name)    { setMsg('Please enter your name.', 'err'); return; }
    if (!comment) { setMsg('Please write a comment.', 'err'); return; }

    submit.disabled = true;
    setMsg('Submitting…', '');

    var body = new URLSearchParams({
      action:  'h26_submit_review',
      nonce:   window.h26ReviewData.nonce,
      post_id: form.getAttribute('data-post'),
      name:    name,
      email:   email,
      rating:  rating,
      comment: comment
    });

    fetch(window.h26ReviewData.ajaxurl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        submit.disabled = false;
        if (!res || !res.success) {
          setMsg((res && res.data && res.data.message) || 'Could not submit your review.', 'err');
          return;
        }
        rating = 0; paint(0);
        if (nameEl)  nameEl.value = '';
        if (emailEl) emailEl.value = '';
        if (commEl)  commEl.value = '';
        setMsg((res.data && res.data.message) || 'Thank you! Your review is awaiting approval.', 'ok');
      })
      .catch(function () {
        submit.disabled = false;
        setMsg('Network problem — please try again later.', 'err');
      });
  });
})();
