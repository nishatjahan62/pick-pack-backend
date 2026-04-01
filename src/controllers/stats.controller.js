import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import Category from '../models/category.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getPublicStats = asyncHandler(async (req, res) => {
  const [products, orders, categories] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    Category.countDocuments(),
  ])

  res.json(new ApiResponse(200, { products, orders, categories }, 'Stats fetched'))
})