// Import required modules
const express = require('express');               // Framework for creating the server
const cors = require('cors');                     // Middleware for handling CORS
const supabase = require('./db');                 // Supabase client for database operations
const swaggerUi = require('swagger-ui-express');  // Swagger UI for API documentation
const swaggerJsdoc = require('swagger-jsdoc');    // Swagger JSDoc for generating API docs
const fs = require('fs');                         // Node.js module for file system operations
const path = require('path');                     // Node.js module for handling file paths

// Initialize the Express app
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

// --- Start the Server ---
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));