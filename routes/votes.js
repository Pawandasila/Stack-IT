const express = require('express');
const router = express.Router();
const {
  voteQuestion, voteAnswer, voteComment
} = require('../controllers/voteController');

router.post('/question/:id', voteQuestion);
router.post('/answer/:id', voteAnswer);
router.post('/comment/:id', voteComment);

module.exports = router;
