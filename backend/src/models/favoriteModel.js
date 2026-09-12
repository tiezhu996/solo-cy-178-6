const db = require('../data/database');

const FavoriteModel = {
  add({ userId, letterId, createdAt }) {
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO favorites (user_id, letter_id, created_at) VALUES (?, ?, ?)'
    );
    return stmt.run(userId, letterId, createdAt);
  },

  remove({ userId, letterId }) {
    return db
      .prepare('DELETE FROM favorites WHERE user_id = ? AND letter_id = ?')
      .run(userId, letterId);
  },

  exists({ userId, letterId }) {
    const row = db
      .prepare('SELECT 1 FROM favorites WHERE user_id = ? AND letter_id = ?')
      .get(userId, letterId);
    return !!row;
  },

  listByUser(userId) {
    return db
      .prepare(
        `SELECT l.* FROM letters l
         INNER JOIN favorites f ON f.letter_id = l.id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`
      )
      .all(userId);
  }
};

module.exports = FavoriteModel;
