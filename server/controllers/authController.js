const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * Body: { id_token: string }
 * Verifies Google id_token, upserts user in DB, returns JWT.
 */
const googleAuth = async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ message: 'Google id_token is required.' });
  }

  // Verify the token with Google
  const ticket = await googleClient.verifyIdToken({
    idToken: id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  // Upsert: create user if not exists, update profile info on each login
  const user = await User.findOneAndUpdate(
    { googleId },
    { googleId, email, name, picture },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Sign JWT with user's MongoDB _id as the identifier
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(200).json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      isPinEnabled: user.isPinEnabled,
      hasPin: !!user.pin,
    },
  });
};

/**
 * GET /api/auth/me
 * Returns current user profile from JWT.
 */
const getMe = async (req, res) => {
  const user = await User.findById(req.userId).select('-__v');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    isPinEnabled: user.isPinEnabled,
    hasPin: !!user.pin,
  });
};

/**
 * PUT /api/auth/profile
 * Body: { name: string }
 * Updates current user's display name.
 */
const updateProfile = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { name: name.trim() },
    { new: true }
  ).select('-__v');

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    isPinEnabled: user.isPinEnabled,
    hasPin: !!user.pin,
  });
};

/**
 * PUT /api/auth/pin
 * Body: { pin: string, isPinEnabled: boolean }
 * Sets/Updates user PIN and toggles PIN requirement.
 */
const updatePin = async (req, res) => {
  const { pin, isPinEnabled } = req.body;
  const updates = {};

  if (typeof isPinEnabled === 'boolean') {
    updates.isPinEnabled = isPinEnabled;
  }

  if (pin) {
    if (pin.length !== 4) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits.' });
    }
    const salt = await bcrypt.genSalt(10);
    updates.pin = await bcrypt.hash(pin, salt);
    // If setting a new PIN, we usually want to enable it
    if (typeof isPinEnabled === 'undefined') {
      updates.isPinEnabled = true;
    }
  }

  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({
    message: 'PIN updated successfully.',
    isPinEnabled: user.isPinEnabled,
    hasPin: !!user.pin,
  });
};

/**
 * POST /api/auth/verify-pin
 * Body: { pin: string }
 */
const verifyPin = async (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ message: 'PIN is required.' });
  }

  const user = await User.findById(req.userId);
  if (!user || !user.pin) {
    return res.status(400).json({ message: 'No PIN set for this user.' });
  }

  const isMatch = await bcrypt.compare(pin, user.pin);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid PIN.' });
  }

  res.json({ success: true });
};

module.exports = { googleAuth, getMe, updateProfile, updatePin, verifyPin };
