const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /stores
 * @desc    Get list of all stores with optional filtering, sorting, and user's rating
 * @access  Private (Any authenticated user)
 */
router.get('/', async (req, res, next) => {
    try {
        // Extract query parameters for filtering and sorting
        const { name, address, sortBy, sortOrder } = req.query;
        const userId = req.user.userId;
        
        // Build the query with JOINs to get average ratings and user's rating
        let queryText = `
            SELECT s.id, s.name, s.email, s.address, s.created_at,
                   COALESCE(AVG(r.rating_value), 0) as average_rating,
                   COUNT(r.id) as rating_count,
                   (
                       SELECT rating_value 
                       FROM ratings 
                       WHERE store_id = s.id AND user_id = $1
                   ) as user_rating
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
        `;
        
        const queryParams = [userId];
        const whereConditions = [];
        
        // Add filter conditions if provided
        if (name) {
            queryParams.push(`%${name}%`);
            whereConditions.push(`s.name ILIKE $${queryParams.length}`);
        }
        
        if (address) {
            queryParams.push(`%${address}%`);
            whereConditions.push(`s.address ILIKE $${queryParams.length}`);
        }
        
        // Add WHERE clause if there are conditions
        if (whereConditions.length > 0) {
            queryText += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        // Group by store fields to calculate average rating
        queryText += ' GROUP BY s.id';
        
        // Add sorting
        const validSortColumns = ['name', 'address', 'created_at', 'average_rating', 'rating_count'];
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
            rating_count: parseInt(store.rating_count),
            user_rating: store.user_rating ? parseInt(store.user_rating) : null
        }));
        
        res.json({
            count: stores.length,
            stores
        });
    } catch (err) {
        next(err); // Pass error to global error handler
    }
});

/**
 * @route   POST /stores/:storeId/ratings
 * @desc    Submit or update a rating for a store
 * @access  Private (Any authenticated user)
 */
router.post('/:storeId/ratings', [
    body('rating_value').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { storeId } = req.params;
    const { rating_value } = req.body;
    const userId = req.user.userId;

    try {
        // Verify store exists
        const storeCheck = await db.query('SELECT * FROM stores WHERE id = $1', [storeId]);
        if (storeCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Insert or update rating using upsert pattern
        const result = await db.query(
            `INSERT INTO ratings (user_id, store_id, rating_value) 
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, store_id) 
             DO UPDATE SET 
                rating_value = EXCLUDED.rating_value,
                updated_at = CURRENT_TIMESTAMP
             RETURNING id, user_id, store_id, rating_value, created_at, updated_at`,
            [userId, storeId, rating_value]
        );

        const rating = result.rows[0];
        
        // Get updated average rating for the store
        const avgResult = await db.query(
            `SELECT AVG(rating_value) as average_rating, COUNT(*) as rating_count
             FROM ratings
             WHERE store_id = $1`,
            [storeId]
        );
        
        const averageRating = parseFloat(avgResult.rows[0].average_rating);
        const ratingCount = parseInt(avgResult.rows[0].rating_count);

        res.status(201).json({
            message: 'Rating submitted successfully',
            rating,
            store: {
                id: parseInt(storeId),
                average_rating: averageRating,
                rating_count: ratingCount
            }
        });
    } catch (err) {
        console.error('Error submitting rating:', err);
        res.status(500).json({ message: 'Server error during rating submission' });
    }
});

module.exports = router;