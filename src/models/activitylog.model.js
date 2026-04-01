import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  metadata: {
    type: Object,
    default: {},
  },
}, { timestamps: true })

export default mongoose.model('ActivityLog', activityLogSchema)