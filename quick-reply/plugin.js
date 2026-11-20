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

  // plugins/quick-reply/index.tsx
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });
  var messageSelector = ".messages .msg[data-message-id]";
  var interactiveSelector = ["a", "button", "input", "label", "textarea", "select", "summary", "img", "picture", "video", "audio", '[contenteditable]:not([contenteditable="false"])', '[role="button"]', '[role="link"]', ".msg-actions", ".reactions", ".reply-preview", ".mention", ".msg-image", ".msg-linkimgs", ".msg-edited", ".attachment"].join(",");
  function findAction(event) {
    if (event.defaultPrevented || event.button !== 0 || event.shiftKey || event.metaKey || event.altKey || event.ctrlKey) return null;
    const target = event.target;
    if (!(target instanceof Element) || target.closest(interactiveSelector)) return null;
    const message = target.closest(messageSelector);
    if (!message || message.hasAttribute("data-yp-ghost")) return null;
    for (const label of ["Edit", "Reply"]) {
      const button = message.querySelector(`.msg-actions button[aria-label="${label}"]:enabled:not([aria-disabled="true"])`);
      if (button && !button.closest('[hidden], [inert], [aria-hidden="true"]')) return button;
    }
    return null;
  }
  function index_default() {
    function onMouseDown(event) {
      if (event.detail === 2 && findAction(event)) event.preventDefault();
    }
    function onDoubleClick(event) {
      findAction(event)?.click();
    }
    return {
      onLoad() {
        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("dblclick", onDoubleClick);
      },
      onUnload() {
        document.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("dblclick", onDoubleClick);
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
