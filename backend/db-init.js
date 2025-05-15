require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

// Function to create database schema
async function initializeDatabase() {
    try {
        // Create user_role enum type
        await db.query(`
            CREATE TYPE user_role AS ENUM ('system_administrator', 'normal_user', 'store_owner')
        `);
        console.log('Created user_role enum type');

        // Create users table
        await db.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(60) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                address VARCHAR(400),
                role user_role NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created users table');

        // Create stores table
        await db.query(`
            CREATE TABLE stores (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                address VARCHAR(400) NOT NULL,
                owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created stores table');

        // Create ratings table
        await db.query(`
            CREATE TABLE ratings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
                rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, store_id)
            )
        `);
        console.log('Created ratings table');

        console.log('Database schema created successfully');
    } catch (err) {
        console.error('Error creating database schema:', err);
    }
}

// Function to create admin user
async function createAdminUser(name, email, password, address) {
    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert admin user
        const result = await db.query(
            `INSERT INTO users (name, email, password_hash, address, role) 
             VALUES ($1, $2, $3, $4, 'system_administrator') 
             RETURNING id, name, email, role`,
            [name, email, passwordHash, address]
        );

        console.log('Admin user created successfully:', result.rows[0]);
        return result.rows[0];
    } catch (err) {
        console.error('Error creating admin user:', err);
        throw err;
    }
}

// Execute the initialization
async function main() {
    try {
        await initializeDatabase();
        
        // Uncomment and modify to create an admin user
        const adminUser = {
            name: 'Default Admin User Account',
            email: 'admin@example.com',
            password: 'AdminPassword1!', // This will be hashed before storage
            address: '123 Admin Street'
        };
        await createAdminUser(adminUser.name, adminUser.email, adminUser.password, adminUser.address);
        
        console.log('Database initialization completed');
        process.exit(0);
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }
}

main();