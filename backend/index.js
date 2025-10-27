
// // backend/index.js
// const express = require('express');
// const cors = require('cors');
// const supabase = require('./db');
// const swaggerUi = require('swagger-ui-express');
// const swaggerJsdoc = require('swagger-jsdoc');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = 3000;

// // --- Swagger setup ---
// const swaggerOptions = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'Event Management API',
//       version: '1.0.0',
//       description: 'API documentation for Events and Categories',
//     },
//     servers: [
//       {
//         url: `http://localhost:${PORT}`,
//       },
//     ],
//   },
//   apis: ['./index.js'], // you can also point to other files
// };

// const swaggerSpec = swaggerJsdoc(swaggerOptions);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// // --- Root endpoint ---
// app.get('/', (req, res) => {
//   res.send('Backend running ✅');
// });

// // --- Events API ---
// // #swagger.tags = ['Events']
// /**
//  * @swagger
//  * /api/events:
//  *   get:
//  *     summary: Get all events with categories
//  *     tags: [Events]
//  *     responses:
//  *       200:
//  *         description: List of events
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   event_id:
//  *                     type: integer
//  *                   event_title:
//  *                     type: string
//  *                   start_time:
//  *                     type: string
//  *                     format: date-time
//  *                   end_time:
//  *                     type: string
//  *                     format: date-time
//  *                   location:
//  *                     type: string
//  *                   categories:
//  *                     type: array
//  *                     items:
//  *                       type: object
//  *                       properties:
//  *                         category_id:
//  *                           type: integer
//  *                         category_name:
//  *                           type: string
//  */
// app.get('/api/events', async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('events')
//       .select(`event_id, event_title, start_time, end_time, location, event_categories(category_id, category:categories(category_id, category_name))`)
//       .order('start_time', { ascending: true });

//     if (error) throw error;

//     const eventsWithCategories = (data || []).map(event => {
//       let categories = [];
//       if (event.event_categories && event.event_categories.length > 0) {
//         categories = event.event_categories
//           .filter(ec => ec && ec.category)
//           .map(ec => ({
//             category_id: ec.category.category_id,
//             category_name: ec.category.category_name,
//           }));
//       }
//       return { ...event, categories };
//     });

//     res.json(eventsWithCategories);
//   } catch (err) {
//     console.error('Supabase fetch error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // --- Categories API ---
// /**
//  * @swagger
//  * /api/categories:
//  *   get:
//  *     summary: Get all categories
//  *     tags: [Categories]
//  *     responses:
//  *       200:
//  *         description: List of categories
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   category_id:
//  *                     type: integer
//  *                   category_name:
//  *                     type: string
//  */
// app.get('/api/categories', async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('categories')
//       .select('category_id, category_name');

//     if (error) throw error;

//     res.json(data);
//   } catch (err) {
//     console.error('Supabase fetch error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


// backend/index.js
const express = require('express');
const cors = require('cors');
const supabase = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());                                  // Enable CORS for cross-origin requests
app.use(express.json());                          // Parse incoming JSON request bodies

// Define the port for the server
const PORT = 3000;

// --- Swagger Setup ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management API',             // Title of the API
      version: '1.0.0',                          // API version
      description: 'API documentation for Events and Categories', // Description of the API
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,         // Base URL for the API
      },
    ],
  },
  apis: ['./index.js'],                           // Files to scan for Swagger annotations
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Serve Swagger UI

// --- File-based Comment Storage ---
const COMMENTS_FILE = path.join(__dirname, 'comments.json');

// Helper function: Read comments from the file
function readComments() {
  try {
    if (!fs.existsSync(COMMENTS_FILE)) {
      fs.writeFileSync(COMMENTS_FILE, '[]');     // Create an empty file if it doesn't exist
    }
    const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading comments:', error);
    return [];
  }
}

// Helper function: Write comments to the file
function writeComments(comments) {
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
  } catch (error) {
    console.error('Error writing comments:', error);
  }
}

// --- API Endpoints ---

// Root endpoint to check if the server is running
app.get('/', (req, res) => {
  res.send('Backend running ✅');
});

// Fetch all events with their categories
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

    // Format the events with their categories
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

// Fetch all categories
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

// Fetch comments for a specific event
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

// Add a new comment to an event
app.post('/api/events/:eventId/comments', (req, res) => {
  try {
    const { eventId } = req.params;
    const { authorName, commentText } = req.body;

    if (!authorName || !commentText) {
      return res.status(400).json({ error: 'Author name and comment text are required' });
    }

    const comments = readComments();
    const newComment = {
      id: Date.now(),                             // Generate a unique ID using the current timestamp
      event_id: parseInt(eventId),
      author_name: authorName,
      comment_text: commentText,
      created_at: new Date().toISOString(),      // Add the current timestamp
    };

    comments.push(newComment);
    writeComments(comments);

    res.status(201).json(newComment);
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment by its ID
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

// --- Start the Server ---
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));