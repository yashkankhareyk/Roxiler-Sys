const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon, adjust if self-hosting
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};