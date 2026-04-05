import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import User from '../models/user.model.js'
import ActivityLog from "../models/activitylog.model.js"
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ORDER_STATUS } from '../utils/constants.js'

export const getDashboardData = asyncHandler(async (req, res) => {
  const { role, _id } = req.user

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (role === 'admin' || role === 'manager') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      products,
      totalOrders,
      users,
      totalRevenueData,
      dailyRevenue,
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

    const revenueStats = [];
    const chartDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(chartDate);
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
        orders: totalOrders,
        users,
        revenue: totalRevenueData[0]?.total || 0,
      },
      revenue: revenueStats,
      logs: recentActivity,
    }, 'Admin dashboard fetched'));
  }

  // Normal user logic
  const [
    myOrders,
    myPending,
    myDelivered,
    mySpent,
    myTodayOrders,
    myRecentLogs,
    orderStatusStats,
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
    ActivityLog.find({ performedBy: _id }).sort({ createdAt: -1 }).limit(10),
    Order.aggregate([
      { $match: { createdBy: _id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ])

  // Formatting chart data for user
  const chartData = orderStatusStats.map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  }));

  res.json(new ApiResponse(200, {
    type: 'user',
    stats: {
      myOrders,
      myPending,
      myDelivered,
      mySpent: mySpent[0]?.total || 0,
      myTodayOrders,
    },
    logs: myRecentLogs,
    chartData: chartData
  }, 'User dashboard fetched'))
})