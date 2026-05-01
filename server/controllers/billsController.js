const Bill = require('../models/Bill');
const Transaction = require('../models/Transaction');
const { applyBalanceDelta } = require('./transactionsController');

// Helper to ensure all recurring bills have their next instance created
const ensureRecurringBills = async (userId) => {
  try {
    // Find all recurring bills, sorted by due date descending to get the latest ones first
    const recurringBills = await Bill.find({ userId, isRecurring: true }).sort({ dueDate: -1 });
    if (!recurringBills.length) return;

    const seriesMap = new Map();
    for (const bill of recurringBills) {
      if (!seriesMap.has(bill.name)) {
        seriesMap.set(bill.name, bill);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const [name, latestBill] of seriesMap) {
      let currentLatest = latestBill;
      let iterations = 0;
      const MAX_ITERATIONS = 12; // Safety limit (e.g., 1 year of monthly bills)

      while (iterations < MAX_ITERATIONS && (currentLatest.isPaid || new Date(currentLatest.dueDate) < today)) {
        iterations++;
        const nextDueDate = new Date(currentLatest.dueDate);
        const period = currentLatest.recurringPeriod || 'monthly';

        if (period === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
        else if (period === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        else if (period === 'quarterly') nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        else if (period === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        else nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        // Avoid infinite loop
        if (nextDueDate.getTime() <= new Date(currentLatest.dueDate).getTime()) break;

        // Check if this instance already exists
        const exists = await Bill.findOne({ userId, name, dueDate: nextDueDate });
        if (!exists) {
          currentLatest = await Bill.create({
            userId,
            name,
            amount: currentLatest.amount,
            category: currentLatest.category,
            dueDate: nextDueDate,
            accountId: currentLatest.accountId,
            isRecurring: true,
            recurringPeriod: period,
            notes: currentLatest.notes,
            isPaid: false,
          });
        } else {
          currentLatest = exists;
        }

        // If the newly created/found bill is in the future and unpaid, we're caught up for this series
        if (!currentLatest.isPaid && new Date(currentLatest.dueDate) >= today) break;
      }
    }
  } catch (err) {
    console.error('Error ensuring recurring bills:', err);
  }
};

// GET /api/bills
const getBills = async (req, res) => {
  await ensureRecurringBills(req.userId);

  const { isPaid } = req.query;
  const filter = { userId: req.userId };
  if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

  const bills = await Bill.find(filter)
    .sort({ dueDate: 1 })
    .populate('accountId', 'name color')
    .populate('transactionId', 'amount date');

  res.json(bills);
};

// POST /api/bills
const createBill = async (req, res) => {
  const { name, amount, category, dueDate, accountId, isRecurring, recurringPeriod, notes } = req.body;

  const bill = await Bill.create({
    userId: req.userId,
    name,
    amount,
    category: category || 'Bills',
    dueDate,
    accountId: accountId || null,
    isRecurring: isRecurring || false,
    recurringPeriod: recurringPeriod || null,
    notes: notes || '',
  });

  // If created as recurring and already in the past/paid, ensure next one exists
  if (isRecurring) {
    await ensureRecurringBills(req.userId);
  }

  res.status(201).json(bill);
};

// PUT /api/bills/:id/pay  — mark a bill as paid, create expense transaction
const payBill = async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, userId: req.userId });
  if (!bill) return res.status(404).json({ message: 'Bill not found.' });
  if (bill.isPaid) return res.status(400).json({ message: 'Bill is already paid.' });

  // accountId can come from the bill itself or from request body override
  const accountId = req.body.accountId || bill.accountId;
  if (!accountId) return res.status(400).json({ message: 'An account must be specified to pay the bill.' });

  // Create the expense transaction
  const transaction = await Transaction.create({
    userId: req.userId,
    accountId,
    type: 'expense',
    amount: bill.amount,
    category: bill.category || 'Bills',
    note: `Bill payment: ${bill.name}`,
    date: new Date(),
    reference: 'bill_payment',
    referenceId: bill._id,
  });

  // Deduct from account
  await applyBalanceDelta(accountId, req.userId, -bill.amount);

  // Mark bill paid
  bill.isPaid = true;
  bill.paidAt = new Date();
  bill.transactionId = transaction._id;
  if (accountId) bill.accountId = accountId;
  await bill.save();

  // If recurring, generate next bill
  if (bill.isRecurring) {
    await ensureRecurringBills(req.userId);
  }

  res.json({ bill, transaction });
};

// PUT /api/bills/:id
const updateBill = async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, userId: req.userId });
  if (!bill) return res.status(404).json({ message: 'Bill not found.' });
  
  const { name, amount, category, dueDate, accountId, isRecurring, recurringPeriod, notes } = req.body;
  
  // If bill is paid, only allow updating isRecurring, recurringPeriod, and notes
  if (bill.isPaid) {
    if (name !== undefined || amount !== undefined || category !== undefined || dueDate !== undefined || accountId !== undefined) {
      // Allow name/category/notes updates but maybe not amount/date?
      // For now, let's stick to the plan: only allow recurring status and notes if paid.
      if (name !== undefined || amount !== undefined || dueDate !== undefined || accountId !== undefined) {
        return res.status(400).json({ message: 'Cannot edit amount, date or account of a paid bill.' });
      }
    }
  }

  if (name !== undefined) bill.name = name;
  if (amount !== undefined) bill.amount = amount;
  if (category !== undefined) bill.category = category;
  if (dueDate !== undefined) bill.dueDate = dueDate;
  if (accountId !== undefined) bill.accountId = accountId;
  if (isRecurring !== undefined) bill.isRecurring = isRecurring;
  if (recurringPeriod !== undefined) bill.recurringPeriod = recurringPeriod;
  if (notes !== undefined) bill.notes = notes;

  await bill.save();

  // If toggled to recurring, ensure next instances are created
  if (isRecurring) {
    await ensureRecurringBills(req.userId);
  }

  res.json(bill);
};

// DELETE /api/bills/:id
const deleteBill = async (req, res) => {
  const bill = await Bill.findOne({ _id: req.params.id, userId: req.userId });
  if (!bill) return res.status(404).json({ message: 'Bill not found.' });

  await bill.deleteOne();
  res.json({ message: 'Bill deleted.' });
};

module.exports = { getBills, createBill, payBill, updateBill, deleteBill };
