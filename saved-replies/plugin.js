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

  // plugins/saved-replies/index.tsx
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });

  // plugins/saved-replies/model.ts
  var limits = {
    replies: 100,
    title: 80,
    text: 1e4
  };
  function readReplies(value) {
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("replies" in value) || !Array.isArray(value.replies)) return [];
    const ids = /* @__PURE__ */ new Set();
    const replies = [];
    for (const item of value.replies) {
      if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id || item.id.length > 100 || ids.has(item.id) || typeof item.title !== "string" || !item.title.trim() || item.title.length > limits.title || typeof item.text !== "string" || !item.text.trim() || item.text.length > limits.text) continue;
      ids.add(item.id);
      replies.push({
        id: item.id,
        title: item.title,
        text: item.text
      });
      if (replies.length === limits.replies) break;
    }
    return replies;
  }
  function insertReply(current, original, caret, text, maxLength) {
    const position = current === original ? Math.max(0, Math.min(caret, current.length)) : current.length;
    const value = current.slice(0, position) + text + current.slice(position);
    if (maxLength >= 0 && value.length > maxLength) {
      throw new Error("This reply would exceed the message length limit. Shorten the draft or reply first.");
    }
    return {
      value,
      caret: position + text.length
    };
  }

  // plugins/saved-replies/composer.ts
  function captureTarget(context) {
    context.focus();
    const input = document.activeElement;
    if (!(input instanceof HTMLTextAreaElement) || !input.isConnected || !input.matches(".composer textarea, .composer-box textarea, textarea.msg-input")) {
      throw new Error("This composer is no longer available. Open Saved Replies from the message box again.");
    }
    return {
      input,
      original: input.value,
      caret: input.selectionEnd,
      url: location.href
    };
  }
  function insertIntoComposer(target, text) {
    const {
      input
    } = target;
    if (!input.isConnected || input.disabled || input.readOnly || location.href !== target.url) {
      throw new Error("The conversation or composer changed. Reopen Saved Replies from the message box.");
    }
    const next = insertReply(input.value, target.original, target.caret, text, input.maxLength);
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (!setter) throw new Error("This browser does not support inserting saved replies.");
    setter.call(input, next.value);
    input.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    input.focus({
      preventScroll: true
    });
    input.setSelectionRange(next.caret, next.caret);
  }

  // plugins/saved-replies/storage.ts
  function saveReplies(api, replies, storage = localStorage) {
    const value = {
      version: 1,
      replies
    };
    const previous = api.storage.savedReplies;
    const hadPrevious = "savedReplies" in api.storage;
    try {
      api.storage.savedReplies = value;
      const raw = storage.getItem("yapmod.plugins.data.v1");
      const persisted = raw ? JSON.parse(raw) : null;
      const record = persisted && typeof persisted === "object" && api.id in persisted ? persisted[api.id] : void 0;
      if (!record || typeof record !== "object" || !("savedReplies" in record) || JSON.stringify(record.savedReplies) !== JSON.stringify(value)) {
        throw new Error("Could not save replies. Browser storage may be full or unavailable. Your changes have not been saved.");
      }
    } catch (error) {
      if (hadPrevious) api.storage.savedReplies = previous;
      else delete api.storage.savedReplies;
      throw error;
    }
  }

  // plugins/saved-replies/index.tsx
  var {
    template: _$template
  } = yapmod.solidWeb;
  var {
    memo: _$memo
  } = yapmod.solidWeb;
  var {
    insert: _$insert
  } = yapmod.solidWeb;
  var {
    createComponent: _$createComponent
  } = yapmod.solidWeb;
  var {
    use: _$use
  } = yapmod.solidWeb;
  var _tmpl$ = /* @__PURE__ */ _$template(`<form class=sr-form><label>Title</label><label>Message</label><div class=sr-actions>`);
  var _tmpl$2 = /* @__PURE__ */ _$template(`<div class=sr-panel>`);
  var _tmpl$3 = /* @__PURE__ */ _$template(`<div class=sr-heading>`);
  var _tmpl$4 = /* @__PURE__ */ _$template(`<ul class=sr-list>`);
  var _tmpl$5 = /* @__PURE__ */ _$template(`<p class=hint>No saved replies yet. Add a welcome message, useful links, or a question you ask often.`);
  var _tmpl$6 = /* @__PURE__ */ _$template(`<span>Delete this reply?`);
  var _tmpl$7 = /* @__PURE__ */ _$template(`<li class=sr-item><p class=sr-preview></p><div class=sr-actions>`);
  var _tmpl$8 = /* @__PURE__ */ _$template(`<strong>`);
  var {
    createSignal,
    For,
    onCleanup,
    onMount,
    Show
  } = yapmod.solid;
  var {
    Button,
    Hint,
    Input,
    Textarea
  } = yapmod.ui;
  function index_default() {
    const [replies, setReplies] = createSignal([]);
    let closePicker;
    let stopTool;
    let removeStyle;
    let disposed = false;
    function report(error) {
      console.error("[yapmod] saved replies:", error);
      yapmod.ui.showToast(error instanceof Error ? error.message : "Saved Replies could not complete this action.", "error");
    }
    function persist(next) {
      try {
        saveReplies(yapmod, next);
        setReplies(next);
        return true;
      } catch (error) {
        report(error);
        return false;
      }
    }
    function RepliesPanel(props) {
      const [editing, setEditing] = createSignal(null);
      const [title, setTitle] = createSignal("");
      const [text, setText] = createSignal("");
      const [deleting, setDeleting] = createSignal(null);
      let root;
      let titleInput;
      let newButton;
      function focusList() {
        queueMicrotask(() => {
          if (root.isConnected) (root.querySelector(".sr-insert") ?? newButton).focus();
        });
      }
      function edit(reply) {
        setDeleting(null);
        setTitle(reply?.title ?? "");
        setText(reply?.text ?? "");
        setEditing(reply?.id ?? "");
        queueMicrotask(() => titleInput?.isConnected && titleInput.focus());
      }
      function save(event) {
        event.preventDefault();
        const cleanTitle = title().trim();
        if (!cleanTitle || !text().trim()) {
          yapmod.ui.showToast("Enter a title and a message.", "error");
          return;
        }
        if (cleanTitle.length > limits.title || text().length > limits.text) return;
        const id = editing();
        if (id === null) return;
        if (!id && replies().length >= limits.replies) {
          yapmod.ui.showToast(`You can save up to ${limits.replies} replies.`, "error");
          return;
        }
        const reply = {
          id: id || crypto.randomUUID(),
          title: cleanTitle,
          text: text()
        };
        const next = id ? replies().map((item) => item.id === id ? reply : item) : [...replies(), reply];
        if (persist(next)) {
          setEditing(null);
          yapmod.ui.showToast("Reply saved.", "success");
          focusList();
        }
      }
      function insert(reply) {
        if (!props.target) return;
        try {
          insertIntoComposer(props.target, reply.text);
          props.close?.();
        } catch (error) {
          report(error);
        }
      }
      onMount(() => {
        const trap = (event) => {
          if (event.key !== "Tab") return;
          const modal = root.closest(".modal");
          if (!modal?.contains(document.activeElement)) return;
          const controls = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        };
        document.addEventListener("keydown", trap);
        onCleanup(() => document.removeEventListener("keydown", trap));
        queueMicrotask(focusList);
      });
      return (() => {
        var _el$ = _tmpl$2();
        _$use((element) => {
          root = element;
        }, _el$);
        _$insert(_el$, _$createComponent(Show, {
          get when() {
            return editing() !== null;
          },
          get fallback() {
            return [(() => {
              var _el$8 = _tmpl$3();
              _$insert(_el$8, _$createComponent(Hint, {
                get children() {
                  return props.target ? "Choose a reply to insert. You can edit it before sending." : "Create and manage messages for the Saved Replies composer button.";
                }
              }), null);
              _$insert(_el$8, _$createComponent(Button, {
                ref: (element) => {
                  newButton = element;
                },
                type: "button",
                variant: "primary",
                get disabled() {
                  return replies().length >= limits.replies;
                },
                onClick: () => edit(),
                children: "New reply"
              }), null);
              return _el$8;
            })(), _$createComponent(Show, {
              get when() {
                return replies().length > 0;
              },
              get fallback() {
                return _tmpl$5();
              },
              get children() {
                var _el$9 = _tmpl$4();
                _$insert(_el$9, _$createComponent(For, {
                  get each() {
                    return replies();
                  },
                  children: (reply) => (() => {
                    var _el$1 = _tmpl$7(), _el$10 = _el$1.firstChild, _el$11 = _el$10.nextSibling;
                    _$insert(_el$1, _$createComponent(Show, {
                      get when() {
                        return props.target;
                      },
                      get fallback() {
                        return (() => {
                          var _el$13 = _tmpl$8();
                          _$insert(_el$13, () => reply.title);
                          return _el$13;
                        })();
                      },
                      get children() {
                        return _$createComponent(Button, {
                          "class": "sr-insert",
                          type: "button",
                          onClick: () => insert(reply),
                          get ["aria-label"]() {
                            return `Insert ${reply.title}`;
                          },
                          get children() {
                            return reply.title;
                          }
                        });
                      }
                    }), _el$10);
                    _$insert(_el$10, () => reply.text);
                    _$insert(_el$11, _$createComponent(Show, {
                      get when() {
                        return deleting() === reply.id;
                      },
                      get fallback() {
                        return [_$createComponent(Button, {
                          type: "button",
                          size: "small",
                          onClick: () => edit(reply),
                          get ["aria-label"]() {
                            return `Edit ${reply.title}`;
                          },
                          children: "Edit"
                        }), _$createComponent(Button, {
                          type: "button",
                          size: "small",
                          onClick: () => {
                            setDeleting(reply.id);
                            queueMicrotask(() => root.querySelector("[data-sr-confirm]")?.focus());
                          },
                          get ["aria-label"]() {
                            return `Delete ${reply.title}`;
                          },
                          children: "Delete"
                        })];
                      },
                      get children() {
                        return [_tmpl$6(), _$createComponent(Button, {
                          "data-sr-confirm": true,
                          type: "button",
                          variant: "danger",
                          size: "small",
                          onClick: () => {
                            if (persist(replies().filter((item) => item.id !== reply.id))) {
                              setDeleting(null);
                              focusList();
                            }
                          },
                          children: "Delete reply"
                        }), _$createComponent(Button, {
                          type: "button",
                          size: "small",
                          onClick: () => {
                            setDeleting(null);
                            focusList();
                          },
                          children: "Cancel"
                        })];
                      }
                    }));
                    return _el$1;
                  })()
                }));
                return _el$9;
              }
            })];
          },
          get children() {
            var _el$2 = _tmpl$(), _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling, _el$6 = _el$5.firstChild, _el$7 = _el$5.nextSibling;
            _el$2.addEventListener("submit", save);
            _$insert(_el$3, _$createComponent(Input, {
              ref: (element) => {
                titleInput = element;
              },
              get value() {
                return title();
              },
              onChange: setTitle,
              get maxlength() {
                return limits.title;
              },
              required: true,
              placeholder: "Welcome message"
            }), null);
            _$insert(_el$5, _$createComponent(Textarea, {
              get value() {
                return text();
              },
              onChange: setText,
              get maxlength() {
                return limits.text;
              },
              required: true,
              rows: 6,
              placeholder: "Hey, welcome! Here\u2019s where to get started\u2026"
            }), null);
            _$insert(_el$2, _$createComponent(Hint, {
              children: "Plain text only. Selecting a reply never sends it automatically."
            }), _el$7);
            _$insert(_el$7, _$createComponent(Button, {
              type: "submit",
              variant: "primary",
              children: "Save reply"
            }), null);
            _$insert(_el$7, _$createComponent(Button, {
              type: "button",
              onClick: () => {
                setEditing(null);
                focusList();
              },
              children: "Cancel"
            }), null);
            return _el$2;
          }
        }));
        return _el$;
      })();
    }
    return {
      onLoad() {
        if (typeof yapmod.composer?.registerTool !== "function") {
          throw new Error("Saved Replies requires Yapmod client 1.2.0 or later. Update Yapmod, then enable the plugin again.");
        }
        disposed = false;
        setReplies(readReplies(yapmod.storage.savedReplies));
        removeStyle = yapmod.ui.injectCss(`
        .sr-panel { display: grid; gap: 16px; }
        .sr-heading, .sr-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .sr-heading { justify-content: space-between; }
        .sr-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; max-height: 50vh; overflow: auto; }
        .sr-item { padding: 12px; border: 1px solid var(--border, var(--yp-border, #444)); border-radius: 8px; }
        .sr-insert { max-width: 100%; white-space: normal; overflow-wrap: anywhere; text-align: left; }
        .sr-preview { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 5em; overflow: auto; margin: 8px 0; color: var(--text, var(--yp-text)); }
        .sr-form, .sr-form label { display: grid; gap: 8px; }
        .sr-form { gap: 16px; }
      `);
        stopTool = yapmod.composer.registerTool({
          id: "saved-replies",
          label: "Saved Replies",
          icon: "pencil",
          onActivate(context) {
            try {
              const target = captureTarget(context);
              closePicker = yapmod.ui.openModal({
                title: "Saved Replies",
                content: (close) => _$createComponent(RepliesPanel, {
                  target,
                  close
                }),
                onClose: () => {
                  closePicker = void 0;
                  if (!disposed && target.input.isConnected && location.href === target.url) {
                    target.input.focus({
                      preventScroll: true
                    });
                  }
                }
              });
            } catch (error) {
              report(error);
            }
          }
        });
      },
      settings() {
        return _$createComponent(RepliesPanel, {});
      },
      onUnload() {
        disposed = true;
        closePicker?.();
        stopTool?.();
        removeStyle?.();
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
