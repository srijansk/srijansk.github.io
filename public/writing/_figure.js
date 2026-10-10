/*
 * Report this figure's rendered height to the post that embeds it.
 *
 * An iframe cannot size itself to its content, and these figures reflow
 * taller as they narrow and change height as the reader interacts. The post
 * page listens for this message and sets the iframe's height to match, so no
 * width or state clips the figure. The container-query heights in global.css
 * stay as the first-paint size and as the only sizing when scripts are off.
 *
 * ResizeObserver only fires where the page is rendering, so DOM mutations,
 * interaction and window resizes also schedule a report. Measuring forces
 * layout, which works even in a background tab.
 */
(function () {
  if (window.parent === window) return;
  var last = 0, queued = false;
  function send() {
    queued = false;
    var h = Math.ceil(document.body.getBoundingClientRect().height);
    if (Math.abs(h - last) < 2) return;
    last = h;
    window.parent.postMessage({ type: 'figure-height', height: h }, location.origin);
  }
  function soon() {
    if (queued) return;
    queued = true;
    setTimeout(send, 0);
  }
  if ('ResizeObserver' in window) new ResizeObserver(soon).observe(document.body);
  if ('MutationObserver' in window) {
    new MutationObserver(soon).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  }
  ['input', 'click', 'keyup'].forEach(function (type) { document.addEventListener(type, soon, true); });
  window.addEventListener('resize', soon);
  window.addEventListener('load', send);
  send();
})();
