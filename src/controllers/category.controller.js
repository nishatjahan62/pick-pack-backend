import Category from '../models/category.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { LOG_ACTIONS } from '../utils/constants.js'
import ActivityLog from '../models/activitylog.model.js'

// Create Category
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body
  if (!name) throw new ApiError(400, 'Category name is required')

  const exists = await Category.findOne({ name })
  if (exists) throw new ApiError(400, 'Category already exists')

  const category = await Category.create({ name, description })

  await ActivityLog.create({
    action: LOG_ACTIONS.CATEGORY_ADDED,
    performedBy: req.user._id,
    metadata: { categoryName: name },
  })

  res.status(201).json(new ApiResponse(201, category, 'Category created'))
})

// Get All Categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 })
  res.json(new ApiResponse(200, categories, 'Categories fetched'))
})

// Get Single Category
export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found')
  res.json(new ApiResponse(200, category, 'Category fetched'))
})

// Update Category
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body
  const category = await Category.findById(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found')

  category.name = name || category.name
  category.description = description || category.description
  await category.save()

  res.json(new ApiResponse(200, category, 'Category updated'))
})

// Delete Category
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found')

  await category.deleteOne()
  res.json(new ApiResponse(200, null, 'Category deleted'))
})