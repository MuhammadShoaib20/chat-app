const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      avatar: avatar || '',
    });
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || '',
      token,
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    user.lastSeen = Date.now();
    await user.save();
    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || '',
      token,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
};

module.exports = { registerUser, loginUser };