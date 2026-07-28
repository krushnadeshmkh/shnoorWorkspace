const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.post('/register',[body('fullName').trim().notEmpty().withMessage('Full name is required'),body('email').isEmail().withMessage('Enter a valid email address'),body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')], validate, register);
router.post('/login',[body('email').isEmail().withMessage('Enter a valid email address'),body('password').notEmpty().withMessage('Password is required')], validate, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;