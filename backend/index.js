// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

const express = require('express');                    // Web framework for Node.js
const cors = require('cors');                          // Enable Cross-Origin Resource Sharing
const supabase = require('./db');                      // Supabase database client
const swaggerUi = require('swagger-ui-express');       // Swagger UI for API documentation
const swaggerJsdoc = require('swagger-jsdoc');         // JSDoc to Swagger converter
const fs = require('fs');                              // File System module for file operations
const path = require('path');                          // Path utilities for file paths

// ============================================================================
// APP INITIALIZATION
// ============================================================================

const app = express();                                 // Create Express application
app.use(cors());                                       // Enable CORS for all routes
app.use(express.json());                               // Parse JSON request bodies

const PORT = 3000;                                     // Server port

// ============================================================================
// SWAGGER DOCUMENTATION SETUP
// ============================================================================
// Swagger provides interactive API documentation at /api-docs

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',                                  // OpenAPI version
    info: {
      title: 'Event Management API',                  // API title
      version: '1.0.0',                               // API version
      description: 'API documentation for Events and Categories',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,              // Server URL
      },
    ],
  },
  apis: ['./index.js'],                               // Files to scan for JSDoc comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);      // Generate Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Serve Swagger UI

// ============================================================================
// FILE-BASED STORAGE PATHS
// ============================================================================
// These files store attendance and ratings data (instead of database)

const ATTENDANCE_FILE = path.join(__dirname, 'attendance.json'); // Attendance records file
const RATINGS_FILE = path.join(__dirname, 'ratings.json');       // Ratings records file

// ============================================================================
// HELPER FUNCTIONS: FILE OPERATIONS
// ============================================================================

/**
 * Read attendance data from JSON file
 * @returns {Array} Array of attendance records or empty array if error
 */
function readAttendance() {
  try {
    // Check if file exists, if not create empty array
    if (!fs.existsSync(ATTENDANCE_FILE)) {
      fs.writeFileSync(ATTENDANCE_FILE, '[]');
    }
    // Read file contents
    const data = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
    // Parse JSON string to JavaScript object
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading attendance:', error);
    return [];
  }
}

/**
 * Write attendance data to JSON file
 * @param {Array} attendance - Attendance records to save
 */
function writeAttendance(attendance) {
  try {
    // Convert array to formatted JSON string (null, 2 = 2-space indentation)
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(attendance, null, 2));
  } catch (error) {
    console.error('Error writing attendance:', error);
  }
}

/**
 * Read ratings data from JSON file
 * @returns {Array} Array of rating records or empty array if error
 */
function readRatings() {
  try {
    // Check if file exists, if not create empty array
    if (!fs.existsSync(RATINGS_FILE)) {
      fs.writeFileSync(RATINGS_FILE, '[]');
    }
    // Read file contents
    const data = fs.readFileSync(RATINGS_FILE, 'utf8');
    // Parse JSON string to JavaScript object
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading ratings:', error);
    return [];
  }
}

/**
 * Write ratings data to JSON file
 * @param {Array} ratings - Rating records to save
 */
function writeRatings(ratings) {
  try {
    // Convert array to formatted JSON string
    fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2));
  } catch (error) {
    console.error('Error writing ratings:', error);
  }
}

// ============================================================================
// ROOT ENDPOINT
// ============================================================================

/**
 * GET / - Test endpoint to verify server is running
 */
app.get('/', (req, res) => {
  res.send('Backend running ✅');
});

// ============================================================================
// EVENTS API ENDPOINTS
// ============================================================================

/**
 * GET /api/events - Fetch all events with their categories
 * Returns: Array of event objects with category information
 */
