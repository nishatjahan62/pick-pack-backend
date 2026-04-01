import express from 'express'
import { getRestockQueue, restockProduct } from '../controllers/restock.controller.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, getRestockQueue)
router.put('/:id', protect, authorize('admin', 'manager'), restockProduct)

export default router