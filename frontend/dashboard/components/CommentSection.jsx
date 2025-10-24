import React, { useState, useEffect } from 'react';

const CommentSection = ({ eventId }) => {
  const [comments, setComments] = useState([]);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!authorName.trim() || !commentText.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, commentText }),
      });

      if (response.ok) {
        setAuthorName('');
        setCommentText('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-lg font-semibold text-gray-800 mb-3">
        💬 Comments ({comments.length})
      </h4>
      
      <form onSubmit={handleAddComment} className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
        />
        <textarea
          placeholder="Add your comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          rows="2"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
        >
          {loading ? 'Adding...' : 'Add Comment'}
        </button>
      </form>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-gray-800 text-sm">{comment.author_name}</span>
                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-gray-700 text-sm mb-2">{comment.comment_text}</p>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                🗑️ Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;