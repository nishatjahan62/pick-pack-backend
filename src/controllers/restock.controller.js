import Product from '../models/product.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { PRODUCT_STATUS, RESTOCK_PRIORITY, LOG_ACTIONS } from '../utils/constants.js'
import ActivityLog from '../models/activitylog.model.js'

// priority calculate helper
const getPriority = (stock, threshold) => {
  if (stock === 0) return RESTOCK_PRIORITY.HIGH
  const ratio = stock / threshold
  if (ratio <= 0.25) return RESTOCK_PRIORITY.HIGH
  if (ratio <= 0.5) return RESTOCK_PRIORITY.MEDIUM
  return RESTOCK_PRIORITY.LOW
}

// Get Restock Queue
export const getRestockQueue = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('category', 'name')

  const queue = products
    .filter((p) => p.stock < p.minStockThreshold)
    .map((p) => ({
      _id: p._id,
      name: p.name,
      category: p.category,
      stock: p.stock,
      minStockThreshold: p.minStockThreshold,
      status: p.status,
      priority: getPriority(p.stock, p.minStockThreshold),
    }))
    .sort((a, b) => a.stock - b.stock)

  res.json(new ApiResponse(200, queue, 'Restock queue fetched'))
})

// Restock Product (manual stock update)
export const restockProduct = asyncHandler(async (req, res) => {
  const { quantity } = req.body

  if (!quantity || quantity <= 0) {
    throw new ApiError(400, 'Valid quantity is required')
  }

  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found')

  product.stock += quantity

  // auto status update
  if (product.status === PRODUCT_STATUS.OUT_OF_STOCK && product.stock > 0) {
    product.status = PRODUCT_STATUS.ACTIVE
  }

  await product.save()

  await ActivityLog.create({
    action: LOG_ACTIONS.STOCK_UPDATED,
    performedBy: req.user._id,
    metadata: { productName: product.name, addedQuantity: quantity, newStock: product.stock },
  })

  res.json(new ApiResponse(200, product, 'Product restocked successfully'))
})