import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import User from '../models/user.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getDashboardData = asyncHandler(async (req, res) => {
  const { role, _id } = req.user;

  // ১. অ্যাডমিন বা ম্যানেজার হলে (পুরো সিস্টেমের সামারি)
  if (role === 'admin' || role === 'manager') {
    const [products, orders, users, revenue] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ])
    ]);

    return res.json(new ApiResponse(200, {
      type: 'admin',
      stats: { products, orders, users, revenue: revenue[0]?.total || 0 }
    }, "Admin stats fetched"));
  }

  // ২. সাধারণ ইউজার হলে (শুধুমাত্র নিজের ডাটা)
  const [myOrders, mySpent] = await Promise.all([
    Order.countDocuments({ user: _id }),
    Order.aggregate([
      { $match: { user: _id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ])
  ]);

  res.json(new ApiResponse(200, {
    type: 'user',
    stats: { myOrders, mySpent: mySpent[0]?.total || 0, pending: 0 }
  }, "User stats fetched"));
});