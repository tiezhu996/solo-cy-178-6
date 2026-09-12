const { Router } = require('express');
const AuthService = require('../services/authService');
const { MESSAGES } = require('../config/constants');

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { penName, password } = req.body || {};
    if (!penName || !password) {
      return res.status(400).json({ error: '笔名和密码不能为空' });
    }
    const result = AuthService.register({ penName, password });
    res.json({ message: MESSAGES.REGISTER_OK, ...result });
  } catch (err) {
    const status = err.code === 'DUPLICATE' ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { penName, password } = req.body || {};
    const result = AuthService.login({ penName, password });
    res.json(result);
  } catch (err) {
    const status = err.code === 'INVALID' ? 401 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ id: req.user.id, penName: req.user.penName });
});

module.exports = router;
