const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const { JWT, MESSAGES } = require('../config/constants');

const AuthService = {
  register({ penName, password }) {
    const existing = UserModel.findByPenName(penName);
    if (existing) {
      const err = new Error(MESSAGES.USERNAME_TAKEN);
      err.code = 'DUPLICATE';
      throw err;
    }
    const hash = bcrypt.hashSync(password, 10);
    const id = UserModel.create({
      penName,
      passwordHash: hash,
      createdAt: Date.now()
    });
    return { id, penName, token: AuthService._issue(id, penName) };
  },

  login({ penName, password }) {
    const user = UserModel.findByPenName(penName);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      const err = new Error(MESSAGES.LOGIN_FAIL);
      err.code = 'INVALID';
      throw err;
    }
    return {
      id: user.id,
      penName: user.pen_name,
      token: AuthService._issue(user.id, user.pen_name)
    };
  },

  _issue(id, penName) {
    return jwt.sign({ id, penName }, JWT.SECRET, { expiresIn: JWT.EXPIRY });
  },

  verify(token) {
    return jwt.verify(token, JWT.SECRET);
  }
};

module.exports = AuthService;
