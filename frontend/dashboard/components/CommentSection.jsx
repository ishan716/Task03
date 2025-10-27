import React, { useState, useEffect } from 'react';

const CommentSection = ({ eventId }) => {
  const [comments, setComments] = useState([]);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const addComment = async () => {
    if (!authorName.trim() || !commentText.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: authorName.trim(), commentText: commentText.trim() })
      });

      if (response.ok) {
        setAuthorName('');
        setCommentText('');
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

  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setDeletingId(commentId);
    try {
      const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
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

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-blue-900 mb-3">💬 Comments ({comments.length})</h4>
      
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        />
        <textarea
          placeholder="Add your comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          rows="3"
        />
        <button
          onClick={addComment}
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:bg-gray-400 text-sm"
        >
          {loading ? 'Adding...' : '📝 Add Comment'}
        </button>
      </div>

      {comments.length === 0 ? (
        <p className="text-blue-700 text-sm text-center py-3">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-blue-900 text-sm">{comment.author_name}</span>
                <span className="text-xs text-blue-600">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-blue-800 text-sm mb-2">{comment.comment_text}</p>
              
              {/* DELETE BUTTON */}
              <button
                onClick={() => deleteComment(comment.id)}
                disabled={deletingId === comment.id}
                className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded font-medium transition-colors disabled:opacity-50"
              >
                {deletingId === comment.id ? '⏳ Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;