import express from 'express'
import { getDashboardData } from '../controllers/dashboard.controller.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()
router.get('/summary', protect, getDashboardData)
export default router