require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

const authenticateSession = async (req, res, next) => {
  const userId = req.cookies.session_token;
  if (!userId) return res.status(401).json({ message: 'Unauthorized session' });

  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      res.clearCookie('session_token');
      return res.status(401).json({ message: 'Session expired or invalid' });
    }
    req.user = userResult.rows[0];
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error during session validation' });
  }
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/google', authRateLimiter, async (req, res) => {
  const { credential, role } = req.body;
  if (!credential || !role) return res.status(400).json({ message: 'Missing credential or role' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    const existingUserResult = await db.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, role]
    );

    if (existingUserResult.rows.length > 0) {
      const user = existingUserResult.rows[0];
      res.cookie('session_token', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      return res.json({ isNewUser: false, user });
    }

    return res.json({
      isNewUser: true,
      googlePayload: { email, name, picture, googleId }
    });
  } catch (error) {
    return res.status(401).json({ message: 'Google Token Verification Failed' });
  }
});

app.get('/api/users/exists', async (req, res) => {
  const { email, role } = req.query;
  if (!email || !role) return res.status(400).json({ message: 'Email and role required' });

  try {
    const result = await db.query('SELECT id FROM users WHERE email = $1 AND role = $2', [email, role]);
    return res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    return res.status(500).json({ message: 'Database query failed' });
  }
});

app.post('/api/users', [
  body('username').trim().isLength({ min: 3 }).escape(),
  body('fullName').trim().notEmpty().escape(),
  body('phone').trim().matches(/^\+?[0-9]{10,14}$/),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['buyer', 'seller', 'courier'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, fullName, phone, email, role, providerType, nationality, stateOfOrigin, idType, googlePicture, classifications, googleId } = req.body;

  try {
    const usernameCheck = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) return res.status(409).json({ message: 'Username is already taken' });

    const insertQuery = `
      INSERT INTO users (google_id, email, username, full_name, phone, role, provider_type, nationality, state_of_origin, id_type, google_picture)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
    `;
    const values = [googleId || 'registered_user', email, username, fullName, phone, role, providerType || null, nationality || null, stateOfOrigin || null, idType || null, googlePicture || null];
    const userResult = await db.query(insertQuery, values);
    const newUser = userResult.rows[0];

    if (role === 'seller' && Array.isArray(classifications) && classifications.length > 0) {
      const classQueries = classifications.map(c => 
        db.query('INSERT INTO user_classifications (user_id, classification) VALUES ($1, $2)', [newUser.id, c])
      );
      await Promise.all(classQueries);
    }

    res.cookie('session_token', newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session_token');
  return res.json({ message: 'Logged out successfully' });
});

// --- DASHBOARD ENDPOINTS ---
app.get('/api/me', authenticateSession, async (req, res) => {
  try {
    let classifications = [];
    if (req.user.role === 'seller') {
      const classRes = await db.query('SELECT classification FROM user_classifications WHERE user_id = $1', [req.user.id]);
      classifications = classRes.rows.map(r => r.classification);
    }
    return res.json({ ...req.user, classifications });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve user' });
  }
});

app.get('/api/listings', authenticateSession, async (req, res) => {
  try {
    const sellerId = req.query.sellerId || req.user.id;
    const result = await db.query('SELECT * FROM listings WHERE seller_id = $1 ORDER BY created_at DESC', [sellerId]);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

app.post('/api/listings', authenticateSession, async (req, res) => {
  const { title, classification, price, lat, lng } = req.body;
  try {
    const query = `
      INSERT INTO listings (seller_id, title, classification, price, latitude, longitude, location)
      VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography) RETURNING *;
    `;
    const result = await db.query(query, [req.user.id, title, classification, price, lat || null, lng || null]);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create listing' });
  }
});

app.put('/api/listings/:id', authenticateSession, async (req, res) => {
  const { id } = req.params;
  const { title, classification, status } = req.body;
  try {
    const result = await db.query(
      `UPDATE listings SET title = COALESCE($1, title), classification = COALESCE($2, classification), status = COALESCE($3, status)
       WHERE id = $4 AND seller_id = $5 RETURNING *;`,
      [title, classification, status, id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Listing not found or unauthorized' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update listing' });
  }
});

app.delete('/api/listings/:id', authenticateSession, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM listings WHERE id = $1 AND seller_id = $2 RETURNING id;', [id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Listing not found or unauthorized' });
    return res.json({ message: 'Listing deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete listing' });
  }
});

app.get('/api/services', authenticateSession, async (req, res) => {
  const { classification, lat, lng, radius = 10000 } = req.query;
  try {
    const userLng = parseFloat(lng) || 3.3792;
    const userLat = parseFloat(lat) || 6.5244;

    let query = `
      SELECT l.*, u.full_name as "providerName", 
      ST_Distance(l.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
      FROM listings l
      JOIN users u ON l.seller_id = u.id
      WHERE l.status = 'Active'
    `;
    const params = [userLng, userLat];

    if (classification) {
      params.push(classification);
      query += ` AND l.classification = $${params.length}`;
    }

    query += ` AND ST_DWithin(l.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $${params.length + 1})
              ORDER BY distance_km ASC LIMIT 20;`;
    params.push(parseFloat(radius));

    const result = await db.query(query, params);
    return res.json(result.rows.map(r => ({
      ...r,
      distance: `${parseFloat(r.distance_km || 0).toFixed(1)}km away`,
      rating: 4.9
    })));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch services' });
  }
});

