const express = require('express');
const cors = require('cors');
const supabase = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// --- Swagger Setup ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management API',
      version: '1.0.0',
      description: 'API documentation for Events and Categories',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./index.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- File-based Storage Paths ---
const COMMENTS_FILE = path.join(__dirname, 'comments.json');
const ATTENDANCE_FILE = path.join(__dirname, 'attendance.json');  // NEW: Attendance file
const RATINGS_FILE = path.join(__dirname, 'ratings.json');        // NEW: Ratings file

// --- Helper Functions: Read/Write Files ---

// Read comments from file
function readComments() {
  try {
    if (!fs.existsSync(COMMENTS_FILE)) {
      fs.writeFileSync(COMMENTS_FILE, '[]');
    }
    const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading comments:', error);
    return [];
  }
}

// Write comments to file
function writeComments(comments) {
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
  } catch (error) {
    console.error('Error writing comments:', error);
  }
}

//  Read attendance from file
function readAttendance() {
  try {
    if (!fs.existsSync(ATTENDANCE_FILE)) {
      fs.writeFileSync(ATTENDANCE_FILE, '[]');
    }
    const data = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading attendance:', error);
    return [];
  }
}

//  Write attendance to file
function writeAttendance(attendance) {
  try {
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(attendance, null, 2));
  } catch (error) {
    console.error('Error writing attendance:', error);
  }
}

// Read ratings from file
function readRatings() {
  try {
    if (!fs.existsSync(RATINGS_FILE)) {
      fs.writeFileSync(RATINGS_FILE, '[]');
    }
    const data = fs.readFileSync(RATINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading ratings:', error);
    return [];
  }
}

//  Write ratings to file
function writeRatings(ratings) {
  try {
    fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2));
  } catch (error) {
    console.error('Error writing ratings:', error);
  }
}

// --- Root Endpoint ---
app.get('/', (req, res) => {
  res.send('Backend running ✅');
});

