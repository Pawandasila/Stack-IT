const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: String,
  content: String,
  type: { type: String, default: 'question' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  votes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  answersCount: { type: Number, default: 0 },
  hasAcceptedAnswer: { type: Boolean, default: false },
  isClosed: { type: Boolean, default: false },
  closeReason: String,
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }]
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
