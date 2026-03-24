const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

/**
 * Apply a balance delta to an account owned by this user.
 * Throws an error (caught by global handler) if account not found.
 */
const applyBalanceDelta = async (accountId, userId, delta) => {
  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) throw Object.assign(new Error('Account not found.'), { statusCode: 404 });
  account.balance = parseFloat((account.balance + delta).toFixed(2));
  await account.save();
  return account;
};

/**
 * Calculate the balance delta caused by a transaction.
 * income  → +amount on accountId
 * expense → -amount on accountId
 * transfer → -amount on accountId, +amount on toAccountId
 */
const deltas = (type, amount) => ({
  income: amount,
  expense: -amount,
  transfer: -amount, // toAccount gets +amount separately
}[type]);

// GET /api/transactions
const getTransactions = async (req, res) => {
  const { accountId, type, startDate, endDate, limit = 50, page = 1 } = req.query;
  const filter = { userId: req.userId };

  if (accountId) filter.accountId = accountId;
  if (type) filter.type = type;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const total = await Transaction.countDocuments(filter);
  const transactions = await Transaction.find(filter)
    .sort({ date: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('accountId', 'name color icon')
    .populate('toAccountId', 'name color icon');

  res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
};

// POST /api/transactions
const createTransaction = async (req, res) => {
  const { accountId, toAccountId, type, amount, category, note, date, tags } = req.body;

  const transaction = await Transaction.create({
    userId: req.userId,
    accountId,
    toAccountId: toAccountId || null,
    type,
    amount,
    category,
    note,
    date: date || new Date(),
    tags: tags || [],
    reference: 'manual',
  });

  // Update account balances
  await applyBalanceDelta(accountId, req.userId, deltas(type, amount));
  if (type === 'transfer' && toAccountId) {
    await applyBalanceDelta(toAccountId, req.userId, amount); // credit destination
  }

  const populated = await transaction.populate('accountId', 'name color icon');
  res.status(201).json(populated);
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
  if (!tx) return res.status(404).json({ message: 'Transaction not found.' });

  const { accountId, toAccountId, type, amount, category, note, date, tags } = req.body;

  // Reverse the old balance effect
  await applyBalanceDelta(tx.accountId, req.userId, -deltas(tx.type, tx.amount));
  if (tx.type === 'transfer' && tx.toAccountId) {
    await applyBalanceDelta(tx.toAccountId, req.userId, -tx.amount);
  }

  // Apply updated fields
  tx.accountId = accountId || tx.accountId;
  tx.toAccountId = toAccountId || tx.toAccountId;
  tx.type = type || tx.type;
  tx.amount = amount || tx.amount;
  tx.category = category !== undefined ? category : tx.category;
  tx.note = note !== undefined ? note : tx.note;
  tx.date = date || tx.date;
  tx.tags = tags || tx.tags;
  await tx.save();

  // Apply new balance effect
  await applyBalanceDelta(tx.accountId, req.userId, deltas(tx.type, tx.amount));
  if (tx.type === 'transfer' && tx.toAccountId) {
    await applyBalanceDelta(tx.toAccountId, req.userId, tx.amount);
  }

  const populated = await tx.populate('accountId', 'name color icon');
  res.json(populated);
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
  if (!tx) return res.status(404).json({ message: 'Transaction not found.' });

  // Reverse balance before deleting
  await applyBalanceDelta(tx.accountId, req.userId, -deltas(tx.type, tx.amount));
  if (tx.type === 'transfer' && tx.toAccountId) {
    await applyBalanceDelta(tx.toAccountId, req.userId, -tx.amount);
  }

  await tx.deleteOne();
  res.json({ message: 'Transaction deleted and balance reversed.' });
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, applyBalanceDelta };