// --- Events API ---
app.get('/api/events', async (req, res) => {
  try {
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
      .order('start_time', { ascending: true });

    if (error) throw error;

    const eventsWithCategories = (data || []).map((event) => {
      let categories = [];
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

// --- Categories API ---
app.get('/api/categories', async (req, res) => {
  try {
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

// --- Comments API (File-based) ---

// Get comments for an event
app.get('/api/events/:eventId/comments', (req, res) => {
  try {
    const { eventId } = req.params;
    const comments = readComments();

    const eventComments = comments
      .filter((c) => c.event_id === parseInt(eventId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(eventComments);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Add a comment
app.post('/api/events/:eventId/comments', (req, res) => {
  try {
    const { eventId } = req.params;
    const { authorName, commentText } = req.body;

    if (!authorName || !commentText) {
      return res.status(400).json({ error: 'Author name and comment text are required' });
    }

    const comments = readComments();
    const newComment = {
      id: Date.now(),
      event_id: parseInt(eventId),
      author_name: authorName,
      comment_text: commentText,
      created_at: new Date().toISOString(),
    };

    comments.push(newComment);
    writeComments(comments);

    res.status(201).json(newComment);
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment
app.delete('/api/comments/:commentId', (req, res) => {
  try {
    const { commentId } = req.params;
    let comments = readComments();

    comments = comments.filter((c) => c.id !== parseInt(commentId));
    writeComments(comments);

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

//  Attendance API (File-based) 

/**
 * POST /api/events/:eventId/attend
 * Mark user as attending an event
 */
app.post('/api/events/:eventId/attend', (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName } = req.body;

    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: 'User name is required' });
    }

    const attendance = readAttendance();
    
    // Check if already attending
    const alreadyAttending = attendance.some(
      (a) => a.event_id === parseInt(eventId) && a.user_name === userName.trim()
    );

    if (alreadyAttending) {
      return res.status(400).json({ error: 'Already marked as attending' });
    }

    // Create new attendance record
    const newAttendance = {
      attendance_id: Date.now(),
      event_id: parseInt(eventId),
      user_name: userName.trim(),
      created_at: new Date().toISOString(),
    };

    attendance.push(newAttendance);
    writeAttendance(attendance);

    res.status(201).json(newAttendance);
  } catch (err) {
    console.error('Error marking attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/events/:eventId/attendance
 * Get all attendees for an event
 */
app.get('/api/events/:eventId/attendance', (req, res) => {
  try {
    const { eventId } = req.params;
    const attendance = readAttendance();

    const eventAttendance = attendance
      .filter((a) => a.event_id === parseInt(eventId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      count: eventAttendance.length,
      attendees: eventAttendance,
    });
  } catch (err) {
    console.error('Error fetching attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/events/:eventId/check-attendance/:userName
 * Check if a user is already attending
 */
app.get('/api/events/:eventId/check-attendance/:userName', (req, res) => {
  try {
    const { eventId, userName } = req.params;
    const attendance = readAttendance();

    const isAttending = attendance.some(
      (a) => a.event_id === parseInt(eventId) && a.user_name === userName
    );

    res.json({ isAttending });
  } catch (err) {
    console.error('Error checking attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/events/:eventId/attend
 * Remove user's attendance
 */
app.delete('/api/events/:eventId/attend', (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName } = req.body;

    if (!userName) {
      return res.status(400).json({ error: 'User name is required' });
    }

    let attendance = readAttendance();

    // Remove the attendance record
    attendance = attendance.filter(
      (a) => !(a.event_id === parseInt(eventId) && a.user_name === userName)
    );

    writeAttendance(attendance);

    res.json({ message: 'Attendance removed successfully' });
  } catch (err) {
    console.error('Error removing attendance:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// NEW: Ratings API (File-based) 

/**
 * POST /api/events/:eventId/rating
 * Submit a rating for an event
 */
app.post('/api/events/:eventId/rating', (req, res) => {
  try {
    const { eventId } = req.params;
    const { userName, rating } = req.body;

    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: 'User name is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const ratings = readRatings();

    // Check if user already rated this event
    const alreadyRated = ratings.some(
      (r) => r.event_id === parseInt(eventId) && r.user_name === userName.trim()
    );

    if (alreadyRated) {
      return res.status(400).json({ error: 'You have already rated this event' });
    }

    // Create new rating record
    const newRating = {
      rating_id: Date.now(),
      event_id: parseInt(eventId),
      user_name: userName.trim(),
      rating: parseInt(rating),
      created_at: new Date().toISOString(),
    };

    ratings.push(newRating);
    writeRatings(ratings);

    res.status(201).json(newRating);
  } catch (err) {
    console.error('Error submitting rating:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/events/:eventId/rating
 * Get all ratings for an event
 */
app.get('/api/events/:eventId/rating', (req, res) => {
  try {
    const { eventId } = req.params;
    const ratings = readRatings();

    const eventRatings = ratings
      .filter((r) => r.event_id === parseInt(eventId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate average
    const totalRatings = eventRatings.length;
    const averageRating = totalRatings > 0
      ? (eventRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : 0;

    res.json({
      averageRating: parseFloat(averageRating),
      totalRatings,
      ratings: eventRatings,
    });
  } catch (err) {
    console.error('Error fetching ratings:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/events/:eventId/check-rating/:userName
 * Check if user already rated this event
 */
app.get('/api/events/:eventId/check-rating/:userName', (req, res) => {
  try {
    const { eventId, userName } = req.params;
    const ratings = readRatings();

    const userRating = ratings.find(
      (r) => r.event_id === parseInt(eventId) && r.user_name === userName
    );

    res.json({
      hasRated: !!userRating,
      userRating: userRating ? userRating.rating : null,
    });
  } catch (err) {
    console.error('Error checking rating:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Start Server ---
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));