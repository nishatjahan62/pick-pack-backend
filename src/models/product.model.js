import mongoose from 'mongoose'
import { PRODUCT_STATUS } from '../utils/constants.js'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  minStockThreshold: {
    type: Number,
    required: true,
    default: 5,
  },
  status: {
    type: String,
    enum: Object.values(PRODUCT_STATUS),
    default: PRODUCT_STATUS.ACTIVE,
  },
}, { timestamps: true })

export default mongoose.model('Product', productSchema)