import type { ComposerToolContext } from '@yapmod/types';
import { insertReply } from './model.ts';

export interface Target {
  input: HTMLTextAreaElement;
  original: string;
  caret: number;
  url: string;
}

export function captureTarget(context: ComposerToolContext): Target {
  // focus() identifies the exact SDK-selected composer, including overflow tools.
  // Never guess with document.querySelector when more than one composer exists.
  context.focus();
  const input = document.activeElement;
  if (
    !(input instanceof HTMLTextAreaElement) ||
    !input.isConnected ||
    !input.matches('.composer textarea, .composer-box textarea, textarea.msg-input')
  ) {
    throw new Error(
      'This composer is no longer available. Open Saved Replies from the message box again.',
    );
  }
  return { input, original: input.value, caret: input.selectionEnd, url: location.href };
}

export function insertIntoComposer(target: Target, text: string) {
  const { input } = target;
  if (!input.isConnected || input.disabled || input.readOnly || location.href !== target.url) {
    throw new Error(
      'The conversation or composer changed. Reopen Saved Replies from the message box.',
    );
  }
  const next = insertReply(input.value, target.original, target.caret, text, input.maxLength);
  // The native setter bypasses React's value tracker; a bubbling input event lets
  // React accept the edit. Assigning input.value alone would leave its draft stale.
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (!setter) throw new Error('This browser does not support inserting saved replies.');
  setter.call(input, next.value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.focus({ preventScroll: true });
  input.setSelectionRange(next.caret, next.caret);
}
