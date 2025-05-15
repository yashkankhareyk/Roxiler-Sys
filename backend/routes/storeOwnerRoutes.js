const express = require('express');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(authenticateToken);
router.use(authorizeRoles('store_owner'));

/**
 * @route   GET /store-owner/dashboard
 * @desc    Get dashboard data for store owner including their stores and ratings
 * @access  Private (Store Owner only)
 */
router.get('/dashboard', async (req, res, next) => { // Added next for consistency
    try {
        const ownerId = req.user.userId;
        
        // Get stores owned by this user
        const storesResult = await db.query(
            `SELECT id, name, email, address, created_at 
             FROM stores 
             WHERE owner_id = $1`,
            [ownerId]
        );
        
        const stores = storesResult.rows;
        
        if (stores.length === 0) {
            return res.status(404).json({ 
                message: 'No stores found for this owner',
                owner: {
                    id: ownerId,
                    name: req.user.name,
                    email: req.user.email
                }
            });
        }
        
        // For each store, get ratings and users who submitted them
        const storesWithDetails = await Promise.all(stores.map(async (store) => {
            // Get all ratings for this store
            const ratingsResult = await db.query(
                `SELECT r.id, r.rating_value, r.created_at, r.updated_at,
                        u.id as user_id, u.name as user_name, u.email as user_email
                 FROM ratings r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.store_id = $1
                 ORDER BY r.updated_at DESC`,
                [store.id]
            );
            
            // Calculate average rating
            const avgRatingResult = await db.query(
                `SELECT AVG(rating_value) as average_rating, COUNT(*) as rating_count
                 FROM ratings
                 WHERE store_id = $1`,
                [store.id]
            );
            
            const averageRating = parseFloat(avgRatingResult.rows[0].average_rating) || 0;
            const ratingCount = parseInt(avgRatingResult.rows[0].rating_count) || 0;
            
            // Format the ratings with user info
            const ratings = ratingsResult.rows.map(rating => ({
                id: rating.id,
                rating_value: rating.rating_value,
                created_at: rating.created_at,
                updated_at: rating.updated_at,
                user: {
                    id: rating.user_id,
                    name: rating.user_name,
                    email: rating.user_email
                }
            }));
            
            // Return store with ratings data
            return {
                ...store,
                ratings_summary: {
                    average_rating: averageRating,
                    rating_count: ratingCount
                },
                ratings: ratings
            };
        }));
        
        res.json({
            owner: {
                id: ownerId,
                name: req.user.name,
                email: req.user.email
            },
            stores_count: stores.length,
            stores: storesWithDetails
        });
    } catch (err) {
        console.error('Error fetching store owner dashboard:', err);
        // res.status(500).json({ message: 'Server error while fetching dashboard data' });
        next(err); // Pass to global error handler
    }
});

// Add validation for store creation
const validateCreateStore = [
    body('name').isLength({ min: 20, max: 60 }).withMessage('Name must be between 20 and 60 characters'),
    body('email').optional().isEmail().withMessage('Must provide a valid email address'),
    body('address')
        .notEmpty().withMessage('Address is required') // Ensure address is not empty
        .isLength({ max: 400 }).withMessage('Address cannot exceed 400 characters')
];

/**
 * @route   POST /store-owner/stores
 * @desc    Create a new store (owned by the logged-in store owner)
 * @access  Private (Store Owner only)
 */
router.post('/stores', validateCreateStore, async (req, res, next) => { // Added next parameter
    // Check for validation errors first
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, address } = req.body;
    const ownerId = req.user.userId;

    try {
        // Insert new store with the current user as owner
        const result = await db.query(
            `INSERT INTO stores (name, email, address, owner_id) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, name, email, address, created_at`,
            [name, email, address, ownerId]
        );

        const store = result.rows[0];

        res.status(201).json({
            message: 'Store created successfully',
            store
        });
    } catch (err) {
        // console.error('Error creating store:', err); // Logging is handled by global error handler
        // res.status(500).json({ message: 'Server error during store creation' });
        next(err); // Pass error to global error handler
    }
});

module.exports = router;