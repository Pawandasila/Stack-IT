const Question = require('../models/Question');

exports.askQuestion = async (req, res) => {
  try {
    const question = new Question({
      title: req.body.title,
      content: req.body.content,
      author: req.userId
    });
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post question' });
  }
};

exports.getAllQuestions = async (req, res) => {
  const questions = await Question.find().populate('author').sort({ createdAt: -1 });
  res.json(questions);
};

exports.searchQuestions = async (req, res) => {
  const q = req.query.q;
  const results = await Question.find({
    $or: [
      { title: new RegExp(q, 'i') },
      { content: new RegExp(q, 'i') }
    ]
  });
  res.json(results);
};

exports.getQuestionById = async (req, res) => {
  const question = await Question.findById(req.params.id).populate('author');
  if (!question) return res.status(404).json({ error: 'Not found' });
  res.json(question);
};

exports.voteOnQuestion = async (req, res) => {
  const { voteType } = req.body;
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ error: 'Not found' });

  voteType === 'up' ? question.votes++ : question.votes--;
  await question.save();
  res.json(question);
};
