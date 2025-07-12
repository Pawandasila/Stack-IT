const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  passwordHash: String,
  fullName: String,
  avatarUrl: String,
  bio: String,
  location: String,
  website: String,
  reputation: { type: Number, default: 0 },
  rank: { type: String, default: 'Beginner' },
  role: { type: String, default: 'user' },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
