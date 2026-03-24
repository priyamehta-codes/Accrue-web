const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

// GET /api/analytics
const getAnalytics = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  try {
    const [
      monthStats,
      yearStats,
      categoryStats,
      trendStats
    ] = await Promise.all([
      // Monthly total expense
      Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Yearly total expense
      Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: startOfYear, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Category breakdown (current month)
      Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: '$category', value: { $sum: '$amount' } } },
        { $project: { name: '$_id', value: 1, _id: 0 } },
        { $sort: { value: -1 } }
      ]),

      // Monthly trend (last 6 months)
      Transaction.aggregate([
        { 
          $match: { 
            userId, 
            type: 'expense', 
            date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } 
          } 
        },
        {
          $group: {
            _id: { month: { $month: '$date' }, year: { $year: '$date' } },
            expense: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Format trend stats to include month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedTrend = trendStats.map(s => ({
      name: monthNames[s._id.month - 1],
      expense: parseFloat(s.expense.toFixed(2))
    }));

    res.json({
      monthTotal: monthStats[0]?.total || 0,
      yearTotal: yearStats[0]?.total || 0,
      categoryData: categoryStats.map(c => ({ ...c, value: parseFloat(c.value.toFixed(2)) })),
      trendData: formattedTrend
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching analytics data.' });
  }
};

module.exports = { getAnalytics };
