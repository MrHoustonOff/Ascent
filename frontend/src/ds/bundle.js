/* @ds-bundle: {"format":4,"namespace":"Ascent","components":[]} */
(function () {
  var A = (window.Ascent = window.Ascent || {});
  A.glyph = {
    min: '<svg class="as-glyph" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 5.5h8"/></svg>',
    max: '<svg class="as-glyph" viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7" rx="1.6"/></svg>',
    restore: '<svg class="as-glyph" viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="3" width="5.5" height="5.5" rx="1.3"/><path d="M3.5 3V2.4A.9.9 0 0 1 4.4 1.5h3.2a.9.9 0 0 1 .9.9v3.2a.9.9 0 0 1-.9.9H7"/></svg>',
    close: '<svg class="as-glyph" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>'
  };
  /* Подключает поведение к разметке: переключатели, вкладки, пункты меню, развернуть/восстановить. */
  A.wire = function (root) {
    (root || document).addEventListener('click', function (e) {
      var t = e.target.closest('.as-toggle');
      if (t) { t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true')); return; }
      var tab = e.target.closest('.as-tab');
      if (tab) {
        [].forEach.call(tab.parentNode.children, function (c) { c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true'); return;
      }
      var nav = e.target.closest('.as-nav-item');
      if (nav) {
        [].forEach.call(nav.closest('.as-sidebar').querySelectorAll('.as-nav-item'), function (c) { c.classList.remove('is-active'); });
        nav.classList.add('is-active'); return;
      }
      var mx = e.target.closest('[data-as="maximize"]');
      if (mx) {
        var w = mx.closest('.as-window'); var m = w ? w.classList.toggle('is-maximized') : false;
        mx.innerHTML = m ? A.glyph.restore : A.glyph.max;
        mx.setAttribute('aria-label', m ? 'Восстановить' : 'Развернуть');
      }
    });
  };
})();
