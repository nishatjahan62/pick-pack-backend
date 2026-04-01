import express from 'express'
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

// Only admin or manager can create/update/delete
router.post('/', protect, authorize('admin', 'manager'), createProduct)
router.get('/', getProducts)
router.get('/:id', getProduct)
router.patch('/:id', protect, authorize('admin', 'manager'), updateProduct)
router.delete('/:id', protect, authorize('admin'), deleteProduct)

export default router
