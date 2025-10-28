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
      description: 'API documentation for Events, Categories, Comments, Attendance, and Ratings',
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
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Backend running ✅
 */
app.get('/', (req, res) => {
  res.send('Backend running ✅');
});

// ============================================================================
// EVENTS API ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Fetch all events with their categories
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of all events with category information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   event_id:
 *                     type: integer
 *                   event_title:
 *                     type: string
 *                   start_time:
 *                     type: string
 *                     format: date-time
 *                   end_time:
 *                     type: string
 *                     format: date-time
 *                   location:
 *                     type: string
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         category_id:
 *                           type: integer
 *                         category_name:
 *                           type: string
 *       500:
 *         description: Server error
 */
app.get('/api/events', async (req, res) => {
  try {
    // Query events table from Supabase with related categories
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
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Fetch all event categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category_id:
 *                     type: integer
 *                   category_name:
 *                     type: string
 *       500:
 *         description: Server error
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
 * @swagger
 * /api/events/{eventId}/comments:
 *   get:
 *     summary: Fetch all comments for a specific event
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     responses:
 *       200:
 *         description: List of comments for the event (sorted by newest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   event_id:
 *                     type: integer
 *                   author_name:
 *                     type: string
 *                   comment_text:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
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
 * @swagger
 * /api/events/{eventId}/comments:
 *   post:
 *     summary: Add a new comment to an event
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authorName
 *               - commentText
 *             properties:
 *               authorName:
 *                 type: string
 *                 description: Name of the comment author
 *               commentText:
 *                 type: string
 *                 description: The comment content
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 event_id:
 *                   type: integer
 *                 author_name:
 *                   type: string
 *                 comment_text:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error (missing author name or comment text)
 *       500:
 *         description: Server error
 */
app.post('/api/events/:eventId/comments', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { authorName, commentText } = req.body;

    // Validate input - author name is required
    if (!authorName || !authorName.trim()) {
      return res.status(400).json({ error: 'Author name is required' });
    }

    // Validate input - comment text is required
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
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a specific comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The comment ID to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted successfully
 *       500:
 *         description: Server error
 */
app.delete('/api/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    // Delete comment from database by comment ID
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
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     summary: Update a specific comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The comment ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentText
 *             properties:
 *               commentText:
 *                 type: string
 *                 description: The updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 event_id:
 *                   type: integer
 *                 author_name:
 *                   type: string
 *                 comment_text:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error (missing comment text)
 *       500:
 *         description: Server error
 */
app.put('/api/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { commentText } = req.body;

    // Validate input - comment text is required
    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Update comment in database by comment ID
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

// ============================================================================
// ATTENDANCE API ENDPOINTS (DATABASE-BASED)
// ============================================================================
// Attendance records track which users are attending which events
// Each user can only attend an event once (enforced by unique constraint)

/**
 * @swagger
 * /api/events/{eventId}/attend:
 *   post:
 *     summary: Mark user as attending an event
 *     description: Creates an attendance record for a user at a specific event. Each user can only attend an event once.
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *             properties:
 *               userName:
 *                 type: string
 *                 description: Name of the user attending the event
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendance_id:
 *                   type: integer
 *                 event_id:
 *                   type: integer
 *                 user_name:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error or user already attending
 *       500:
 *         description: Server error
 */
app.post('/api/events/:eventId/attend', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName } = req.body;
    
    // Validate input - user name is required
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    // Insert attendance record into database
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
      // Check if it's a duplicate entry error (unique constraint violation)
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Already marked as attending' });
      }
      throw error;
    }
    
    res.status(201).json(data[0]); // 201 = Created
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
 *     description: Retrieves all attendees for a specific event, including total count
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Attendance details (sorted by most recent first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Total number of attendees
 *                 attendees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       attendance_id:
 *                         type: integer
 *                       event_id:
 *                         type: integer
 *                       user_name:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
app.get('/api/events/:eventId/attendance', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Fetch all attendance records for this event from database
    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_id, event_id, user_name, created_at')
      .eq('event_id', parseInt(eventId))
      .order('created_at', { ascending: false }); // Newest first
    
    if (error) throw error;
    
    // Return count and full list of attendees
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
 *     description: Deletes an attendance record, allowing users to un-attend an event
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *             properties:
 *               userName:
 *                 type: string
 *                 description: Name of the user to remove from attendance
 *     responses:
 *       200:
 *         description: Attendance removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance removed successfully
 *       400:
 *         description: Validation error (missing user name)
 *       500:
 *         description: Server error
 */
app.delete('/api/events/:eventId/attend', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName } = req.body;
    
    // Validate input - user name is required
    if (!userName) {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    // Delete attendance record from database
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
 *     description: Verifies whether a user has already marked attendance for an event
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *         description: The user name to check
 *     responses:
 *       200:
 *         description: Attendance status for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAttending:
 *                   type: boolean
 *                   description: True if user is attending, false otherwise
 *       500:
 *         description: Server error
 */
app.get('/api/events/:eventId/check-attendance/:userName', async (req, res) => {
  try {
    const { eventId, userName } = req.params;
    
    // Check if attendance record exists for this user and event
    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_id')
      .eq('event_id', parseInt(eventId))
      .eq('user_name', userName)
      .maybeSingle(); // Returns null if not found, doesn't throw error
    
    if (error) throw error;
    
    // Return boolean indicating if user is attending
    res.json({ isAttending: !!data });
  } catch (err) {
    console.error('Error checking attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// RATINGS API ENDPOINTS (DATABASE-BASED)
// ============================================================================
// Ratings allow users to rate events on a scale of 1-5 stars
// Each user can only rate an event once (enforced by unique constraint)

/**
 * @swagger
 * /api/events/{eventId}/rating:
 *   post:
 *     summary: Submit a rating for an event
 *     description: Creates a rating record for an event. Each user can only rate an event once. Rating must be between 1 and 5.
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - rating
 *             properties:
 *               userName:
 *                 type: string
 *                 description: Name of the user submitting the rating
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value (1-5 stars)
 *     responses:
 *       201:
 *         description: Rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rating_id:
 *                   type: integer
 *                 event_id:
 *                   type: integer
 *                 user_name:
 *                   type: string
 *                 rating:
 *                   type: integer
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error (invalid rating, missing fields, or already rated)
 *       500:
 *         description: Server error
 */
app.post('/api/events/:eventId/rating', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName, rating } = req.body;
    
    // Validate input - user name is required
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    // Validate input - rating must be between 1 and 5
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Insert rating record into database
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
      // Check if user already rated this event (unique constraint violation)
      if (error.code === '23505') {
        return res.status(400).json({ error: 'You have already rated this event' });
      }
      throw error;
    }
    
    res.status(201).json(data[0]); // 201 = Created
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
 *     description: Retrieves all ratings for an event and calculates the average rating
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Rating information (ratings sorted by most recent first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   format: float
 *                   description: Average rating (0 if no ratings)
 *                 totalRatings:
 *                   type: integer
 *                   description: Total number of ratings
 *                 ratings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rating_id:
 *                         type: integer
 *                       user_name:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
app.get('/api/events/:eventId/rating', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Fetch all ratings for this event from database
    const { data, error } = await supabase
      .from('ratings')
      .select('rating_id, user_name, rating, created_at')
      .eq('event_id', parseInt(eventId))
      .order('created_at', { ascending: false }); // Newest first
    
    if (error) throw error;
    
    // Calculate average rating from all ratings
    const totalRatings = data.length;
    const averageRating = totalRatings > 0 
      ? (data.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : 0;
    
    // Return average, count, and full list of ratings
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
 *     description: Verifies whether a user has submitted a rating for an event and returns their rating if it exists
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The event ID
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *         description: The user name to check
 *     responses:
 *       200:
 *         description: Rating status for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasRated:
 *                   type: boolean
 *                   description: True if user has rated the event, false otherwise
 *                 userRating:
 *                   type: integer
 *                   nullable: true
 *                   description: The user's rating (1-5) or null if not rated
 *       500:
 *         description: Server error
 */
app.get('/api/events/:eventId/check-rating/:userName', async (req, res) => {
  try {
    const { eventId, userName } = req.params;
    
    // Check if rating record exists for this user and event
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('event_id', parseInt(eventId))
      .eq('user_name', userName)
      .maybeSingle(); // Returns null if not found, doesn't throw error
    
    if (error) throw error;
    
    // Return boolean indicating if user has rated, and their rating value
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