const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    // Optional because private chats might not have a formal 'name'
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
