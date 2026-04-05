const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  hasLoggedIn: {
    type: Boolean,
    default: false
  },
  pushSubscription: {
    type: Object, // Web Push subscription object from the browser
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
