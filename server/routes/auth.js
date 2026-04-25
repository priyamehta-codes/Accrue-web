const express = require('express');
const router = express.Router();
const { googleAuth, getMe, updateProfile, updatePin, verifyPin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/pin', protect, updatePin);
router.post('/verify-pin', protect, verifyPin);

module.exports = router;
