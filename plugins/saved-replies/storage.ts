import type { YapmodPluginApi } from '@yapmod/types';
import type { Reply } from './model';

export function saveReplies(
  api: Pick<YapmodPluginApi, 'id' | 'storage'>,
  replies: Reply[],
  storage: Pick<Storage, 'getItem'> = localStorage,
) {
  const value = { version: 1, replies };
  const previous = api.storage.savedReplies;
  const hadPrevious = 'savedReplies' in api.storage;
  try {
    api.storage.savedReplies = value;
    // Client 1.2 swallows localStorage write errors. Verify its versioned backing
    // record after using the public setter, so a quota error never looks like a save.
    const raw = storage.getItem('yapmod.plugins.data.v1');
    const persisted: unknown = raw ? JSON.parse(raw) : null;
    const record =
      persisted && typeof persisted === 'object' && api.id in persisted
        ? (persisted as Record<string, unknown>)[api.id]
        : undefined;
    if (
      !record ||
      typeof record !== 'object' ||
      !('savedReplies' in record) ||
      JSON.stringify(record.savedReplies) !== JSON.stringify(value)
    ) {
      throw new Error(
        'Could not save replies. Browser storage may be full or unavailable. Your changes have not been saved.',
      );
    }
  } catch (error) {
    // Restore the public store too; the editor remains open with the unsaved text.
    if (hadPrevious) api.storage.savedReplies = previous;
    else delete api.storage.savedReplies;
    throw error;
  }
}
