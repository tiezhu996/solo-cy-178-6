const { Router } = require('express');
const requireAuth = require('../middleware/auth');
const LetterService = require('../services/letterService');
const { MESSAGES } = require('../config/constants');

const router = Router();
router.use(requireAuth);

router.post('/', (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '信件内容不能为空' });
    }
    const letter = LetterService.sendRandom({
      senderId: req.user.id,
      content: content.trim()
    });
    res.json({ message: MESSAGES.LETTER_SENT, id: letter.id });
  } catch (err) {
    const status = err.code === 'NO_USERS' ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/:id/reply', (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '回复内容不能为空' });
    }
    const reply = LetterService.reply({
      userId: req.user.id,
      parentId: Number(req.params.id),
      content: content.trim()
    });
    res.json({ message: MESSAGES.REPLIED, id: reply.id });
  } catch (err) {
    const status =
      err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/:id/skip', (req, res) => {
  try {
    LetterService.skip({
      userId: req.user.id,
      letterId: Number(req.params.id)
    });
    res.json({ message: MESSAGES.SKIPPED });
  } catch (err) {
    const status =
      err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/:id/favorite', (req, res) => {
  const result = LetterService.toggleFavorite({
    userId: req.user.id,
    letterId: Number(req.params.id)
  });
  res.json({
    message: result.favorited ? MESSAGES.FAVORITED : MESSAGES.UNFAVORITED,
    favorited: result.favorited
  });
});

router.get('/:id/thread', (req, res) => {
  try {
    const thread = LetterService.getThread({
      userId: req.user.id,
      rootId: Number(req.params.id)
    });
    res.json(thread);
  } catch (err) {
    const status =
      err.code === 'NOT_FOUND' ? 404 : err.code === 'FORBIDDEN' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
