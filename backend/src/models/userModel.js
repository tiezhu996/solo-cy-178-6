const db = require('../data/database');

const UserModel = {
  create({ penName, passwordHash, createdAt }) {
    const stmt = db.prepare(
      'INSERT INTO users (pen_name, password_hash, created_at) VALUES (?, ?, ?)'
    );
    const info = stmt.run(penName, passwordHash, createdAt);
    return info.lastInsertRowid;
  },

  findByPenName(penName) {
    return db.prepare('SELECT * FROM users WHERE pen_name = ?').get(penName);
  },

  findById(id) {
    return db.prepare('SELECT id, pen_name, created_at FROM users WHERE id = ?').get(id);
  },

  findRandomOther(id) {
    return db
      .prepare('SELECT id FROM users WHERE id != ? ORDER BY RANDOM() LIMIT 1')
      .get(id);
  },

  countOthers(id) {
    const row = db.prepare('SELECT COUNT(*) AS c FROM users WHERE id != ?').get(id);
    return row.c;
  }
};

module.exports = UserModel;
