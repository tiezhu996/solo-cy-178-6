const db = require('../data/database');

const LetterModel = {
  create({ senderId, receiverId, parentId, content, status, createdAt }) {
    const stmt = db.prepare(
      `INSERT INTO letters (sender_id, receiver_id, parent_id, content, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(senderId, receiverId, parentId || null, content, status, createdAt);
    return info.lastInsertRowid;
  },

  findById(id) {
    return db.prepare('SELECT * FROM letters WHERE id = ?').get(id);
  },

  findRootByChild(id) {
    const row = db
      .prepare(
        `WITH RECURSIVE chain(id, parent_id) AS (
           SELECT id, parent_id FROM letters WHERE id = ?
           UNION ALL
           SELECT l.id, l.parent_id FROM letters l
           INNER JOIN chain c ON l.id = c.parent_id
         )
         SELECT id FROM chain WHERE parent_id IS NULL`
      )
      .get(id);
    return row ? row.id : id;
  },

  updateStatus(id, status) {
    return db.prepare('UPDATE letters SET status = ? WHERE id = ?').run(status, id);
  },

  listRootsInvolvingUser(userId) {
    return db
      .prepare(
        `SELECT l.*,
          (SELECT COUNT(*) FROM letters c WHERE c.parent_id = l.id) AS reply_count
         FROM letters l
         WHERE l.parent_id IS NULL
           AND (l.sender_id = ? OR l.receiver_id = ?)
         ORDER BY l.created_at DESC`
      )
      .all(userId, userId);
  },

  listThread(rootId) {
    return db
      .prepare(
        `WITH RECURSIVE chain(id, parent_id, depth) AS (
           SELECT id, parent_id, 0 FROM letters WHERE id = ?
           UNION ALL
           SELECT l.id, l.parent_id, c.depth + 1 FROM letters l
           INNER JOIN chain c ON l.parent_id = c.id
         )
         SELECT l.* FROM letters l
         INNER JOIN chain c ON l.id = c.id
         ORDER BY c.depth ASC, l.created_at ASC`
      )
      .all(rootId);
  }
};

module.exports = LetterModel;
