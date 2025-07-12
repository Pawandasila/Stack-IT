const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  answer: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  voteType: { type: String, enum: ['up', 'down'] }
}, { timestamps: true });

module.exports = mongoose.model('Vote', voteSchema);
