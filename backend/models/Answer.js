const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: String,
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  votes: { type: Number, default: 0 },
  isAccepted: { type: Boolean, default: false },
  acceptedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Answer', answerSchema);
