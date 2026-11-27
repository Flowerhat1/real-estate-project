/* Small prototype behaviour: menu, neighborhood arrows, valuation form and photo viewer.
   All visual animation lives in styles.css. */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Mobile menu */
  var toggle = $('.menu-toggle'), nav = $('#site-nav');
  function setMenu(open) { nav.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
  }

  /* Neighborhood scroller */
  var scroller = $('#hood-scroller');
  if (scroller) {
    var arrows = $$('[data-scroll]');
    var update = function () {
      arrows[0].disabled = scroller.scrollLeft < 8;
      arrows[1].disabled = scroller.scrollLeft + scroller.clientWidth > scroller.scrollWidth - 8;
    };
    arrows.forEach(function (b) {
      b.addEventListener('click', function () {
        var card = scroller.firstElementChild;
        var gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
        scroller.scrollBy({ left: Number(b.dataset.scroll) * (card.offsetWidth + gap) });
      });
    });
    scroller.style.scrollBehavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    scroller.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  /* Valuation form in three steps */
  var form = $('#valuation-form');
  if (form) {
    var steps = $$('.form-step', form), bars = $$('.progress span', form);
    var back = $('#form-back'), next = $('#form-next'), count = $('#step-count');
    var current = 0, sending = false;
    var agents = {
      Daniel: { tel: '+31100000101', show: '010-000 0101', areas: ['Lloydkwartier', 'Katendrecht', 'Stadsdriehoek'] },
      Priya: { tel: '+31100000102', show: '010-000 0102', areas: ['Kralingen', 'Hillegersberg', 'Blijdorp'] },
      Marcus: { tel: '+31100000103', show: '010-000 0103', areas: ['Rotterdam Central District', 'Kop van Zuid', 'Middelland'] },
      Sofia: { tel: '+31100000104', show: '010-000 0104', areas: ['Scheepvaartkwartier', 'Cool', 'Oude Noorden'] }
    };

    var show = function (i, focus) {
      current = i;
      steps.forEach(function (s, n) { s.hidden = n !== i; });
      bars.forEach(function (b, n) { b.classList.toggle('is-done', n <= i); });
      count.textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
      back.hidden = i === 0;
      next.firstChild.textContent = i === steps.length - 1 ? 'Send my request ' : 'Continue ';
      if (focus) $('.input', steps[i]).focus({ preventScroll: true });
    };
    var message = function (el) {
      var v = el.value.trim();
      if (el.required && !v) {
        return el.tagName === 'SELECT' ? 'Please choose an option.' : 'Please fill in this field.';
      }
      if (!v) return '';
      if (el.id === 'postcode' && !/^[1-9]\d{3}\s?[a-z]{2}$/i.test(v)) return 'Use a Dutch postcode, like 1234 AB.';
      if (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(v)) return 'Check the email address, like name@example.com.';
      if (el.type === 'tel' && v.replace(/\D/g, '').length < 9) return 'Enter a phone number with at least 9 digits.';
      if (el.type === 'number' && Number(v) < 10) return 'Enter at least 10 m².';
      return '';
    };
    var check = function (el) {
      var m = message(el);
      $('#' + el.id + '-error').textContent = m;
      el.setAttribute('aria-invalid', String(!!m));
      return !m;
    };
    form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid') === 'true') check(e.target); });
    back.addEventListener('click', function () { show(current - 1, true); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var bad = $$('.input', steps[current]).filter(function (el) { return !check(el); });
      if (bad.length) { bad[0].focus(); return; }
      if (current < steps.length - 1) { show(current + 1, true); return; }
      sending = true;
      next.disabled = true;
      next.firstChild.textContent = 'Sending ';
      setTimeout(function () {
        var hood = $('#neighborhood').value;
        var name = Object.keys(agents).filter(function (k) { return agents[k].areas.indexOf(hood) > -1; })[0];
        var way = { 'Phone call': 'by phone', 'WhatsApp': 'on WhatsApp', 'Email': 'by email' }[$('#prefer').value];
        $('#done-title').textContent = 'Thank you, ' + $('#name').value.trim().split(' ')[0];
        $('#done-text').textContent = (name ? name + ', who looks after ' + hood + ',' : 'One of our agents') +
          ' will contact you ' + way + ' about your home.';
        if (name) {
          var call = $('#done-call');
          call.href = 'tel:' + agents[name].tel;
          call.textContent = 'Call ' + name + ' now';
        }
        form.hidden = true;
        var done = $('#form-done');
        done.hidden = false;
        done.focus();
      }, 700);
    });
    show(0, false);
  }

  /* Property photo viewer */
  var box = $('#lightbox');
  if (box) {
    var shots = $$('.gallery-open img'), view = $('#lightbox-img'), at = 0;
    var open = function (i) {
      at = (i + shots.length) % shots.length;
      view.src = shots[at].src;
      view.alt = shots[at].alt;
    };
    $$('.gallery-open').forEach(function (b) {
      b.addEventListener('click', function () { open(Number(b.dataset.index)); box.showModal(); });
    });
    $$('[data-step]', box).forEach(function (b) { b.addEventListener('click', function () { open(at + Number(b.dataset.step)); }); });
    $('[data-close]', box).addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') open(at - 1);
      if (e.key === 'ArrowRight') open(at + 1);
    });
  }
})();
