import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import User from '../models/user.model.js'
import ActivityLog from '../models/activitylog.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ORDER_STATUS } from '../utils/constants.js'

export const getDashboardData = asyncHandler(async (req, res) => {
  const { role, _id } = req.user

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

 // dashboard.controller.js এর admin সেকশনটি এভাবে আপডেট করুন
if (role === 'admin' || role === 'manager') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
        products,
        totalOrders,
        users,
        totalRevenueData, // সব সময়ের রেভিনিউ
        dailyRevenue,    // চার্টের জন্য ৭ দিনের ডাটা
        recentActivity,
    ] = await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        Order.aggregate([
            { $match: { status: ORDER_STATUS.DELIVERED } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]),
        Order.aggregate([
            {
                $match: {
                    status: ORDER_STATUS.DELIVERED,
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalPrice" }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        ActivityLog.find().populate('performedBy', 'name').sort({ createdAt: -1 }).limit(10),
    ]);

    // ৭ দিনের চার্ট ডাটা ফরম্যাট করা
    const revenueStats = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const found = dailyRevenue.find(d => d._id === dateStr);
        revenueStats.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            revenue: found ? Math.round(found.revenue) : 0
        });
    }

    return res.json(new ApiResponse(200, {
        type: 'admin',
        stats: {
            products,
            orders: totalOrders, // Frontend 'orders' চাচ্ছে, 'totalOrders' নয়
            users,
            revenue: totalRevenueData[0]?.total || 0,
        },
        revenue: revenueStats, // চার্টের জন্য
        logs: recentActivity,  // Frontend 'logs' চাচ্ছে
    }, 'Admin dashboard fetched'));
}

  // Normal user
  const [
    myOrders,
    myPending,
    myDelivered,
    mySpent,
    myTodayOrders,
  ] = await Promise.all([
    Order.countDocuments({ createdBy: _id }),
    Order.countDocuments({ createdBy: _id, status: ORDER_STATUS.PENDING }),
    Order.countDocuments({ createdBy: _id, status: ORDER_STATUS.DELIVERED }),
    Order.aggregate([
      { $match: { createdBy: _id, status: ORDER_STATUS.DELIVERED } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.countDocuments({
      createdBy: _id,
      createdAt: { $gte: today, $lt: tomorrow }
    }),
  ])

  res.json(new ApiResponse(200, {
    type: 'user',
    stats: {
      myOrders,
      myPending,
      myDelivered,
      mySpent: mySpent[0]?.total || 0,
      myTodayOrders,
    },
  }, 'User dashboard fetched'))
})