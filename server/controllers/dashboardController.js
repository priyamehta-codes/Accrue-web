const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Bill = require('../models/Bill');
const Split = require('../models/Split');

// GET /api/dashboard
const getDashboard = async (req, res) => {
  const userId = req.userId;
  // Mongoose aggregate pipelines do not auto-cast strings to ObjectIds!
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel for performance
  const [
    accounts,
    monthlyIncome,
    monthlyExpense,
    recentTransactions,
    upcomingBills,
    unsettledSplitsCount,
  ] = await Promise.all([
    // All active accounts with balances
    Account.find({ userId, isArchived: false }),

    // Sum of income this month
    Transaction.aggregate([
      { $match: { userId: userObjectId, type: 'income', date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // Sum of expenses this month
    Transaction.aggregate([
      { $match: { userId: userObjectId, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // Last 10 transactions
    Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(10)
      .populate('accountId', 'name color icon'),

    // Bills due in next 7 days (not paid)
    Bill.find({
      userId,
      isPaid: false,
      dueDate: { $gte: startOfToday, $lte: next7Days },
    }).sort({ dueDate: 1 }),

    // Count of unsettled splits
    Split.countDocuments({ userId, isSettled: false }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const income = monthlyIncome[0]?.total || 0;
  const expense = monthlyExpense[0]?.total || 0;
  const savingsRate = income > 0 ? parseFloat(((income - expense) / income * 100).toFixed(1)) : 0;

  res.json({
    totalBalance: parseFloat(totalBalance.toFixed(2)),
    monthlyIncome: parseFloat(income.toFixed(2)),
    monthlyExpense: parseFloat(expense.toFixed(2)),
    savingsRate,
    accounts,
    recentTransactions,
    upcomingBills,
    unsettledSplitsCount,
    month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
  });
};

module.exports = { getDashboard };
