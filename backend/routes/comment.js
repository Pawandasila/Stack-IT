const express = require('express');
const router = express.Router();
const {
  addCommentToQuestion, addCommentToAnswer
} = require('../controllers/commentController');

router.post('/question/:id', addCommentToQuestion);
router.post('/answer/:id', addCommentToAnswer);

module.exports = router;
