import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient (a User — works for sitter, family, or admin)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Categorization (e.g. 'new_job', 'response', 'confirmed', 'cancelled', 'reopened')
  type: {
    type: String,
    trim: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    trim: true
  },

  // In-app deep link (frontend route)
  link: {
    type: String,
    trim: true
  },

  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Fast unread/recent lookups per user
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
