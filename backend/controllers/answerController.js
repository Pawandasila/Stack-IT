const Answer = require('../models/Answer');

exports.postAnswer = async (req, res) => {
  try {
    const answer = new Answer({
      content: req.body.content,
      question: req.params.questionId,
      author: req.userId
    });
    await answer.save();
    res.status(201).json(answer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post answer' });
  }
};

exports.getAnswersForQuestion = async (req, res) => {
  const answers = await Answer.find({ question: req.params.questionId }).populate('author');
  res.json(answers);
};