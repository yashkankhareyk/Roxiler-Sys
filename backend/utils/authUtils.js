const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Hashes a password using bcrypt
 * @param {string} password - The plain text password
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compares a password with a hash
 * @param {string} password - The plain text password
 * @param {string} hash - The hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

/**
 * Generates a JWT token
 * @param {Object} payload - The data to include in the token
 * @returns {string} - The JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken
};