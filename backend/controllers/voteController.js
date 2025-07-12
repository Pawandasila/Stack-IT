const Vote = require('../models/Vote');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Comment = require('../models/Comment');

exports.voteQuestion = async (req, res) => {
  const { voteType } = req.body;
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ error: 'Not found' });
  voteType === 'up' ? question.votes++ : question.votes--;
  await question.save();
  res.json(question);
};

exports.voteAnswer = async (req, res) => {
  const { voteType } = req.body;
  const answer = await Answer.findById(req.params.id);
  if (!answer) return res.status(404).json({ error: 'Not found' });
  voteType === 'up' ? answer.votes++ : answer.votes--;
  await answer.save();
  res.json(answer);
};

exports.voteComment = async (req, res) => {
  const { voteType } = req.body;
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  voteType === 'up' ? comment.votes++ : comment.votes--;
  await comment.save();
  res.json(comment);
};