app.get('/api/requests/mine', authenticateSession, async (req, res) => {
  try {
    const query = `
      SELECT r.*, u.full_name as provider
      FROM requests r
      LEFT JOIN listings l ON r.listing_id = l.id
      LEFT JOIN users u ON l.seller_id = u.id
      WHERE r.buyer_id = $1 ORDER BY r.created_at DESC;
    `;
    const result = await db.query(query, [req.user.id]);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

app.post('/api/requests', authenticateSession, async (req, res) => {
  const { listingId, title, classification, budget } = req.body;
  try {
    if (listingId) {
      const listingRes = await db.query('SELECT * FROM listings WHERE id = $1', [listingId]);
      if (listingRes.rows.length === 0) return res.status(404).json({ message: 'Listing not found' });
      
      const listing = listingRes.rows[0];
      const query = `
        INSERT INTO requests (buyer_id, listing_id, title, classification, budget, status)
        VALUES ($1, $2, $3, $4, $5, 'waiting') RETURNING *;
      `;
      const result = await db.query(query, [req.user.id, listing.id, listing.title, listing.classification, listing.price]);
      return res.status(201).json(result.rows[0]);
    } 
    
    if (!title || !classification || !budget) {
        return res.status(400).json({ message: 'Missing required fields for general request' });
    }
    
    const query = `
      INSERT INTO requests (buyer_id, listing_id, title, classification, budget, status)
      VALUES ($1, NULL, $2, $3, $4, 'waiting') RETURNING *;
    `;
    const result = await db.query(query, [req.user.id, title, classification, budget]);
    return res.status(201).json(result.rows[0]);

  } catch (err) {
    return res.status(500).json({ message: 'Failed to create request' });
  }
});

app.patch('/api/requests/:id', authenticateSession, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await db.query('UPDATE requests SET status = $1 WHERE id = $2 RETURNING *;', [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Request not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update request status' });
  }
});

app.get('/api/requests/matching', authenticateSession, async (req, res) => {
  try {
    const classRes = await db.query('SELECT classification FROM user_classifications WHERE user_id = $1', [req.user.id]);
    const categories = classRes.rows.map(r => r.classification);

    if (categories.length === 0) return res.json([]);

    const result = await db.query(
      `SELECT r.*, u.full_name as "postedBy" FROM requests r
       JOIN users u ON r.buyer_id = u.id
       WHERE r.classification = ANY($1::text[]) ORDER BY r.created_at DESC;`,
      [categories]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch matching requests' });
  }
});

app.get('/api/notifications', authenticateSession, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, text, created_at as time FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;',
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PUT /api/users/me (Update User Profile)
app.put('/api/users/me', authenticateSession, async (req, res) => {
  const { fullName, username, phone, stateOfOrigin } = req.body;
  try {
    const query = `
      UPDATE users 
      SET full_name = COALESCE($1, full_name), 
          username = COALESCE($2, username), 
          phone = COALESCE($3, phone),
          state_of_origin = COALESCE($4, state_of_origin)
      WHERE id = $5 RETURNING *;
    `;
    const result = await db.query(query, [fullName, username, phone, stateOfOrigin, req.user.id]);
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

// GET /api/messages/:otherUser (Fetch Chat Thread)
app.get('/api/messages/:otherUser', authenticateSession, async (req, res) => {
  const { otherUser } = req.params;
  const myUsername = req.user.username;
  try {
    const query = `
      SELECT * FROM messages 
      WHERE (sender_username = $1 AND receiver_username = $2) 
         OR (sender_username = $2 AND receiver_username = $1)
      ORDER BY created_at ASC;
    `;
    const result = await db.query(query, [myUsername, otherUser]);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// POST /api/messages (Send a Message)
app.post('/api/messages', authenticateSession, async (req, res) => {
  const { receiverUsername, messageText } = req.body;
  try {
    const query = `
      INSERT INTO messages (sender_username, receiver_username, message_text)
      VALUES ($1, $2, $3) RETURNING *;
    `;
    const result = await db.query(query, [req.user.username, receiverUsername, messageText]);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send message' });
  }
});

// GET /api/deliveries (Fetch Available Courier Jobs)
app.get('/api/deliveries', authenticateSession, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM deliveries WHERE status = 'Available' ORDER BY created_at DESC;");
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch deliveries' });
  }
});

// --- FRONTEND INTEGRATION ---
// Tell Node to publicly serve the compiled Vite files
app.use(express.static(path.join(__dirname, 'getit-frontend', 'dist')));

// The Catch-All Route: If a user asks for a page that isn't an API route, hand them the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'getit-frontend', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));