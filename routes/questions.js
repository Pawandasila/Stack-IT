const express = require('express');
const router = express.Router();
const {
  askQuestion, getAllQuestions, getQuestionById, searchQuestions, voteOnQuestion
} = require('../controllers/questionController');

router.post('/ask', askQuestion);
router.get('/', getAllQuestions);
router.get('/search', searchQuestions);
router.get('/:id', getQuestionById);
router.post('/:id/vote', voteOnQuestion);

module.exports = router;
