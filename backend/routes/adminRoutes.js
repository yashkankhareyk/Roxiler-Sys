const express = require('express');
const { body, query, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(authenticateToken);
router.use(authorizeRoles('system_administrator'));

// Validation middleware for creating users
const validateCreateUser = [
    body('name').isLength({ min: 20, max: 60 }).withMessage('Name must be between 20 and 60 characters'),
    body('email').isEmail().withMessage('Must provide a valid email address'),
    body('password')
        .isLength({ min: 8, max: 16 }).withMessage('Password must be between 8 and 16 characters')
        .matches(/^(?=.*[A-Z])(?=.*[!@#$&*])/).withMessage('Password must contain at least one uppercase letter and one special character'),
    body('address').optional().isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters'),
    body('role').isIn(['system_administrator', 'normal_user', 'store_owner']).withMessage('Invalid role')
];

// Add validation for store creation
const validateCreateStore = [
    body('name').isLength({ min: 20, max: 60 }).withMessage('Name must be between 20 and 60 characters'),
    body('email').optional().isEmail().withMessage('Must provide a valid email address'),
    body('address').isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters'),
    body('owner_id').optional().isInt().withMessage('Owner ID must be an integer')
];

/**
 * @route   POST /admin/users
 * @desc    Create a new user (admin, normal, or store owner)
 * @access  Private (System Administrator only)
 */
router.post('/users', validateCreateUser, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, address, role } = req.body;

    try {
        // Check if email already exists
        const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user with specified role
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, address, role) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, email, role, created_at`,
            [name, email, hashedPassword, address, role]
        );

        const user = result.rows[0];

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Server error during user creation' });
    }
});

/**
 * @route   GET /admin/users
 * @desc    Get list of users with optional filtering and sorting
 * @access  Private (System Administrator only)
 */
router.get('/users', async (req, res) => {
    try {
        // Extract query parameters for filtering and sorting
        const { name, email, address, role, sortBy, sortOrder } = req.query;
        
        // Build the query
        let queryText = 'SELECT id, name, email, address, role, created_at FROM users';
        const queryParams = [];
        const whereConditions = [];
        
        // Add filter conditions if provided
        if (name) {
            queryParams.push(`%${name}%`);
            whereConditions.push(`name ILIKE $${queryParams.length}`);
        }
        
        if (email) {
            queryParams.push(`%${email}%`);
            whereConditions.push(`email ILIKE $${queryParams.length}`);
        }
        
        if (address) {
            queryParams.push(`%${address}%`);
            whereConditions.push(`address ILIKE $${queryParams.length}`);
        }
        
        if (role && ['system_administrator', 'normal_user', 'store_owner'].includes(role)) {
            queryParams.push(role);
            whereConditions.push(`role = $${queryParams.length}`);
        }
        
        // Add WHERE clause if there are conditions
        if (whereConditions.length > 0) {
            queryText += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        // Add sorting
        const validSortColumns = ['name', 'email', 'role', 'created_at'];
        const validSortOrders = ['asc', 'desc'];
        
        if (sortBy && validSortColumns.includes(sortBy)) {
            queryText += ` ORDER BY ${sortBy}`;
            
            if (sortOrder && validSortOrders.includes(sortOrder.toLowerCase())) {
                queryText += ` ${sortOrder.toUpperCase()}`;
            } else {
                queryText += ' ASC'; // Default sort order
            }
        } else {
            queryText += ' ORDER BY created_at DESC'; // Default sort
        }
        
        // Execute the query
        const result = await db.query(queryText, queryParams);
        
        res.json({
            count: result.rows.length,
            users: result.rows
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
});

/**
 * @route   GET /admin/users/:userId
 * @desc    Get details of a specific user
 * @access  Private (System Administrator only)
 */
router.get('/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Validate userId is a number
        if (isNaN(parseInt(userId))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        // Get user details
        const userResult = await db.query(
            'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        // If user is a store owner, get their stores
        if (user.role === 'store_owner') {
            const storesResult = await db.query(
                'SELECT id, name, email, address, created_at FROM stores WHERE owner_id = $1',
                [userId]
            );
            
            user.stores = storesResult.rows;
            
            // For now, we'll just return the stores without calculating average ratings
            // This can be enhanced later with a more complex query for ratings
        }
        
        res.json({ user });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ message: 'Server error while fetching user details' });
    }
});

/**
 * @route   POST /admin/stores
 * @desc    Create a new store (with optional owner assignment)
 * @access  Private (System Administrator only)
 */
router.post('/stores', validateCreateStore, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, address, owner_id } = req.body;

    try {
        // If owner_id is provided, verify the user exists and is a store_owner
        if (owner_id) {
            const ownerCheck = await db.query(
                'SELECT id, role FROM users WHERE id = $1',
                [owner_id]
            );
            
            if (ownerCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Owner not found' });
            }
            
            if (ownerCheck.rows[0].role !== 'store_owner') {
                return res.status(400).json({ 
                    message: 'Assigned user must have store_owner role' 
                });
            }
        }
        
        // Insert new store
        const result = await db.query(
            `INSERT INTO stores (name, email, address, owner_id) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, email, address, owner_id, created_at`,
            [name, email, address, owner_id]
        );

        const store = result.rows[0];

        res.status(201).json({
            message: 'Store created successfully',
            store
        });
    } catch (err) {
        console.error('Error creating store:', err);
        res.status(500).json({ message: 'Server error during store creation' });
    }
});

/**
 * @route   GET /admin/stores
 * @desc    Get list of stores with optional filtering and sorting
 * @access  Private (System Administrator only)
 */
router.get('/stores', async (req, res) => {
    try {
        // Extract query parameters for filtering and sorting
        const { name, email, address, sortBy, sortOrder } = req.query;
        
        // Build the query
        let queryText = `
            SELECT s.id, s.name, s.email, s.address, s.owner_id, s.created_at,
                   u.name as owner_name, u.email as owner_email,
                   COALESCE(AVG(r.rating_value), 0) as average_rating,
                   COUNT(r.id) as rating_count
            FROM stores s
            LEFT JOIN users u ON s.owner_id = u.id
            LEFT JOIN ratings r ON s.id = r.store_id
        `;
        
        const queryParams = [];
        const whereConditions = [];
        
        // Add filter conditions if provided
        if (name) {
            queryParams.push(`%${name}%`);
            whereConditions.push(`s.name ILIKE $${queryParams.length}`);
        }
        
        if (email) {
            queryParams.push(`%${email}%`);
            whereConditions.push(`s.email ILIKE $${queryParams.length}`);
        }
        
        if (address) {
            queryParams.push(`%${address}%`);
            whereConditions.push(`s.address ILIKE $${queryParams.length}`);
        }
        
        // Add WHERE clause if there are conditions
        if (whereConditions.length > 0) {
            queryText += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        // Group by store and owner fields to calculate average rating
        queryText += ' GROUP BY s.id, s.name, s.email, s.address, s.owner_id, s.created_at, u.name, u.email';
        
        // Add sorting
        const validSortColumns = ['name', 'email', 'address', 'created_at', 'average_rating', 'rating_count'];
        const validSortOrders = ['asc', 'desc'];
        
        if (sortBy && validSortColumns.includes(sortBy)) {
            // Special case for average_rating since it's a calculated field
            const sortField = sortBy === 'average_rating' ? 'AVG(r.rating_value)' : 
                              sortBy === 'rating_count' ? 'COUNT(r.id)' : `s.${sortBy}`;
            
            queryText += ` ORDER BY ${sortField}`;
            
            if (sortOrder && validSortOrders.includes(sortOrder.toLowerCase())) {
                queryText += ` ${sortOrder.toUpperCase()}`;
            } else {
                queryText += ' ASC'; // Default sort order
            }
        } else {
            queryText += ' ORDER BY s.name ASC'; // Default sort
        }
        
        // Execute the query
        const result = await db.query(queryText, queryParams);
        
        // Format the results
        const stores = result.rows.map(store => ({
            ...store,
            average_rating: parseFloat(store.average_rating),
            rating_count: parseInt(store.rating_count)
        }));
        
        res.json({
            count: stores.length,
            stores
        });
    } catch (err) {
        console.error('Error fetching stores:', err);
        res.status(500).json({ message: 'Server error while fetching stores' });
    }
});

/**
 * @route   GET /admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (System Administrator only)
 */
router.get('/dashboard', async (req, res) => {
    try {
        // Get total users count
        const usersResult = await db.query('SELECT COUNT(*) as total_users FROM users');
        const totalUsers = parseInt(usersResult.rows[0].total_users);
        
        // Get users count by role
        const usersByRoleResult = await db.query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);
        
        const usersByRole = usersByRoleResult.rows.reduce((acc, row) => {
            acc[row.role] = parseInt(row.count);
            return acc;
        }, {});
        
        // Get total stores count
        const storesResult = await db.query('SELECT COUNT(*) as total_stores FROM stores');
        const totalStores = parseInt(storesResult.rows[0].total_stores);
        
        // Get total ratings count
        const ratingsResult = await db.query('SELECT COUNT(*) as total_ratings FROM ratings');
        const totalRatings = parseInt(ratingsResult.rows[0].total_ratings);
        
        // Get average rating across all stores
        const avgRatingResult = await db.query('SELECT AVG(rating_value) as average_rating FROM ratings');
        const averageRating = parseFloat(avgRatingResult.rows[0].average_rating) || 0;
        
        // Return dashboard data
        res.json({
            users: {
                total: totalUsers,
                by_role: usersByRole
            },
            stores: {
                total: totalStores
            },
            ratings: {
                total: totalRatings,
                average: averageRating
            }
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ message: 'Server error while fetching dashboard data' });
    }
});

module.exports = router;