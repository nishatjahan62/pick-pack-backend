import Order from '../models/order.model.js'
import Product from '../models/product.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ORDER_STATUS, PRODUCT_STATUS, LOG_ACTIONS } from '../utils/constants.js'
import ActivityLog from '../models/activitylog.model.js'

// Create Order
export const createOrder = asyncHandler(async (req, res) => {
  const { customerName, items } = req.body

  if (!customerName || !items || items.length === 0) {
    throw new ApiError(400, 'Customer name and items are required')
  }

  // duplicate product check
  const productIds = items.map((i) => i.product)
  const uniqueIds = new Set(productIds)
  if (uniqueIds.size !== productIds.length) {
    throw new ApiError(400, 'This product is already added to the order')
  }

  let totalPrice = 0
  const orderItems = []

  for (const item of items) {
    const product = await Product.findById(item.product)

    if (!product) {
      throw new ApiError(404, `Product not found`)
    }

    // inactive product check
    if (product.status === PRODUCT_STATUS.OUT_OF_STOCK) {
      throw new ApiError(400, `This product is currently unavailable: ${product.name}`)
    }

    // stock check
    if (item.quantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} items available in stock for ${product.name}`)
    }

    // stock deduct
    product.stock -= item.quantity

    // auto out of stock
    if (product.stock === 0) {
      product.status = PRODUCT_STATUS.OUT_OF_STOCK
    }

    await product.save()

    totalPrice += product.price * item.quantity
    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
    })
  }

  const order = await Order.create({
    customerName,
    items: orderItems,
    totalPrice,
    createdBy: req.user._id,
  })

  await ActivityLog.create({
    action: LOG_ACTIONS.ORDER_CREATED,
    performedBy: req.user._id,
    metadata: { orderId: order._id, customerName },
  })

  res.status(201).json(new ApiResponse(201, order, 'Order created'))
})

// Get All Orders
export const getOrders = asyncHandler(async (req, res) => {
  const { status, date } = req.query

  const filter = {}
  if (status) filter.status = status
  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    filter.createdAt = { $gte: start, $lte: end }
  }

  const orders = await Order.find(filter)
    .populate('items.product', 'name price')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })

  res.json(new ApiResponse(200, orders, 'Orders fetched'))
})

// Get Single Order
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.product', 'name price')
    .populate('createdBy', 'name')

  if (!order) throw new ApiError(404, 'Order not found')

  res.json(new ApiResponse(200, order, 'Order fetched'))
})

// Update Order Status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const order = await Order.findById(req.params.id)

  if (!order) throw new ApiError(404, 'Order not found')

  if (order.status === ORDER_STATUS.CANCELLED) {
    throw new ApiError(400, 'Cancelled order cannot be updated')
  }

  if (order.status === ORDER_STATUS.DELIVERED) {
    throw new ApiError(400, 'Delivered order cannot be updated')
  }

  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw new ApiError(400, 'Invalid order status')
  }

  order.status = status
  await order.save()

  await ActivityLog.create({
    action: `Order #${order._id} marked as ${status}`,
    performedBy: req.user._id,
    metadata: { orderId: order._id, status },
  })

  res.json(new ApiResponse(200, order, 'Order status updated'))
})

// Cancel Order
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product')

  if (!order) throw new ApiError(404, 'Order not found')

  if (order.status === ORDER_STATUS.CANCELLED) {
    throw new ApiError(400, 'Order is already cancelled')
  }

  if (order.status === ORDER_STATUS.DELIVERED) {
    throw new ApiError(400, 'Delivered order cannot be cancelled')
  }

  // stock restore
  for (const item of order.items) {
    const product = await Product.findById(item.product)
    if (product) {
      product.stock += item.quantity
      if (product.status === PRODUCT_STATUS.OUT_OF_STOCK && product.stock > 0) {
        product.status = PRODUCT_STATUS.ACTIVE
      }
      await product.save()
    }
  }

  order.status = ORDER_STATUS.CANCELLED
  await order.save()

  await ActivityLog.create({
    action: LOG_ACTIONS.ORDER_CANCELLED,
    performedBy: req.user._id,
    metadata: { orderId: order._id },
  })

  res.json(new ApiResponse(200, order, 'Order cancelled'))
})