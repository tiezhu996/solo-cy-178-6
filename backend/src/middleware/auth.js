const { MESSAGES } = require('../config/constants');
const AuthService = require('../services/authService');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: MESSAGES.UNAUTHORIZED });
  }
  try {
    const payload = AuthService.verify(token);
    req.user = { id: payload.id, penName: payload.penName };
    next();
  } catch (_err) {
    return res.status(401).json({ error: MESSAGES.UNAUTHORIZED });
  }
};
