const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header and verifies it
 * If valid, attaches decoded user info to req.user
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user; // user contains { userId, role, name, email }
        next();
    });
};

/**
 * Middleware to authorize based on user roles
 * Takes an array of allowed roles and checks if user's role is included
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };