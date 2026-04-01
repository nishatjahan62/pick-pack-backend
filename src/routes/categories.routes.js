import express from 'express'
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, authorize('admin', 'manager'), createCategory)
router.get('/', protect, getCategories)
router.get('/:id', protect, getCategory)
router.put('/:id', protect, authorize('admin', 'manager'), updateCategory)
router.delete('/:id', protect, authorize('admin'), deleteCategory)

export default router