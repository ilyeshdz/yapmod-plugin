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
  function formatCount({
    length,
    maxLength
  }) {
    if (maxLength === null) return `${length} character${length === 1 ? "" : "s"}`;
    const text = `${length} / ${maxLength} \xB7 ${Math.max(0, maxLength - length)} left`;
    return length >= maxLength ? {
      text,
      tone: "warning"
    } : text;
  }
  function index_default() {
    return {
      onLoad() {
        if (typeof yapmod.composer?.registerStatus !== "function") {
          throw new Error("Character Counter 1.1 requires Yapmod client 1.1.0 or later.");
        }
        yapmod.composer.registerStatus(formatCount);
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
