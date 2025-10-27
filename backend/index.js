
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
const express = require('express');               // framework for creating server
const cors = require('cors');                     // middleware for handling CORS
const supabase = require('./db');                 //database services
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');    // swagger modules
const fs = require('fs');                         // node js modules
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// --- Swagger setup ---
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
  apis: ['./index.js'], // you can also point to other files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- File-based comment storage ---
const COMMENTS_FILE = path.join(__dirname, 'comments.json');

// Helper: Read comments from file
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

// Helper: Write comments to file
function writeComments(comments) {
  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
  } catch (error) {
    console.error('Error writing comments:', error);
  }
}

// --- Root endpoint ---
app.get('/', (req, res) => {
  res.send('Backend running ✅');
});

// --- Events API ---
// #swagger.tags = ['Events']
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events with categories
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
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
 */
app.get('/api/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`event_id, event_title, start_time, end_time, location, event_categories(category_id, category:categories(category_id, category_name))`)
      .order('start_time', { ascending: true });

    if (error) throw error;

    const eventsWithCategories = (data || []).map(event => {
      let categories = [];
      if (event.event_categories && event.event_categories.length > 0) {
        categories = event.event_categories
          .filter(ec => ec && ec.category)
          .map(ec => ({
            category_id: ec.category.category_id,
            category_name: ec.category.category_name,
          }));
      }
      return { ...event, categories };
    });

    res.json(eventsWithCategories);
  } catch (err) {
    console.error('Supabase fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Categories API ---
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
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
 */
app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('category_id, category_name');

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Supabase fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Comments API (File-based) ---

/**
 * @swagger
 * /api/events/{eventId}/comments:
 *   post:
 *     summary: Add a comment to an event
 *     tags: [Comments]
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
 *               authorName:
 *                 type: string
 *               commentText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
app.post('/api/events/:eventId/comments', (req, res) => {
  try {
    const { eventId } = req.params;
    const { authorName, commentText } = req.body;
    
    if (!authorName || !commentText) {
      return res.status(400).json({ error: 'Author name and comment text are required' });
    }
    
    const comments = readComments();
    const newComment = {
      id: Date.now(), // Simple ID using timestamp
      event_id: parseInt(eventId),
      author_name: authorName,
      comment_text: commentText,
      created_at: new Date().toISOString()
    };
    
    comments.push(newComment);
    writeComments(comments);
    
    res.status(201).json(newComment);
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/events/{eventId}/comments:
 *   get:
 *     summary: Get all comments for an event
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of comments
 */
app.get('/api/events/:eventId/comments', (req, res) => {
  try {
    const { eventId } = req.params;
    const comments = readComments();
    
    // Filter comments for this event and sort by newest first
    const eventComments = comments
      .filter(c => c.event_id === parseInt(eventId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json(eventComments);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 */
app.delete('/api/comments/:commentId', (req, res) => {
  try {
    const { commentId } = req.params;
    let comments = readComments();
    
    // Filter out the comment to delete
    comments = comments.filter(c => c.id !== parseInt(commentId));
    writeComments(comments);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));