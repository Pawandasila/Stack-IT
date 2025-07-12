const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  description: String,
  color: { type: String, default: '#3B82F6' },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Tag', tagSchema);
