import { verifyToken } from '../utils/token.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import User from '../models/user.model.js'

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    throw new ApiError(401, 'Unauthorized — no token provided')
  }

  const decoded = verifyToken(token)
  const user = await User.findById(decoded.id).select('-password')

  if (!user) {
    throw new ApiError(401, 'Unauthorized — user not found')
  }

  req.user = user
  next()
})

export const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Forbidden — admin access only')
  }
  next()
})

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Forbidden — insufficient role')
    }
    next()
  }
}
