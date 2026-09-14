-- Enable PostGIS extension for high-performance geospatial queries (ST_DWithin, ST_Distance)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'seller', 'courier')),
    provider_type VARCHAR(50),
    nationality VARCHAR(100),
    state_of_origin VARCHAR(100),
    id_type VARCHAR(50),
    google_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, role)
);

-- 2. User Classifications (Multi-select categories for Sellers)
CREATE TABLE IF NOT EXISTS user_classifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    classification VARCHAR(100) NOT NULL,
    UNIQUE(user_id, classification)
);

-- 3. Listings Table (With PostGIS Location Geometry)
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    seller_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    classification VARCHAR(100) NOT NULL,
    price VARCHAR(50) NOT NULL,
    views INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Paused')),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Requests Table
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    buyer_id INT REFERENCES users(id) ON DELETE CASCADE,
    listing_id INT REFERENCES listings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    classification VARCHAR(100) NOT NULL,
    budget VARCHAR(50),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geospatial Index for Fast Proximity Queries
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings USING GIST (location);