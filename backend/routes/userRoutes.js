const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   PUT /users/me
 * @desc    Update logged-in user's profile information
 * @access  Private (Any authenticated user)
 */
router.put('/me', [
    body('name').optional().isLength({ min: 20, max: 60 }).withMessage('Name must be between 20 and 60 characters'),
    body('address').optional().isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters')
], async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, address } = req.body;
        const userId = req.user.userId;

        // Check if user exists
        const userCheck = await db.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }
        
        if (address !== undefined) {
            updates.push(`address = $${paramCount}`);
            values.push(address);
            paramCount++;
        }
        
        // If no fields to update, return early
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        // Add user ID as the last parameter
        values.push(userId);
        
        // Update the user
        const updateQuery = `
            UPDATE users 
            SET ${updates.join(', ')} 
            WHERE id = $${paramCount}
            RETURNING id, name, email, address, role, created_at
        `;
        
        const result = await db.query(updateQuery, values);
        const updatedUser = result.rows[0];
        
        res.json({ 
            message: 'User profile updated successfully',
            user: updatedUser
        });
    } catch (err) {
        next(err); // Pass error to global error handler
    }
});

/**
 * @route   PUT /users/me/password
 * @desc    Update logged-in user's password
 * @access  Private (Any authenticated user)
 */
router.put('/me/password', [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8, max: 16 }).withMessage('New password must be between 8 and 16 characters')
        .matches(/^(?=.*[A-Z])(?=.*[!@#$&*])/).withMessage('Password must contain at least one uppercase letter and one special character')
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    try {
        // Get current user's password hash
        const userResult = await db.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const currentPasswordHash = userResult.rows[0].password_hash;
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, currentPasswordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        
        // Update the password
        await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, userId]
        );
        
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ message: 'Server error during password update' });
    }
});

/**
 * @route   GET /users/me
 * @desc    Get current user's profile information
 * @access  Private (Any authenticated user)
 */
router.get('/me', async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user details
        const userResult = await db.query(
            'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        // Get user's ratings
        const ratingsResult = await db.query(
            `SELECT r.id, r.store_id, r.rating_value, r.created_at, r.updated_at, s.name as store_name
             FROM ratings r
             JOIN stores s ON r.store_id = s.id
             WHERE r.user_id = $1
             ORDER BY r.updated_at DESC`,
            [userId]
        );
        
        user.ratings = ratingsResult.rows;
        
        res.json({ user });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Server error while fetching user profile' });
    }
});

module.exports = router;