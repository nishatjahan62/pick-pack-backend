import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { generateToken } from '../utils/token.js'
import { LOG_ACTIONS } from '../utils/constants.js'
import ActivityLog from '../models/activitylog.model.js'

// Signup
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    throw new ApiError(400, 'All fields are required')
  }

  const exists = await User.findOne({ email })
  if (exists) {
    throw new ApiError(400, 'Email already exists')
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashed })

  const token = generateToken({ id: user._id, role: user.role })

  await ActivityLog.create({
    action: LOG_ACTIONS.USER_SIGNUP,
    performedBy: user._id,
    metadata: { email: user.email },
  })

  res.status(201).json(
    new ApiResponse(201, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, 'Signup successful')
  )
})

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new ApiError(400, 'All fields are required')
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError(400, 'Invalid credentials')
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw new ApiError(400, 'Invalid credentials')
  }

  const token = generateToken({ id: user._id, role: user.role })

  await ActivityLog.create({
    action: LOG_ACTIONS.USER_LOGIN,
    performedBy: user._id,
    metadata: { email: user.email },
  })

  res.json(
    new ApiResponse(200, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, 'Login successful')
  )
})

// Get me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password')
  res.json(new ApiResponse(200, user, 'User fetched'))
})