import Product from '../models/product.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { PRODUCT_STATUS, LOG_ACTIONS } from '../utils/constants.js'
import ActivityLog from '../models/activitylog.model.js'

// Create Product
export const createProduct = asyncHandler(async (req, res) => {
  const { name, category, price, stock, minStockThreshold } = req.body

  if (!name || !category || !price) {
    throw new ApiError(400, 'Name, category and price are required')
  }

  const product = await Product.create({
    name,
    category,
    price,
    stock: stock || 0,
    minStockThreshold: minStockThreshold || 5,
    status: stock === 0 ? PRODUCT_STATUS.OUT_OF_STOCK : PRODUCT_STATUS.ACTIVE,
  })

  await ActivityLog.create({
    action: LOG_ACTIONS.PRODUCT_ADDED,
    performedBy: req.user._id,
    metadata: { productName: name },
  })

  res.status(201).json(new ApiResponse(201, product, 'Product created'))
})

// Get All Products
export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('category', 'name')
  res.json(new ApiResponse(200, products, 'Products fetched'))
})

// Get Single Product
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name')
  if (!product) throw new ApiError(404, 'Product not found')
  res.json(new ApiResponse(200, product, 'Product fetched'))
})

// Update Product
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found')

  const { name, category, price, stock, minStockThreshold } = req.body

  if (name !== undefined) product.name = name
  if (category !== undefined) product.category = category
  if (price !== undefined) product.price = price
  if (stock !== undefined) product.stock = stock
  if (minStockThreshold !== undefined) product.minStockThreshold = minStockThreshold

  // auto status update
  product.status = product.stock === 0 ? PRODUCT_STATUS.OUT_OF_STOCK : PRODUCT_STATUS.ACTIVE

  await ActivityLog.create({
    action: LOG_ACTIONS.PRODUCT_UPDATED,
    performedBy: req.user._id,
    metadata: { productName: product.name },
  })

  await product.save()
  res.json(new ApiResponse(200, product, 'Product updated'))
})

// Delete Product
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found')

  await ActivityLog.create({
    action: LOG_ACTIONS.PRODUCT_DELETED,
    performedBy: req.user._id,
    metadata: { productName: product.name },
  })

  await product.deleteOne()
  res.json(new ApiResponse(200, null, 'Product deleted'))
})