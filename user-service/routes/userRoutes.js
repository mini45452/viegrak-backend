const express = require('express');
const { register, login, logout, profile } = require('../controllers/userController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', profile);

module.exports = router;
