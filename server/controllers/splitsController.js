const Split = require('../models/Split');
const Transaction = require('../models/Transaction');
const { applyBalanceDelta } = require('./transactionsController');

// GET /api/splits
const getSplits = async (req, res) => {
  const { isSettled } = req.query;
  const filter = { userId: req.userId };
  if (isSettled !== undefined) filter.isSettled = isSettled === 'true';

  const splits = await Split.find(filter)
    .sort({ createdAt: -1 })
    .populate('accountId', 'name color');

  res.json(splits);
};

// POST /api/splits
const createSplit = async (req, res) => {
  const { description, totalAmount, currency, accountId, participants, notes, type, applyAsTransaction } = req.body;

  let initialTransactionId = null;
  if (applyAsTransaction && accountId) {
    const txType = type === 'borrow' ? 'income' : 'expense';
    const transaction = await Transaction.create({
      userId: req.userId,
      accountId,
      type: txType,
      amount: totalAmount,
      category: type === 'split' ? 'Split' : type === 'lend' ? 'Lending' : 'Borrowing',
      note: `${description} (${type})`,
      date: new Date().setHours(0,0,0,0),
      reference: 'split_payment',
      referenceId: null, // Will update after split creation
    });

    const delta = txType === 'income' ? totalAmount : -totalAmount;
    await applyBalanceDelta(accountId, req.userId, delta);
    initialTransactionId = transaction._id;
  }

  const split = await Split.create({
    userId: req.userId,
    description,
    totalAmount,
    currency: currency || 'INR',
    accountId: accountId || null,
    participants: participants || [],
    notes: notes || '',
    type: type || 'split',
    initialTransactionId,
  });

  // Link the initial transaction to the split
  if (initialTransactionId) {
    await Transaction.updateOne({ _id: initialTransactionId }, { referenceId: split._id });
  }

  res.status(201).json(split);
};

// PUT /api/splits/:id/settle/:participantId
// Mark a participant's share as settled, create an income transaction
const settleParticipant = async (req, res) => {
  const split = await Split.findOne({ _id: req.params.id, userId: req.userId });
  if (!split) return res.status(404).json({ message: 'Split not found.' });

  const participant = split.participants.id(req.params.participantId);
  if (!participant) return res.status(404).json({ message: 'Participant not found.' });
  if (participant.isPaid) return res.status(400).json({ message: 'Participant already settled.' });

  const txType = split.type === 'borrow' ? 'expense' : 'income';
  const { accountId } = req.body;

  let transaction = null;
  if (accountId) {
    // Create transaction — depending on split type
    transaction = await Transaction.create({
      userId: req.userId,
      accountId,
      type: txType,
      amount: participant.amount,
      category: split.type === 'borrow' ? 'Debt Repayment' : 'Split Settlement',
      note: `${participant.name} ${split.type === 'borrow' ? 'repaid' : 'settled'} — ${split.description}`,
      date: new Date().setHours(0,0,0,0),
      reference: 'split_settlement',
      referenceId: split._id,
    });

    const delta = txType === 'income' ? participant.amount : -participant.amount;
    await applyBalanceDelta(accountId, req.userId, delta);
  }

  // Mark participant paid
  participant.isPaid = true;
  participant.paidAt = new Date();
  if (transaction) participant.transactionId = transaction._id;

  // Check if all participants are settled
  split.isSettled = split.participants.every((p) => p.isPaid);
  await split.save();

  res.json({ split, transaction });
};

// PUT /api/splits/:id
const updateSplit = async (req, res) => {
  const split = await Split.findOne({ _id: req.params.id, userId: req.userId });
  if (!split) return res.status(404).json({ message: 'Split not found.' });

  const { description, notes, accountId } = req.body;
  if (description !== undefined) split.description = description;
  if (notes !== undefined) split.notes = notes;
  if (accountId !== undefined) split.accountId = accountId;

  await split.save();
  res.json(split);
};

// DELETE /api/splits/:id
const deleteSplit = async (req, res) => {
  const split = await Split.findOne({ _id: req.params.id, userId: req.userId });
  if (!split) return res.status(404).json({ message: 'Split not found.' });

  // 1. Double check: Initial Transaction (the full expense/income)
  if (split.initialTransactionId) {
    const tx = await Transaction.findOne({ _id: split.initialTransactionId, userId: req.userId });
    if (tx) {
      const delta = tx.type === 'income' ? -tx.amount : tx.amount;
      try {
        await applyBalanceDelta(tx.accountId, req.userId, delta);
        await tx.deleteOne();
      } catch (err) {
        console.error('Failed to reverse initial split transaction:', err);
      }
    }
  }

  // 2. NEW: Find and delete all SETTLEMENTS (participant payments)
  const settlements = await Transaction.find({ referenceId: split._id, userId: req.userId });
  for (const st of settlements) {
    const delta = st.type === 'income' ? -st.amount : st.amount;
    try {
      await applyBalanceDelta(st.accountId, req.userId, delta);
      await st.deleteOne();
    } catch (err) {
      console.error('Failed to reverse settlement transaction:', err);
    }
  }

  await split.deleteOne();
  res.json({ message: 'Split and all associated transactions deleted.' });
};

module.exports = { getSplits, createSplit, settleParticipant, updateSplit, deleteSplit };
