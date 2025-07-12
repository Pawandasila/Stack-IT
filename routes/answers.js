const express = require('express');
const router = express.Router();
const {
  postAnswer, getAnswersForQuestion
} = require('../controllers/answerController');

router.post('/:questionId', postAnswer);
router.get('/:questionId', getAnswersForQuestion);

module.exports = router;
