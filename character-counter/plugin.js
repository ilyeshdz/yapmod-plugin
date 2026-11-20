(function () {
"use strict";
var yapmodPlugin = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // plugins/character-counter/index.tsx
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });
  var selector = ".composer textarea, .composer-box textarea, textarea.msg-input";
  var styles = `
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
  function index_default() {
    return {
      onLoad() {
        const counters = /* @__PURE__ */ new Map();
        const events = new AbortController();
        let frame;
        function update(input, counter) {
          const used = input.value.length;
          const limit = input.maxLength;
          const text = limit < 0 ? `${used} character${used === 1 ? "" : "s"}` : `${used} / ${limit} \xB7 ${Math.max(0, limit - used)} left`;
          if (counter.textContent !== text) counter.textContent = text;
          counter.toggleAttribute("data-full", limit >= 0 && used >= limit);
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
        function attach(element) {
          if (!(element instanceof HTMLTextAreaElement)) return;
          const counter = counters.get(element) ?? document.createElement("span");
          counter.className = "yp-character-counter";
          counters.set(element, counter);
          update(element, counter);
        }
        function afterHostUpdate() {
          if (frame !== void 0) return;
          frame = requestAnimationFrame(() => {
            frame = void 0;
            refresh();
          });
        }
        const changes = new MutationObserver(afterHostUpdate);
        yapmod.onDispose(() => {
          events.abort();
          changes.disconnect();
          if (frame !== void 0) cancelAnimationFrame(frame);
          for (const counter of counters.values()) counter.remove();
          counters.clear();
        });
        yapmod.ui.injectCss(styles);
        yapmod.observe(selector, attach);
        changes.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["maxlength"]
        });
        const options = {
          capture: true,
          signal: events.signal
        };
        function refreshTarget(event) {
          if (event.target instanceof HTMLTextAreaElement && event.target.matches(selector)) {
            attach(event.target);
          }
        }
        document.addEventListener("input", refreshTarget, options);
        document.addEventListener("focusin", refreshTarget, options);
        document.addEventListener("reset", afterHostUpdate, options);
        document.addEventListener("submit", afterHostUpdate, options);
        document.addEventListener("keyup", (event) => {
          if (event.key === "Enter") afterHostUpdate();
        }, options);
      }
    };
  }
  return __toCommonJS(index_exports);
})();

;const plugin = typeof yapmodPlugin !== 'undefined'
  ? yapmodPlugin.default ?? yapmodPlugin
  : undefined;
if (plugin === undefined) {
  throw new Error(
    'yapmod: bundle has no default export; export the plugin with `export default`.',
  );
}
return plugin;
})();
