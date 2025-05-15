const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Validation middleware
const validateSignup = [
    body('name').isLength({ min: 20, max: 60 }).withMessage('Name must be between 20 and 60 characters'),
    body('email').isEmail().withMessage('Must provide a valid email address'),
    body('password')
        .isLength({ min: 8, max: 16 }).withMessage('Password must be between 8 and 16 characters')
        .matches(/^(?=.*[A-Z])(?=.*[!@#$&*])/).withMessage('Password must contain at least one uppercase letter and one special character'),
    body('address').optional().isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters')
];

const validateLogin = [
    body('email').isEmail().withMessage('Must provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
];

// POST /auth/signup - Register a new normal user
router.post('/signup', validateSignup, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, address } = req.body;

    try {
        // Check if email already exists
        const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user with 'normal_user' role
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, address, role) 
             VALUES ($1, $2, $3, $4, 'normal_user') 
             RETURNING id, name, email, role`,
            [name, email, hashedPassword, address]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// POST /auth/login - Login for all user types
router.post('/login', validateLogin, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Find user by email
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

/**
 * @route   POST /auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', (req, res) => {
    // Since we're using JWTs, the actual logout happens on the client side
    // by removing the token from storage. This endpoint just provides a
    // standardized way for clients to indicate logout.
    res.json({ message: 'Logout successful' });
    
    // Note: For a more secure implementation, you could implement a token blocklist
    // by storing invalidated tokens in a Redis cache with their expiration time
});

module.exports = router;