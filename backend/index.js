require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');
const storeOwnerRoutes = require('./routes/storeOwnerRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`); // Check output for this line
    console.log('Request body:', req.body);
    next();
});

// Test database connection on startup
db.query('SELECT NOW()', [])
    .then(result => {
        console.log('Database connection successful. Server time:', result.rows[0].now);
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });

// Mount routes
app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);  // This is the route we need to ensure is working
app.use('/api/stores', storeRoutes);
app.use('/api/store-owner', storeOwnerRoutes);

app.get('/', (req, res) => {
    res.send('Store Ratings API Running!');
});

// Debug 404 handler - Add more detailed logging
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`); // Check if this is being hit
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    res.status(404).send(`Cannot ${req.method} ${req.url}`);
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    // Determine appropriate status code
    const statusCode = err.statusCode || 500;
    
    // Prepare error response
    const errorResponse = {
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    };
    
    res.status(statusCode).json(errorResponse);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});