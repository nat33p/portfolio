// Scroll reveal: text and media fade in and rise into place as they enter the viewport.
// Targets are picked automatically; add data-reveal-group to reveal a whole element as one unit,
// or data-reveal="off" to leave an element (and its contents) alone.
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TARGETS = '[data-reveal-group], h1, h2, h3, h4, p, span, a, button, blockquote, figure, table, ul, ol, img, video, image-slot';
  const MEDIA = /^(IMG|VIDEO|IMAGE-SLOT|FIGURE)$/;
  const LAYOUT = /^(SECTION|MAIN|FOOTER|BODY)$/;
  const STAGGER = 90, MAX_STAGGER = 5;

  const css = document.createElement('style');
  css.textContent = `
[data-reveal="hidden"], [data-reveal="shown"] {
  transition: opacity 0.9s cubic-bezier(.33,1,.68,1) var(--reveal-delay, 0ms),
              translate 1.1s cubic-bezier(.16,1,.3,1) var(--reveal-delay, 0ms),
              scale 1.3s cubic-bezier(.16,1,.3,1) var(--reveal-delay, 0ms) !important;
}
[data-reveal="hidden"] { opacity: 0 !important; translate: 0 40px; }
[data-reveal="hidden"][data-reveal-media] { scale: 1.04; translate: 0 48px; }`;
  document.head.appendChild(css);

  const io = new IntersectionObserver((entries) => {
    const entering = entries.filter(e => e.isIntersecting).map(e => e.target);
    entering.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });
    entering.forEach((el, i) => {
      io.unobserve(el);
      el.style.setProperty('--reveal-delay', Math.min(i, MAX_STAGGER) * STAGGER + 'ms');
      el.setAttribute('data-reveal', 'shown');
    });
  }, { rootMargin: '0px 100% -8% 100%' });

  // Once the rise finishes, drop the reveal styles so the element's own transitions (hover etc.) apply again.
  document.addEventListener('transitionend', (e) => {
    const el = e.target;
    if (e.propertyName === 'translate' && el.getAttribute && el.getAttribute('data-reveal') === 'shown') {
      el.setAttribute('data-reveal', 'done');
      el.style.removeProperty('--reveal-delay');
    }
  });

  const skip = (el) => {
    if (el.closest('[data-reveal="off"], header, nav, [aria-hidden="true"], template')) return true;
    const cs = getComputedStyle(el);
    return cs.position === 'absolute' || cs.position === 'fixed' || cs.display === 'inline' || cs.display === 'contents' || cs.display === 'none';
  };

  // Media inside a clipping or single-child wrapper moves with its wrapper, so the frame rises too.
  const lift = (el) => {
    let node = el;
    while (node.parentElement && !LAYOUT.test(node.parentElement.tagName) && !node.parentElement.matches('#dc-root, .sc-host')) {
      const p = node.parentElement;
      const clips = getComputedStyle(p).overflow !== 'visible' &&
        [...p.children].every(c => c === node || c.tagName === 'CANVAS' || getComputedStyle(c).position === 'absolute');
      if (p.children.length !== 1 && !clips) break;
      node = p;
    }
    return node;
  };

  const scan = (root) => {
    const list = root.matches && root.matches(TARGETS) ? [root] : [];
    root.querySelectorAll && list.push(...root.querySelectorAll(TARGETS));
    for (let el of list) {
      if (el.closest('[data-reveal]') || !el.closest('#dc-root') || skip(el)) continue;
      const media = MEDIA.test(el.tagName);
      if (media) el = lift(el);
      if (el.closest('[data-reveal]')) continue;
      el.setAttribute('data-reveal', 'hidden');
      if (media) el.setAttribute('data-reveal-media', '');
      io.observe(el);
    }
  };

  // The page is rendered client-side, so watch for content as it mounts. Mutation callbacks run
  // before paint, which keeps freshly rendered elements from flashing visible first.
  new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n);
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.body) scan(document.body);
})();
