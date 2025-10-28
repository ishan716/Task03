// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import React, { useState, useEffect } from 'react';  // React hooks for state and lifecycle

// ============================================================================
// COMMENTSECTION COMPONENT
// ============================================================================
// Manages event comments with create, update, and delete functionality

/**
 * CommentSection Component
 * Displays comments for an event and allows users to add/edit/delete comments
 * Fetches data from backend API
 * @param {string} eventId - Event identifier for API calls
 */
const CommentSection = ({ eventId }) => {
  // ================================================================
  // STATE MANAGEMENT - Comments Section
  // ================================================================
  
  const [comments, setComments] = useState([]);           // All comments for this event
  const [authorName, setAuthorName] = useState('');       // Current user's name
  const [commentText, setCommentText] = useState('');     // Current comment text being typed
  const [loading, setLoading] = useState(false);          // Loading state for add operation
  const [deletingId, setDeletingId] = useState(null);     // ID of comment being deleted
  const [editingId, setEditingId] = useState(null);       // ID of comment being edited
  const [editText, setEditText] = useState('');           // Text content for editing

  /**
   * Fetch comments on component mount
   * Runs once when component is created
   */
  useEffect(() => {
    fetchComments();
  }, [eventId]);

  /**
   * Retrieves all comments for the event from backend API
   * Calls GET /api/events/:eventId/comments endpoint
   */
  const fetchComments = async () => {
    try {
      // Send GET request to fetch all comments for this event
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/comments`);
      const data = await response.json();
      // Update state with fetched comments
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  /**
   * Submits a new comment to the backend
   * Validates input fields before submission
   * Calls POST /api/events/:eventId/comments endpoint
   */
  const addComment = async () => {
    // Validate both fields are filled and not just whitespace
    if (!authorName.trim() || !commentText.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      // Send POST request to create comment
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authorName: authorName.trim(), 
          commentText: commentText.trim() 
        })
      });

      if (response.ok) {
        // Clear form fields on success
        setAuthorName('');
        setCommentText('');
        // Refresh comments list to show new comment
        fetchComments();
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates edit mode for a comment
   * Sets the editing state and populates edit text
   * @param {object} comment - Comment object to edit
   */
  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  /**
   * Cancels edit mode without saving changes
   * Resets editing state
   */
  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  /**
   * Updates a comment with new text
   * Validates input before submission
   * Calls PUT /api/comments/:commentId endpoint
   * @param {string} commentId - ID of comment to update
   */
  const updateComment = async (commentId) => {
    // Validate that edit text is not empty
    if (!editText.trim()) {
      alert('Comment text cannot be empty');
      return;
    }

    try {
      // Send PUT request to update comment
      const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText: editText.trim() })
      });

      if (response.ok) {
        // Exit edit mode
        setEditingId(null);
        setEditText('');
        // Refresh comments list to show updated comment
        fetchComments();
      } else {
        alert('Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Error updating comment');
    }
  };

  /**
   * Deletes a comment after user confirmation
   * Calls DELETE /api/comments/:commentId endpoint
   * @param {string} commentId - ID of comment to delete
   */
  const deleteComment = async (commentId) => {
    // Confirm deletion with user before proceeding
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setDeletingId(commentId);
    try {
      // Send DELETE request to remove comment
      const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Refresh comments list after successful deletion
        fetchComments();
      } else {
        alert('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error deleting comment');
    } finally {
      setDeletingId(null);
    }
  };

  // ================================================================
  // RENDER - Comments Section UI
  // ================================================================

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      {/* Header with title and comment count badge */}
      <h4 className="font-semibold text-blue-900 mb-3">💬 Comments ({comments.length})</h4>
      
      {/* Comment input form */}
      <div className="space-y-2 mb-3">
        {/* Author name input field */}
        <input
          type="text"
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        />
        
        {/* Comment text textarea */}
        <textarea
          placeholder="Add your comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          rows="3"
        />
        
        {/* Submit comment button */}
        <button
          onClick={addComment}
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:bg-gray-400 text-sm"
        >
          {loading ? 'Adding...' : '📝 Add Comment'}
        </button>
      </div>

      {/* Display comments or empty state */}
      {comments.length === 0 ? (
        // Empty state - shown when no comments exist
        <p className="text-blue-700 text-sm text-center py-3">No comments yet. Be the first!</p>
      ) : (
        // Comments list with scrollable container
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-white rounded-lg border border-blue-200">
              {/* Comment header with author name and date */}
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-blue-900 text-sm">{comment.author_name}</span>
                <span className="text-xs text-blue-600">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {/* Conditional rendering: Edit mode or View mode */}
              {editingId === comment.id ? (
                // EDIT MODE - Show textarea and save/cancel buttons
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    {/* Save button */}
                    <button
                      onClick={() => updateComment(comment.id)}
                      className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1 rounded font-medium transition-colors"
                    >
                      ✅ Save
                    </button>
                    {/* Cancel button */}
                    <button
                      onClick={cancelEditing}
                      className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-3 py-1 rounded font-medium transition-colors"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // VIEW MODE - Show comment text and action buttons
                <>
                  {/* Comment text content */}
                  <p className="text-blue-800 text-sm mb-2">{comment.comment_text}</p>
                  
                  {/* Action buttons: Edit and Delete */}
                  <div className="flex gap-2">
                    {/* Edit button */}
                    <button
                      onClick={() => startEditing(comment)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded font-medium transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => deleteComment(comment.id)}
                      disabled={deletingId === comment.id}
                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded font-medium transition-colors disabled:opacity-50"
                    >
                      {deletingId === comment.id ? '⏳ Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default CommentSection;
