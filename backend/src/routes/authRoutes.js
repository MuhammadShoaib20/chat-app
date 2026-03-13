const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working' });
});

router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;