const LetterModel = require('../models/letterModel');
const UserModel = require('../models/userModel');
const FavoriteModel = require('../models/favoriteModel');
const { LETTER_STATUS, MESSAGES } = require('../config/constants');

const LetterService = {
  sendRandom({ senderId, content }) {
    const other = UserModel.findRandomOther(senderId);
    if (!other) {
      const err = new Error(MESSAGES.NO_OTHER_USERS);
      err.code = 'NO_USERS';
      throw err;
    }
    const id = LetterModel.create({
      senderId,
      receiverId: other.id,
      parentId: null,
      content,
      status: LETTER_STATUS.DELIVERED,
      createdAt: Date.now()
    });
    return LetterModel.findById(id);
  },

  reply({ userId, parentId, content }) {
    const parent = LetterModel.findById(parentId);
    if (!parent) {
      const err = new Error(MESSAGES.LETTER_NOT_FOUND);
      err.code = 'NOT_FOUND';
      throw err;
    }
    const isReceiver = parent.receiver_id === userId;
    const isSender = parent.sender_id === userId;
    if (!isReceiver && !isSender) {
      const err = new Error(MESSAGES.NOT_YOUR_LETTER);
      err.code = 'FORBIDDEN';
      throw err;
    }
    const receiverId = isReceiver ? parent.sender_id : parent.receiver_id;

    const rootId = LetterModel.findRootByChild(parent.id);
    const id = LetterModel.create({
      senderId: userId,
      receiverId,
      parentId: rootId,
      content,
      status: LETTER_STATUS.REPLIED,
      createdAt: Date.now()
    });
    if (parent.status === LETTER_STATUS.DELIVERED || parent.status === LETTER_STATUS.PENDING) {
      LetterModel.updateStatus(parent.id, LETTER_STATUS.REPLIED);
    }
    return LetterModel.findById(id);
  },

  skip({ userId, letterId }) {
    const letter = LetterModel.findById(letterId);
    if (!letter) {
      const err = new Error(MESSAGES.LETTER_NOT_FOUND);
      err.code = 'NOT_FOUND';
      throw err;
    }
    if (letter.receiver_id !== userId) {
      const err = new Error(MESSAGES.NOT_YOUR_LETTER);
      err.code = 'FORBIDDEN';
      throw err;
    }
    LetterModel.updateStatus(letterId, LETTER_STATUS.SKIPPED);
    return true;
  },

  toggleFavorite({ userId, letterId }) {
    const exists = FavoriteModel.exists({ userId, letterId });
    if (exists) {
      FavoriteModel.remove({ userId, letterId });
      return { favorited: false };
    }
    FavoriteModel.add({ userId, letterId, createdAt: Date.now() });
    return { favorited: true };
  },

  isFavorited({ userId, letterId }) {
    return FavoriteModel.exists({ userId, letterId });
  },

  listInbox(userId) {
    const roots = LetterModel.listRootsInvolvingUser(userId);
    const favorites = new Set(
      FavoriteModel.listByUser(userId).map((l) => l.id)
    );
    const decorate = (l, role) => ({
      id: l.id,
      preview: l.content.slice(0, 80),
      status: l.status,
      createdAt: l.created_at,
      replyCount: l.reply_count,
      role,
      favorited: favorites.has(l.id)
    });
    const inbox = { sent: [], received: [], conversations: [] };
    for (const letter of roots) {
      if (letter.sender_id === userId) {
        inbox.sent.push(decorate(letter, 'sent'));
      }
      if (letter.receiver_id === userId) {
        inbox.received.push(decorate(letter, 'received'));
      }
      if (letter.reply_count > 0) {
        inbox.conversations.push(decorate(letter, 'either'));
      }
    }
    return inbox;
  },

  getThread({ userId, rootId }) {
    const thread = LetterModel.listThread(rootId);
    if (!thread.length) {
      const err = new Error(MESSAGES.LETTER_NOT_FOUND);
      err.code = 'NOT_FOUND';
      throw err;
    }
    const first = thread[0];
    if (first.sender_id !== userId && first.receiver_id !== userId) {
      const err = new Error(MESSAGES.NOT_YOUR_LETTER);
      err.code = 'FORBIDDEN';
      throw err;
    }
    const me = userId;
    return {
      rootId,
      favorited: FavoriteModel.exists({ userId, letterId: rootId }),
      messages: thread.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.created_at,
        fromMe: m.sender_id === me
      }))
    };
  }
};

module.exports = LetterService;
