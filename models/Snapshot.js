const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  onlineCount: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // This is the MongoDB TTL (Time To Live) index.
    // It tells MongoDB to automatically delete this document
    // 86400 seconds (24 hours) after the createdAt timestamp.
    // This makes sure our graph only shows the last 24h of data.
    expires: 86400 
  }
});

module.exports = mongoose.model('Snapshot', snapshotSchema);
