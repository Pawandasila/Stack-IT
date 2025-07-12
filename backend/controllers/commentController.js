const Comment = require('../models/Comment');

exports.addCommentToQuestion = async (req, res) => {
  try {
    const comment = new Comment({
      content: req.body.content,
      author: req.userId,
      question: req.params.id
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

exports.addCommentToAnswer = async (req, res) => {
  try {
    const comment = new Comment({
      content: req.body.content,
      author: req.userId,
      answer: req.params.id
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
