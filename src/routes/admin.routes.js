import express from 'express'
import { 
    getAdminStats, 
    getAllUsers, 
    updateUserRole, 
    deleteUser 
} from '../controllers/admin.controller.js'
import { adminOnly, authorize, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect) 


router.get('/stats', authorize('admin', 'manager'), getAdminStats)


router.get('/users', adminOnly, getAllUsers)
router.patch('/update-role', adminOnly, updateUserRole)
router.delete('/user/:userId', adminOnly, deleteUser)

export default router