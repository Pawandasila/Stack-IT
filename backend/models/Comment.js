const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  answer: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer' },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  votes: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
