import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { Button, Hint, Input, Textarea } from '@yapmod/ui';
import { captureTarget, insertIntoComposer } from './composer';
import type { Target } from './composer';
import { limits, readReplies } from './model';
import type { Reply } from './model';
import { saveReplies } from './storage';

export default function () {
  const [replies, setReplies] = createSignal<Reply[]>([]);
  let closePicker: (() => void) | undefined;
  let stopTool: (() => void) | undefined;
  let removeStyle: (() => void) | undefined;
  let disposed = false;

  function report(error: unknown) {
    console.error('[yapmod] saved replies:', error);
    yapmod.ui.showToast(
      error instanceof Error ? error.message : 'Saved Replies could not complete this action.',
      'error',
    );
  }

  function persist(next: Reply[]) {
    try {
      saveReplies(yapmod, next);
      setReplies(next);
      return true;
    } catch (error) {
      report(error);
      return false;
    }
  }

  function RepliesPanel(props: { target?: Target; close?: () => void }) {
    const [editing, setEditing] = createSignal<string | null>(null);
    const [title, setTitle] = createSignal('');
    const [text, setText] = createSignal('');
    const [deleting, setDeleting] = createSignal<string | null>(null);
    let root!: HTMLDivElement;
    let titleInput!: HTMLInputElement;
    let newButton!: HTMLButtonElement;

    function focusList() {
      queueMicrotask(() => {
        if (root.isConnected)
          (root.querySelector<HTMLButtonElement>('.sr-insert') ?? newButton).focus();
      });
    }

    function edit(reply?: Reply) {
      setDeleting(null);
      setTitle(reply?.title ?? '');
      setText(reply?.text ?? '');
      setEditing(reply?.id ?? '');
      queueMicrotask(() => titleInput?.isConnected && titleInput.focus());
    }

    function save(event: SubmitEvent) {
      event.preventDefault();
      const cleanTitle = title().trim();
      if (!cleanTitle || !text().trim()) {
        yapmod.ui.showToast('Enter a title and a message.', 'error');
        return;
      }
      if (cleanTitle.length > limits.title || text().length > limits.text) return;
      const id = editing();
      if (id === null) return;
      if (!id && replies().length >= limits.replies) {
        yapmod.ui.showToast(`You can save up to ${limits.replies} replies.`, 'error');
        return;
      }
      const reply = { id: id || crypto.randomUUID(), title: cleanTitle, text: text() };
      const next = id
        ? replies().map((item) => (item.id === id ? reply : item))
        : [...replies(), reply];
      if (persist(next)) {
        setEditing(null);
        yapmod.ui.showToast('Reply saved.', 'success');
        focusList();
      }
    }

    function insert(reply: Reply) {
      if (!props.target) return;
      try {
        insertIntoComposer(props.target, reply.text);
        props.close?.();
      } catch (error) {
        report(error);
      }
    }

    onMount(() => {
      // The host modal handles Escape but does not trap focus. Keep Tab inside
      // this dialog, including the close button outside the plugin content.
      const trap = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;
        const modal = root.closest('.modal');
        if (!modal?.contains(document.activeElement)) return;
        const controls = [
          ...modal.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length > 0);
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
      document.addEventListener('keydown', trap);
      onCleanup(() => document.removeEventListener('keydown', trap));
      // Run after the host's initial modal-focus microtask.
      queueMicrotask(focusList);
    });

    return (
      <div
        class="sr-panel"
        ref={(element) => {
          root = element;
        }}
      >
        <Show
          when={editing() !== null}
          fallback={
            <>
              <div class="sr-heading">
                <Hint>
                  {props.target
                    ? 'Choose a reply to insert. You can edit it before sending.'
                    : 'Create and manage messages for the Saved Replies composer button.'}
                </Hint>
                <Button
                  ref={(element) => {
                    newButton = element;
                  }}
                  type="button"
                  variant="primary"
                  disabled={replies().length >= limits.replies}
                  onClick={() => edit()}
                >
                  New reply
                </Button>
              </div>
              <Show
                when={replies().length > 0}
                fallback={
                  <p class="hint">
                    No saved replies yet. Add a welcome message, useful links, or a question you ask
                    often.
                  </p>
                }
              >
                <ul class="sr-list">
                  <For each={replies()}>
                    {(reply) => (
                      <li class="sr-item">
                        <Show when={props.target} fallback={<strong>{reply.title}</strong>}>
                          <Button
                            class="sr-insert"
                            type="button"
                            onClick={() => insert(reply)}
                            aria-label={`Insert ${reply.title}`}
                          >
                            {reply.title}
                          </Button>
                        </Show>
                        <p class="sr-preview">{reply.text}</p>
                        <div class="sr-actions">
                          <Show
                            when={deleting() === reply.id}
                            fallback={
                              <>
                                <Button
                                  type="button"
                                  size="small"
                                  onClick={() => edit(reply)}
                                  aria-label={`Edit ${reply.title}`}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="small"
                                  onClick={() => {
                                    setDeleting(reply.id);
                                    queueMicrotask(() =>
                                      root
                                        .querySelector<HTMLButtonElement>('[data-sr-confirm]')
                                        ?.focus(),
                                    );
                                  }}
                                  aria-label={`Delete ${reply.title}`}
                                >
                                  Delete
                                </Button>
                              </>
                            }
                          >
                            <span>Delete this reply?</span>
                            <Button
                              data-sr-confirm
                              type="button"
                              variant="danger"
                              size="small"
                              onClick={() => {
                                if (persist(replies().filter((item) => item.id !== reply.id))) {
                                  setDeleting(null);
                                  focusList();
                                }
                              }}
                            >
                              Delete reply
                            </Button>
                            <Button
                              type="button"
                              size="small"
                              onClick={() => {
                                setDeleting(null);
                                focusList();
                              }}
                            >
                              Cancel
                            </Button>
                          </Show>
                        </div>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </>
          }
        >
          <form class="sr-form" onSubmit={save}>
            <label>
              Title
              <Input
                ref={(element) => {
                  titleInput = element;
                }}
                value={title()}
                onChange={setTitle}
                maxlength={limits.title}
                required
                placeholder="Welcome message"
              />
            </label>
            <label>
              Message
              <Textarea
                value={text()}
                onChange={setText}
                maxlength={limits.text}
                required
                rows={6}
                placeholder="Hey, welcome! Here’s where to get started…"
              />
            </label>
            <Hint>Plain text only. Selecting a reply never sends it automatically.</Hint>
            <div class="sr-actions">
              <Button type="submit" variant="primary">
                Save reply
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditing(null);
                  focusList();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Show>
      </div>
    );
  }

  return {
    onLoad() {
      if (typeof yapmod.composer?.registerTool !== 'function') {
        throw new Error(
          'Saved Replies requires Yapmod client 1.2.0 or later. Update Yapmod, then enable the plugin again.',
        );
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
        id: 'saved-replies',
        label: 'Saved Replies',
        icon: 'pencil',
        onActivate(context) {
          try {
            const target = captureTarget(context);
            closePicker = yapmod.ui.openModal({
              title: 'Saved Replies',
              content: (close) => <RepliesPanel target={target} close={close} />,
              onClose: () => {
                closePicker = undefined;
                if (!disposed && target.input.isConnected && location.href === target.url) {
                  target.input.focus({ preventScroll: true });
                }
              },
            });
          } catch (error) {
            report(error);
          }
        },
      });
    },
    settings() {
      return <RepliesPanel />;
    },
    onUnload() {
      disposed = true;
      closePicker?.();
      stopTool?.();
      removeStyle?.();
    },
  };
}
