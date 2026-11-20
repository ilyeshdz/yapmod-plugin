const messageSelector = '.messages .msg[data-message-id]';
const interactiveSelector = [
  'a', 'button', 'input', 'label', 'textarea', 'select', 'summary',
  'img', 'picture', 'video', 'audio', '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]', '[role="link"]', '.msg-actions', '.reactions', '.reply-preview',
  '.mention', '.msg-image', '.msg-linkimgs', '.msg-edited', '.attachment',
].join(',');

function findAction(event: MouseEvent): HTMLButtonElement | null {
  if (event.defaultPrevented || event.button !== 0 || event.shiftKey ||
      event.metaKey || event.altKey || event.ctrlKey) return null;

  const target = event.target;
  if (!(target instanceof Element) || target.closest(interactiveSelector)) return null;

  const message = target.closest(messageSelector);
  if (!message || message.hasAttribute('data-yp-ghost')) return null;

  for (const label of ['Edit', 'Reply']) {
    const button = message.querySelector<HTMLButtonElement>(
      `.msg-actions button[aria-label="${label}"]:enabled:not([aria-disabled="true"])`,
    );
    if (button && !button.closest('[hidden], [inert], [aria-hidden="true"]')) return button;
  }
  return null;
}

export default function () {
  // Suppress the browser's word selection only when this gesture has a native action.
  function onMouseDown(event: MouseEvent) {
    if (event.detail === 2 && findAction(event)) event.preventDefault();
  }

  function onDoubleClick(event: MouseEvent) {
    findAction(event)?.click();
  }

  return {
    onLoad() {
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('dblclick', onDoubleClick);
    },
    onUnload() {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('dblclick', onDoubleClick);
    },
  };
}
