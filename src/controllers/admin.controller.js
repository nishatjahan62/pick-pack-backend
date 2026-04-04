import User from '../models/user.model.js'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import ActivityLog from "../models/activitylog.model.js"

// 1. Get Admin Dashboard Summary Stats
export const getAdminStats = asyncHandler(async (req, res) => {
    
    const [userCount, productCount, orderCount, totalRevenue, logs] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]),
        ActivityLog.find().sort({ createdAt: -1 }).limit(8).populate('performedBy', 'name')
    ]);

    // ==================== ৭ দিনের Daily Revenue ====================
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
        {
            $match: {
                status: 'delivered',
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
    ]);

    // ৭ দিনের সব দিন তৈরি করি (0 revenue দিনগুলোও থাকবে)
    const revenueStats = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const found = dailyRevenue.find(d => d._id === dateStr);

        revenueStats.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }), // Sat, Sun, Mon...
            revenue: found ? Math.round(found.revenue) : 0
        });
    }

    // ==================== Response ====================
    res.json(new ApiResponse(200, {
        stats: {
            users: userCount,
            products: productCount,
            orders: orderCount,
            revenue: totalRevenue[0]?.total || 0
        },
        logs: logs || [],           
        revenue: revenueStats     // ← এখানে ৭ দিনের ডেটা যাচ্ছে
    }, "Dashboard data fetched"));
});

// 2. Fetch list of all users
export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(new ApiResponse(200, users, "All users fetched"));
});

// 3. Update User Role (e.g., promote to 'manager' or demote to 'user')
export const updateUserRole = asyncHandler(async (req, res) => {
    const { userId, newRole } = req.body; // newRole can be 'manager' or 'user'

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    res.json(new ApiResponse(200, updatedUser, `User is now a ${newRole}`));
});

// 4. Delete a specific user account
export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.json(new ApiResponse(200, null, "User deleted successfully"));
});