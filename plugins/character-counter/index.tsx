const selector = '.composer textarea, .composer-box textarea, textarea.msg-input';
const styles = `
  .yp-character-counter {
    align-self: end;
    display: block;
    padding-inline: .5em;
    color: var(--text-muted, currentColor);
    font-size: .75rem;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .yp-character-counter[data-full] { color: var(--danger, #c44); }
`;

export default function () {
  return {
    onLoad() {
      const counters = new Map<HTMLTextAreaElement, HTMLSpanElement>();
      const events = new AbortController();
      let frame: number | undefined;

      function update(input: HTMLTextAreaElement, counter: HTMLSpanElement) {
        // Native maxlength uses UTF-16 code units, including for emoji.
        const used = input.value.length;
        const limit = input.maxLength;
        const text = limit < 0
          ? `${used} character${used === 1 ? '' : 's'}`
          : `${used} / ${limit} · ${Math.max(0, limit - used)} left`;
        if (counter.textContent !== text) counter.textContent = text;
        counter.toggleAttribute('data-full', limit >= 0 && used >= limit);
        if (input.nextElementSibling !== counter) input.after(counter);
      }

      function refresh() {
        for (const [input, counter] of counters) {
          if (input.isConnected) update(input, counter);
          else {
            counters.delete(input);
            counter.remove();
          }
        }
      }

      function attach(element: Element) {
        if (!(element instanceof HTMLTextAreaElement)) return;
        const counter = counters.get(element) ?? document.createElement('span');
        counter.className = 'yp-character-counter';
        counters.set(element, counter);
        update(element, counter);
      }

      function afterHostUpdate() {
        if (frame !== undefined) return;
        frame = requestAnimationFrame(() => {
          frame = undefined;
          refresh();
        });
      }

      // Host form resets and React commits can clear a draft without an input event.
      const changes = new MutationObserver(afterHostUpdate);
      yapmod.onDispose(() => {
        events.abort();
        changes.disconnect();
        if (frame !== undefined) cancelAnimationFrame(frame);
        for (const counter of counters.values()) counter.remove();
        counters.clear();
      });

      yapmod.ui.injectCss(styles);
      yapmod.observe(selector, attach);
      changes.observe(document.documentElement, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['maxlength'],
      });

      const options = { capture: true, signal: events.signal };
      function refreshTarget(event: Event) {
        if (event.target instanceof HTMLTextAreaElement && event.target.matches(selector)) {
          attach(event.target);
        }
      }
      document.addEventListener('input', refreshTarget, options);
      document.addEventListener('focusin', refreshTarget, options);
      document.addEventListener('reset', afterHostUpdate, options);
      document.addEventListener('submit', afterHostUpdate, options);
      document.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') afterHostUpdate();
      }, options);
    },
  };
}
