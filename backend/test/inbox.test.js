// Regression tests for the consolidated inbox read flow (LetterService.listInbox).
// Runs against a throwaway SQLite database (SQLITE_PATH is set before any src
// module is required) and deletes it afterwards, so it never touches real data
// and repeated runs produce identical results.
const path = require('path');
const os = require('os');
const fs = require('fs');

const TEST_DB = path.join(os.tmpdir(), `gb178-inbox-test-${process.pid}.db`);
for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(TEST_DB + suffix, { force: true });
}
process.env.SQLITE_PATH = TEST_DB;

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/data/database');
const UserModel = require('../src/models/userModel');
const LetterModel = require('../src/models/letterModel');
const FavoriteModel = require('../src/models/favoriteModel');
const LetterService = require('../src/services/letterService');
const { LETTER_STATUS } = require('../src/config/constants');

// Fixed timestamps keep ordering (and therefore every assertion) deterministic.
const T0 = 1_700_000_000_000;
const ITEM_KEYS = ['createdAt', 'favorited', 'id', 'preview', 'replyCount', 'role', 'status'];

function addUser(name) {
  return Number(UserModel.create({ penName: name, passwordHash: 'test-hash', createdAt: T0 }));
}

function addLetter(senderId, receiverId, parentId, content, status, offset) {
  return Number(
    LetterModel.create({
      senderId,
      receiverId,
      parentId,
      content,
      status,
      createdAt: T0 + offset
    })
  );
}

function addFavorite(userId, letterId, offset) {
  FavoriteModel.add({ userId, letterId, createdAt: T0 + offset });
}

// Users: A<->B exchange letters (the main scenario), C<->D hold a foreign
// conversation, E has nothing at all, F<->G are reserved for the reply-count
// test so it stays isolated from the shared dataset.
const U = {};
const L = {};
const LONG_CONTENT = '长'.repeat(100);

before(() => {
  U.A = addUser('旅人甲');
  U.B = addUser('旅人乙');
  U.C = addUser('旅人丙');
  U.D = addUser('旅人丁');
  U.E = addUser('旅人戊');
  U.F = addUser('旅人己');
  U.G = addUser('旅人庚');

  // A -> B: one long letter, one later skipped, one that becomes a conversation.
  L.l1 = addLetter(U.A, U.B, null, LONG_CONTENT, LETTER_STATUS.DELIVERED, 1);
  L.l2 = addLetter(U.A, U.B, null, '这封会被跳过', LETTER_STATUS.SKIPPED, 2);
  L.l3 = addLetter(U.A, U.B, null, '这封会变成对话', LETTER_STATUS.REPLIED, 3);
  L.r1 = addLetter(U.B, U.A, L.l3, '乙的回信', LETTER_STATUS.REPLIED, 4);

  // A conversation that involves neither A nor B.
  L.l4 = addLetter(U.C, U.D, null, '丙丁之间的信', LETTER_STATUS.REPLIED, 5);
  L.r3 = addLetter(U.D, U.C, L.l4, '丁的回信', LETTER_STATUS.REPLIED, 6);

  // Favorites are per-user: B favorites l1, A favorites l3, C favorites l4.
  addFavorite(U.B, L.l1, 7);
  addFavorite(U.A, L.l3, 8);
  addFavorite(U.C, L.l4, 9);
});

after(() => {
  db.close();
  for (const suffix of ['', '-wal', '-shm']) {
    fs.rmSync(TEST_DB + suffix, { force: true });
  }
});

test('empty inbox returns three empty lists', () => {
  assert.deepEqual(LetterService.listInbox(U.E), {
    sent: [],
    received: [],
    conversations: []
  });
});

test('sent: only own root letters, newest first, with role/status/favorite/replyCount', () => {
  const inbox = LetterService.listInbox(U.A);
  assert.deepEqual(inbox.sent.map((x) => x.id), [L.l3, L.l2, L.l1]);
  assert.ok(inbox.sent.every((x) => x.role === 'sent'));
  const byId = Object.fromEntries(inbox.sent.map((x) => [x.id, x]));
  assert.equal(byId[L.l3].status, LETTER_STATUS.REPLIED);
  assert.equal(byId[L.l2].status, LETTER_STATUS.SKIPPED);
  assert.equal(byId[L.l1].status, LETTER_STATUS.DELIVERED);
  // A favorited l3 only; B's favorite of l1 must not leak into A's list.
  assert.equal(byId[L.l3].favorited, true);
  assert.equal(byId[L.l2].favorited, false);
  assert.equal(byId[L.l1].favorited, false);
  assert.equal(byId[L.l3].replyCount, 1);
  assert.equal(byId[L.l2].replyCount, 0);
  assert.equal(byId[L.l1].replyCount, 0);
  // A never received a root letter.
  assert.deepEqual(inbox.received, []);
});