app.get('/api/events', async (req, res) => {
  try {
    // Query events table from Supabase
    const { data, error } = await supabase
      .from('events')
      .select(`
        event_id, 
        event_title, 
        start_time, 
        end_time, 
        location, 
        event_categories(category_id, category:categories(category_id, category_name))
      `)
      .order('start_time', { ascending: true }); // Sort by start time

    if (error) throw error;

    // Transform data to include categories properly
    const eventsWithCategories = (data || []).map((event) => {
      let categories = [];
      // Extract categories from join table
      if (event.event_categories && event.event_categories.length > 0) {
        categories = event.event_categories
          .filter((ec) => ec && ec.category)
          .map((ec) => ({
            category_id: ec.category.category_id,
            category_name: ec.category.category_name,
          }));
      }
      return { ...event, categories };
    });

    res.json(eventsWithCategories);
  } catch (err) {
    console.error('Error fetching events:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// CATEGORIES API ENDPOINTS
// ============================================================================

/**
 * GET /api/categories - Fetch all event categories
 * Returns: Array of category objects
 */
app.get('/api/categories', async (req, res) => {
  try {
    // Query categories table from Supabase
    const { data, error } = await supabase
      .from('categories')
      .select('category_id, category_name');

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// COMMENTS API ENDPOINTS (DATABASE-BASED)
// ============================================================================
// Comments are stored in Supabase database (not in JSON files)

/**
 * GET /api/events/:eventId/comments - Fetch all comments for an event
 * @param {number} eventId - Event ID
 * Returns: Array of comment objects sorted by newest first
 */
app.get('/api/events/:eventId/comments', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Query comments table filtered by event_id
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('event_id', parseInt(eventId))
      .order('created_at', { ascending: false }); // Newest first

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/events/:eventId/comments - Add a new comment to an event
 * @param {number} eventId - Event ID
 * Request body: { authorName: string, commentText: string }
 * Returns: Created comment object
 */
app.post('/api/events/:eventId/comments', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { authorName, commentText } = req.body;

    // Validate input
    if (!authorName || !authorName.trim()) {
      return res.status(400).json({ error: 'Author name is required' });
    }

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Insert new comment into database
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          event_id: parseInt(eventId),
          author_name: authorName.trim(),
          comment_text: commentText.trim(),
        }
      ])
      .select()
      .single(); // Return the inserted row

    if (error) throw error;

    res.status(201).json(data); // 201 = Created
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/comments/:commentId - Delete a specific comment
 * @param {number} commentId - Comment ID
 * Returns: Success message
 */
app.delete('/api/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    // Delete comment from database
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', parseInt(commentId));

    if (error) throw error;

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/comments/:commentId - Update a specific comment
 * @param {number} commentId - Comment ID
 * Request body: { commentText: string }
 * Returns: Updated comment object
 */
app.put('/api/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { commentText } = req.body;

    // Validate input
    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Update comment in database
    const { data, error } = await supabase
      .from('comments')
      .update({ comment_text: commentText.trim() })
      .eq('id', parseInt(commentId))
      .select()
      .single(); // Return the updated row

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error updating comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// // ============================================================================
// // ATTENDANCE API ENDPOINTS (FILE-BASED)
// // ============================================================================
// // Attendance records are stored in attendance.json file

// /**
//  * POST /api/events/:eventId/attend - Mark user as attending an event
//  * @param {number} eventId - Event ID
//  * Request body: { userName: string }
//  * Returns: Created attendance record
//  * Status 400: If user already marked as attending
//  */
// app.post('/api/events/:eventId/attend', (req, res) => {
//   try {
//     const { eventId } = req.params;
//     const { userName } = req.body;

//     // Validate input
//     if (!userName || !userName.trim()) {
//       return res.status(400).json({ error: 'User name is required' });
//     }

//     // Read current attendance records
//     const attendance = readAttendance();
    
//     // Check if user already marked as attending this event
//     const alreadyAttending = attendance.some(
//       (a) => a.event_id === parseInt(eventId) && a.user_name === userName.trim()
//     );

//     if (alreadyAttending) {
//       return res.status(400).json({ error: 'Already marked as attending' });
//     }

//     // Create new attendance record
//     const newAttendance = {
//       attendance_id: Date.now(),              // Unique ID based on timestamp
//       event_id: parseInt(eventId),
//       user_name: userName.trim(),
//       created_at: new Date().toISOString(),   // ISO format timestamp
//     };

//     // Add to array and save to file
//     attendance.push(newAttendance);
//     writeAttendance(attendance);

//     res.status(201).json(newAttendance); // 201 = Created
//   } catch (err) {
//     console.error('Error marking attendance:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * GET /api/events/:eventId/attendance - Get all attendees for an event
//  * @param {number} eventId - Event ID
//  * Returns: { count: number, attendees: Array }
//  */
// app.get('/api/events/:eventId/attendance', (req, res) => {
//   try {
//     const { eventId } = req.params;
    
//     // Read all attendance records
//     const attendance = readAttendance();

//     // Filter by event_id and sort by newest first
//     const eventAttendance = attendance
//       .filter((a) => a.event_id === parseInt(eventId))
//       .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

//     res.json({
//       count: eventAttendance.length,        // Total number of attendees
//       attendees: eventAttendance,           // List of attendee objects
//     });
//   } catch (err) {
//     console.error('Error fetching attendance:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * GET /api/events/:eventId/check-attendance/:userName - Check if user is attending
//  * @param {number} eventId - Event ID
//  * @param {string} userName - User name
//  * Returns: { isAttending: boolean }
//  */
// app.get('/api/events/:eventId/check-attendance/:userName', (req, res) => {
//   try {
//     const { eventId, userName } = req.params;
    
//     // Read all attendance records
//     const attendance = readAttendance();

//     // Check if user exists in attendance list for this event
//     const isAttending = attendance.some(
//       (a) => a.event_id === parseInt(eventId) && a.user_name === userName
//     );

//     res.json({ isAttending });
//   } catch (err) {
//     console.error('Error checking attendance:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * DELETE /api/events/:eventId/attend - Remove user's attendance
//  * @param {number} eventId - Event ID
//  * Request body: { userName: string }
//  * Returns: Success message
//  */
// app.delete('/api/events/:eventId/attend', (req, res) => {
//   try {
//     const { eventId } = req.params;
//     const { userName } = req.body;

//     // Validate input
//     if (!userName) {
//       return res.status(400).json({ error: 'User name is required' });
//     }

//     // Read current attendance records
//     let attendance = readAttendance();

//     // Filter out the attendance record for this user and event
//     attendance = attendance.filter(
//       (a) => !(a.event_id === parseInt(eventId) && a.user_name === userName)
//     );

//     // Save updated records
//     writeAttendance(attendance);

//     res.json({ message: 'Attendance removed successfully' });
//   } catch (err) {
//     console.error('Error removing attendance:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ============================================================================
// // RATINGS API ENDPOINTS (FILE-BASED)
// // ============================================================================
// // Rating records are stored in ratings.json file

// /**
//  * POST /api/events/:eventId/rating - Submit a rating for an event
//  * @param {number} eventId - Event ID
//  * Request body: { userName: string, rating: number (1-5) }
//  * Returns: Created rating record
//  * Status 400: If user already rated or invalid rating
//  */
// app.post('/api/events/:eventId/rating', (req, res) => {
//   try {
//     const { eventId } = req.params;
//     const { userName, rating } = req.body;

//     // Validate user name
//     if (!userName || !userName.trim()) {
//       return res.status(400).json({ error: 'User name is required' });
//     }

//     // Validate rating (must be 1-5)
//     if (!rating || rating < 1 || rating > 5) {
//       return res.status(400).json({ error: 'Rating must be between 1 and 5' });
//     }

//     // Read current ratings
//     const ratings = readRatings();

//     // Check if user already rated this event
//     const alreadyRated = ratings.some(
//       (r) => r.event_id === parseInt(eventId) && r.user_name === userName.trim()
//     );

//     if (alreadyRated) {
//       return res.status(400).json({ error: 'You have already rated this event' });
//     }

//     // Create new rating record
//     const newRating = {
//       rating_id: Date.now(),                 // Unique ID based on timestamp
//       event_id: parseInt(eventId),
//       user_name: userName.trim(),
//       rating: parseInt(rating),              // Convert to integer (1-5)
//       created_at: new Date().toISOString(),  // ISO format timestamp
//     };

//     // Add to array and save to file
//     ratings.push(newRating);
//     writeRatings(ratings);

//     res.status(201).json(newRating); // 201 = Created
//   } catch (err) {
//     console.error('Error submitting rating:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * GET /api/events/:eventId/rating - Get all ratings for an event
//  * @param {number} eventId - Event ID
//  * Returns: { averageRating: number, totalRatings: number, ratings: Array }
//  */
// app.get('/api/events/:eventId/rating', (req, res) => {
//   try {
//     const { eventId } = req.params;
    
//     // Read all ratings
//     const ratings = readRatings();

//     // Filter by event_id and sort by newest first
//     const eventRatings = ratings
//       .filter((r) => r.event_id === parseInt(eventId))
//       .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

//     // Calculate average rating
//     const totalRatings = eventRatings.length;
//     const averageRating = totalRatings > 0
//       ? (eventRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
//       : 0;

//     res.json({
//       averageRating: parseFloat(averageRating),  // Convert to number
//       totalRatings,                              // Total count
//       ratings: eventRatings,                     // All ratings for this event
//     });
//   } catch (err) {
//     console.error('Error fetching ratings:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /**
//  * GET /api/events/:eventId/check-rating/:userName - Check if user already rated
//  * @param {number} eventId - Event ID
//  * @param {string} userName - User name
//  * Returns: { hasRated: boolean, userRating: number|null }
//  */
// app.get('/api/events/:eventId/check-rating/:userName', (req, res) => {
//   try {
//     const { eventId, userName } = req.params;
    
//     // Read all ratings
//     const ratings = readRatings();

//     // Find user's rating for this event
//     const userRating = ratings.find(
//       (r) => r.event_id === parseInt(eventId) && r.user_name === userName
//     );

//     res.json({
//       hasRated: !!userRating,                     // Boolean: has user rated?
//       userRating: userRating ? userRating.rating : null, // User's rating or null
//     });
//   } catch (err) {
//     console.error('Error checking rating:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });



// --- Attendance API Endpoints (Database-based) ---

/**
 * @swagger
 * /api/events/{eventId}/attend:
 *   post:
 *     summary: Mark user as attending an event
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *       400:
 *         description: Already attending or validation error
 */
app.post('/api/events/:eventId/attend', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName } = req.body;
    
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    // Insert attendance record
    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          event_id: parseInt(eventId),
          user_name: userName.trim()
        }
      ])
      .select();
    
    if (error) {
      // Check if it's a duplicate entry error
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Already marked as attending' });
      }
      throw error;
    }
    
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error marking attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{eventId}/attendance:
 *   get:
 *     summary: Get attendance count and list for an event
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 attendees:
 *                   type: array
 *                   items:
 *                     type: object
 */
app.get('/api/events/:eventId/attendance', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Fetch all attendance records for this event
    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_id, event_id, user_name, created_at')
      .eq('event_id', parseInt(eventId))
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      count: data.length,
      attendees: data
    });
  } catch (err) {
    console.error('Error fetching attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{eventId}/attend:
 *   delete:
 *     summary: Remove user's attendance from an event
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance removed successfully
 */
app.delete('/api/events/:eventId/attend', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName } = req.body;
    
    if (!userName) {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    // Delete attendance record
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('event_id', parseInt(eventId))
      .eq('user_name', userName);
    
    if (error) throw error;
    
    res.json({ message: 'Attendance removed successfully' });
  } catch (err) {
    console.error('Error removing attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{eventId}/check-attendance/{userName}:
 *   get:
 *     summary: Check if a specific user is attending an event
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance status
 */
app.get('/api/events/:eventId/check-attendance/:userName', async (req, res) => {
  try {
    const { eventId, userName } = req.params;
    
    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_id')
      .eq('event_id', parseInt(eventId))
      .eq('user_name', userName)
      .maybeSingle();
    
    if (error) throw error;
    
    res.json({ isAttending: !!data });
  } catch (err) {
    console.error('Error checking attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Ratings API Endpoints (Database-based) ---

/**
 * @swagger
 * /api/events/{eventId}/rating:
 *   post:
 *     summary: Submit a rating for an event
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Rating submitted successfully
 *       400:
 *         description: Invalid rating or already rated
 */
app.post('/api/events/:eventId/rating', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName, rating } = req.body;
    
    // Validate inputs
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Insert rating
    const { data, error } = await supabase
      .from('ratings')
      .insert([
        {
          event_id: parseInt(eventId),
          user_name: userName.trim(),
          rating: parseInt(rating)
        }
      ])
      .select();
    
    if (error) {
      // Check if user already rated
      if (error.code === '23505') {
        return res.status(400).json({ error: 'You have already rated this event' });
      }
      throw error;
    }
    
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error submitting rating:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{eventId}/rating:
 *   get:
 *     summary: Get average rating and rating details for an event
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rating information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                 totalRatings:
 *                   type: integer
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: object
 */
app.get('/api/events/:eventId/rating', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Fetch all ratings for this event
    const { data, error } = await supabase
      .from('ratings')
      .select('rating_id, user_name, rating, created_at')
      .eq('event_id', parseInt(eventId))
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate average
    const totalRatings = data.length;
    const averageRating = totalRatings > 0 
      ? (data.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : 0;
    
    res.json({
      averageRating: parseFloat(averageRating),
      totalRatings,
      ratings: data
    });
  } catch (err) {
    console.error('Error fetching ratings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{eventId}/check-rating/{userName}:
 *   get:
 *     summary: Check if a user has already rated an event
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasRated:
 *                   type: boolean
 *                 userRating:
 *                   type: integer
 */
app.get('/api/events/:eventId/check-rating/:userName', async (req, res) => {
  try {
    const { eventId, userName } = req.params;
    
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('event_id', parseInt(eventId))
      .eq('user_name', userName)
      .maybeSingle();
    
    if (error) throw error;
    
    res.json({ 
      hasRated: !!data,
      userRating: data ? data.rating : null
    });
  } catch (err) {
    console.error('Error checking rating:', err.message);
    res.status(500).json({ error: err.message });
  }
});



// ============================================================================
// START SERVER
// ============================================================================

/**
 * Start Express server and listen for requests
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// ============================================================================
// END OF FILE
// ============================================================================

