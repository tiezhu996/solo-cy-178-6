const { Router } = require('express');
const requireAuth = require('../middleware/auth');
const LetterService = require('../services/letterService');

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const data = LetterService.listInbox(req.user.id);
  res.json(data);
});

module.exports = router;
