export interface Reply {
  id: string;
  title: string;
  text: string;
}

export const limits = { replies: 100, title: 80, text: 10_000 };

export function readReplies(value: unknown): Reply[] {
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('replies' in value) ||
    !Array.isArray(value.replies)
  )
    return [];
  const ids = new Set<string>();
  const replies: Reply[] = [];
  for (const item of value.replies) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      !item.id ||
      item.id.length > 100 ||
      ids.has(item.id) ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      item.title.length > limits.title ||
      typeof item.text !== 'string' ||
      !item.text.trim() ||
      item.text.length > limits.text
    )
      continue;
    ids.add(item.id);
    replies.push({ id: item.id, title: item.title, text: item.text });
    if (replies.length === limits.replies) break;
  }
  return replies;
}

export function insertReply(
  current: string,
  original: string,
  caret: number,
  text: string,
  maxLength: number,
) {
  // If the host changed the draft while the picker was open, keep that change and append.
  const position =
    current === original ? Math.max(0, Math.min(caret, current.length)) : current.length;
  const value = current.slice(0, position) + text + current.slice(position);
  if (maxLength >= 0 && value.length > maxLength) {
    throw new Error(
      'This reply would exceed the message length limit. Shorten the draft or reply first.',
    );
  }
  return { value, caret: position + text.length };
}
