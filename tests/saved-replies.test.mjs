import assert from 'node:assert/strict';
import test from 'node:test';
import { insertReply, readReplies } from '../plugins/saved-replies/model.ts';
import { saveReplies } from '../plugins/saved-replies/storage.ts';

const reply = { id: 'welcome', title: 'Welcome', text: 'Hello!\nWelcome aboard.' };

test('invalid stored records are dropped without losing valid replies', () => {
  assert.deepEqual(readReplies(null), []);
  assert.deepEqual(readReplies({ version: 2, replies: [reply] }), []);
  assert.deepEqual(
    readReplies({
      version: 1,
      replies: [
        null,
        reply,
        { ...reply },
        { id: 'bad', title: ' ', text: 'Hi' },
        { id: 'bad2', title: 'Hi', text: 42 },
      ],
    }),
    [reply],
  );
});

test('insertion preserves text on both sides and multiline content', () => {
  assert.deepEqual(insertReply('Hello world', 'Hello world', 6, 'dear ', 100), {
    value: 'Hello dear world',
    caret: 11,
  });
  assert.deepEqual(insertReply('', '', 0, reply.text, -1), {
    value: reply.text,
    caret: reply.text.length,
  });
});

test('a draft modified while the picker is open is preserved and appended to', () => {
  assert.deepEqual(insertReply('new draft', 'old draft', 0, ' reply', -1), {
    value: 'new draft reply',
    caret: 15,
  });
});

test('length limits use UTF-16 units and reject instead of truncating', () => {
  assert.throws(() => insertReply('1234', '1234', 2, 'xx', 5));
  assert.throws(() => insertReply('', '', 0, '😀', 1));
  assert.equal(insertReply('1234', '1234', 0, 'x', 5).value, 'x1234');
});

test('successful writes round-trip through per-plugin storage', () => {
  let raw = '{}';
  const state = {};
  const storage = new Proxy(state, {
    set(target, key, value) {
      target[key] = value;
      raw = JSON.stringify({ test: target });
      return true;
    },
  });
  saveReplies({ id: 'test', storage }, [reply], { getItem: () => raw });
  assert.deepEqual(readReplies(JSON.parse(raw).test.savedReplies), [reply]);
});

test('silently failed writes restore the previous state and report failure', () => {
  const previous = { version: 1, replies: [reply] };
  const api = { id: 'test', storage: { savedReplies: previous } };
  assert.throws(() =>
    saveReplies(api, [], { getItem: () => JSON.stringify({ test: { savedReplies: previous } }) }),
  );
  assert.equal(api.storage.savedReplies, previous);
  const empty = { id: 'test', storage: {} };
  assert.throws(() => saveReplies(empty, [reply], { getItem: () => null }));
  assert.equal('savedReplies' in empty.storage, false);
});

test('unavailable browser storage does not acknowledge a save', () => {
  const api = { id: 'test', storage: {} };
  assert.throws(
    () =>
      saveReplies(api, [reply], {
        getItem() {
          throw new Error('blocked');
        },
      }),
    /blocked/,
  );
  assert.equal('savedReplies' in api.storage, false);
});
