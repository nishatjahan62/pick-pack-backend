import express from 'express'
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/order.controller.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, createOrder)
router.get('/', protect, getOrders)
router.get('/:id', protect, getOrder)
router.put('/:id/status', protect, authorize('admin', 'manager'), updateOrderStatus)
router.put('/:id/cancel', protect, cancelOrder)

export default router