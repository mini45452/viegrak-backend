const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'User registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log("Secret:");
    console.log(process.env.JWT_SECRET);
    const token = jwt.sign({ userId: user.id, roles: user.roles }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

const profile = async (req, res) => {
  const authHeader = req.headers.authorization;
  console.log("Entering get profile");
  console.log(authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  // Remove 'Bearer ' from the token string
  const token = authHeader.replace('Bearer ', '');

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Include roles in the profile data
    const profileData = {
      id: user.id,
      username: user.username,
      roles: user.roles, // Ensure 'roles' is a part of your user model
    };

    res.json({ profile: profileData });
  } catch (jwtError) {
    // Handle JWT verification errors specifically
    console.error('JWT verification error:', jwtError);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};


module.exports = { register, login, profile, logout };