test('received: only letters addressed to the user, newest first', () => {
  const inbox = LetterService.listInbox(U.B);
  assert.deepEqual(inbox.received.map((x) => x.id), [L.l3, L.l2, L.l1]);
  assert.ok(inbox.received.every((x) => x.role === 'received'));
  const byId = Object.fromEntries(inbox.received.map((x) => [x.id, x]));
  // B favorited l1; A's favorite of l3 must not leak into B's list.
  assert.equal(byId[L.l1].favorited, true);
  assert.equal(byId[L.l3].favorited, false);
  assert.equal(byId[L.l2].status, LETTER_STATUS.SKIPPED);
  assert.equal(byId[L.l3].replyCount, 1);
  // B sent replies but no root letters.
  assert.deepEqual(inbox.sent, []);
});

test('unreplied letters stay out of conversations and keep replyCount 0', () => {
  for (const userId of [U.A, U.B]) {
    const inbox = LetterService.listInbox(userId);
    const conversationIds = inbox.conversations.map((x) => x.id);
    assert.ok(!conversationIds.includes(L.l1));
    assert.ok(!conversationIds.includes(L.l2));
  }
  const sentById = Object.fromEntries(
    LetterService.listInbox(U.A).sent.map((x) => [x.id, x])
  );
  assert.equal(sentById[L.l1].replyCount, 0);
  assert.equal(sentById[L.l2].replyCount, 0);
});

test('same root letter appears in both sent and conversations once replied', () => {
  const inboxA = LetterService.listInbox(U.A);
  const inSent = inboxA.sent.find((x) => x.id === L.l3);
  const inConversation = inboxA.conversations.find((x) => x.id === L.l3);
  assert.ok(inSent && inConversation);
  assert.equal(inSent.role, 'sent');
  assert.equal(inConversation.role, 'either');
  assert.equal(inSent.replyCount, inConversation.replyCount);
  assert.equal(inSent.favorited, inConversation.favorited);
  assert.equal(inSent.status, inConversation.status);

  const inboxB = LetterService.listInbox(U.B);
  assert.ok(inboxB.received.some((x) => x.id === L.l3));
  const bConversation = inboxB.conversations.find((x) => x.id === L.l3);
  assert.ok(bConversation);
  assert.equal(bConversation.role, 'either');
});

test('conversations only contain threads the user participates in', () => {
  assert.deepEqual(
    LetterService.listInbox(U.A).conversations.map((x) => x.id),
    [L.l3]
  );
  assert.deepEqual(
    LetterService.listInbox(U.B).conversations.map((x) => x.id),
    [L.l3]
  );
  // The C<->D thread exists but is invisible to A and B, and visible to C and D.
  assert.deepEqual(
    LetterService.listInbox(U.C).conversations.map((x) => x.id),
    [L.l4]
  );
  assert.deepEqual(
    LetterService.listInbox(U.D).conversations.map((x) => x.id),
    [L.l4]
  );
});

test('reply count grows as replies are added', () => {
  const letterId = addLetter(U.F, U.G, null, '计数信', LETTER_STATUS.DELIVERED, 100);

  let inboxF = LetterService.listInbox(U.F);
  assert.equal(inboxF.sent[0].replyCount, 0);
  assert.deepEqual(inboxF.conversations, []);

  addLetter(U.G, U.F, letterId, '第一封回信', LETTER_STATUS.REPLIED, 101);
  inboxF = LetterService.listInbox(U.F);
  assert.equal(inboxF.sent[0].replyCount, 1);
  assert.equal(inboxF.conversations.length, 1);
  assert.equal(inboxF.conversations[0].replyCount, 1);

  addLetter(U.F, U.G, letterId, '第二封回信', LETTER_STATUS.REPLIED, 102);
  inboxF = LetterService.listInbox(U.F);
  assert.equal(inboxF.sent[0].replyCount, 2);
  assert.equal(inboxF.conversations[0].replyCount, 2);

  const inboxG = LetterService.listInbox(U.G);
  assert.equal(inboxG.received[0].replyCount, 2);
  assert.equal(inboxG.conversations[0].replyCount, 2);
});

test('every list item keeps the API shape and preview truncation', () => {
  for (const userId of [U.A, U.B, U.C, U.D]) {
    const inbox = LetterService.listInbox(userId);
    for (const listName of ['sent', 'received', 'conversations']) {
      for (const item of inbox[listName]) {
        assert.deepEqual(Object.keys(item).sort(), ITEM_KEYS);
        assert.ok(item.preview.length <= 80);
      }
    }
  }
  const l1 = LetterService.listInbox(U.A).sent.find((x) => x.id === L.l1);
  assert.equal(l1.preview, LONG_CONTENT.slice(0, 80));
});
