// // ============================================================================
// // IMPORTS & DEPENDENCIES
// // ============================================================================

// import React, { useState, useEffect } from 'react';
// import { supabase } from '../src/supabaseClient';

// // ============================================================================
// // COMMENTSECTION COMPONENT (SECURED)
// // ============================================================================

// /**
//  * CommentSection Component with Authentication
//  * Users can only edit/delete their own comments
//  * Uses Supabase directly for real-time data
//  */
// const CommentSection = ({ eventId, user }) => {
//   // ================================================================
//   // STATE MANAGEMENT
//   // ================================================================
  
//   const [comments, setComments] = useState([]);
//   const [commentText, setCommentText] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [deletingId, setDeletingId] = useState(null);
//   const [editingId, setEditingId] = useState(null);
//   const [editText, setEditText] = useState('');

//   // ================================================================
//   // FETCH COMMENTS
//   // ================================================================

//   useEffect(() => {
//     fetchComments();
//   }, [eventId]);

//   const fetchComments = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('comments')
//         .select('*')
//         .eq('event_id', parseInt(eventId))
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       setComments(data || []);
//     } catch (error) {
//       console.error('Error fetching comments:', error);
//     }
//   };

//   // ================================================================
//   // ADD COMMENT
//   // ================================================================

//   const addComment = async () => {
//     if (!commentText.trim()) {
//       alert('Please write a comment');
//       return;
//     }
    
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from('comments')
//         .insert([
//           {
//             event_id: parseInt(eventId),
//             user_id: user.id,
//             author_name: user.user_metadata?.full_name || user.email,
//             comment_text: commentText.trim()
//           }
//         ])
//         .select();

//       if (error) throw error;

//       setCommentText('');
//       fetchComments();
//     } catch (error) {
//       console.error('Error adding comment:', error);
//       alert('Failed to add comment');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ================================================================
//   // EDIT COMMENT
//   // ================================================================

//   const startEditing = (comment) => {
//     // Check if user owns this comment
//     if (comment.user_id !== user.id) {
//       alert('You can only edit your own comments!');
//       return;
//     }
//     setEditingId(comment.id);
//     setEditText(comment.comment_text);
//   };

//   const cancelEditing = () => {
//     setEditingId(null);
//     setEditText('');
//   };

//   const updateComment = async (commentId) => {
//     if (!editText.trim()) {
//       alert('Comment text cannot be empty');
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('comments')
//         .update({ comment_text: editText.trim() })
//         .eq('id', commentId)
//         .eq('user_id', user.id); // Security: Only update if user owns it

//       if (error) throw error;

//       setEditingId(null);
//       setEditText('');
//       fetchComments();
//     } catch (error) {
//       console.error('Error updating comment:', error);
//       alert('Failed to update comment');
//     }
//   };

//   // ================================================================
//   // DELETE COMMENT
//   // ================================================================

//   const deleteComment = async (commentId) => {
//     if (!window.confirm('Are you sure you want to delete this comment?')) return;

//     setDeletingId(commentId);
//     try {
//       const { error } = await supabase
//         .from('comments')
//         .delete()
//         .eq('id', commentId)
//         .eq('user_id', user.id); // Security: Only delete if user owns it

//       if (error) throw error;
//       fetchComments();
//     } catch (error) {
//       console.error('Error deleting comment:', error);
//       alert('Failed to delete comment');
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // ================================================================
//   // RENDER
//   // ================================================================

//   return (
//     <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
//       <h4 className="font-semibold text-blue-900 mb-3">💬 Comments ({comments.length})</h4>
      
//       {/* Add Comment Form */}
//       <div className="space-y-2 mb-3">
//         <textarea
//           placeholder="Add your comment..."
//           value={commentText}
//           onChange={(e) => setCommentText(e.target.value)}
//           className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//           rows="3"
//         />
        
//         <button
//           onClick={addComment}
//           disabled={loading}
//           className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:bg-gray-400 text-sm"
//         >
//           {loading ? 'Adding...' : '📝 Add Comment'}
//         </button>
//       </div>

//       {/* Comments List */}
//       {comments.length === 0 ? (
//         <p className="text-blue-700 text-sm text-center py-3">No comments yet. Be the first!</p>
//       ) : (
//         <div className="space-y-2 max-h-60 overflow-y-auto">
//           {comments.map((comment) => {
//             const isOwner = comment.user_id === user.id;
            
//             return (
//               <div key={comment.id} className="p-3 bg-white rounded-lg border border-blue-200">
//                 {/* Comment Header */}
//                 <div className="flex justify-between items-start mb-1">
//                   <span className="font-semibold text-blue-900 text-sm">
//                     {comment.author_name}
//                     {isOwner && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">You</span>}
//                   </span>
//                   <span className="text-xs text-blue-600">
//                     {new Date(comment.created_at).toLocaleDateString()}
//                   </span>
//                 </div>
                
//                 {/* Edit Mode or View Mode */}
//                 {editingId === comment.id ? (
//                   <div className="space-y-2">
//                     <textarea
//                       value={editText}
//                       onChange={(e) => setEditText(e.target.value)}
//                       className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//                       rows="3"
//                     />
//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => updateComment(comment.id)}
//                         className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1 rounded font-medium transition-colors"
//                       >
//                         ✅ Save
//                       </button>
//                       <button
//                         onClick={cancelEditing}
//                         className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-3 py-1 rounded font-medium transition-colors"
//                       >
//                         ❌ Cancel
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <>
//                     <p className="text-blue-800 text-sm mb-2">{comment.comment_text}</p>
                    
//                     {/* Only show Edit/Delete for comment owner */}
//                     {isOwner && (
//                       <div className="flex gap-2">
//                         <button
//                           onClick={() => startEditing(comment)}
//                           className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded font-medium transition-colors"
//                         >
//                           ✏️ Edit
//                         </button>
//                         <button
//                           onClick={() => deleteComment(comment.id)}
//                           disabled={deletingId === comment.id}
//                           className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded font-medium transition-colors disabled:opacity-50"
//                         >
//                           {deletingId === comment.id ? '⏳ Deleting...' : '🗑️ Delete'}
//                         </button>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// // ============================================================================
// // EXPORT
// // ============================================================================

// export default CommentSection;

// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../src/supabaseClient';

// ============================================================================
// COMMENTSECTION COMPONENT (SECURED)
// ============================================================================

/**
 * CommentSection Component with Authentication
 * Users can only edit/delete their own comments
 * Uses Supabase directly for real-time data
 */
const CommentSection = ({ eventId, user }) => {
  // ================================================================
  // STATE MANAGEMENT
  // ================================================================
  
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // ================================================================
  // FETCH COMMENTS
  // ================================================================

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('event_id', parseInt(eventId))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // ================================================================
  // ADD COMMENT
  // ================================================================

  const addComment = async () => {
    if (!commentText.trim()) {
      alert('Please write a comment');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            event_id: parseInt(eventId),
            user_id: user.id,
            author_name: user.user_metadata?.full_name || user.email,
            comment_text: commentText.trim()
          }
        ])
        .select();

      if (error) throw error;

      setCommentText('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // EDIT COMMENT
  // ================================================================

  const startEditing = (comment) => {
    // Check if user owns this comment
    if (comment.user_id !== user.id) {
      alert('You can only edit your own comments!');
      return;
    }
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const updateComment = async (commentId) => {
    if (!editText.trim()) {
      alert('Comment text cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .update({ comment_text: editText.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id); // Security: Only update if user owns it

      if (error) throw error;

      setEditingId(null);
      setEditText('');
      fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  // ================================================================
  // DELETE COMMENT
  // ================================================================

  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setDeletingId(commentId);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Security: Only delete if user owns it

      if (error) throw error;
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-blue-900 mb-3">💬 Comments ({comments.length})</h4>
      
      {/* Add Comment Form */}
      <div className="space-y-2 mb-3">
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

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-blue-700 text-sm text-center py-3">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((comment) => {
            const isOwner = comment.user_id === user.id;
            
            return (
              <div key={comment.id} className="p-3 bg-white rounded-lg border border-blue-200">
                {/* Comment Header */}
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-blue-900 text-sm">
                    {comment.author_name}
                    {isOwner && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">You</span>}
                  </span>
                  <span className="text-xs text-blue-600">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Edit Mode or View Mode */}
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows="3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateComment(comment.id)}
                        className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1 rounded font-medium transition-colors"
                      >
                        ✅ Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-3 py-1 rounded font-medium transition-colors"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-blue-800 text-sm mb-2">{comment.comment_text}</p>
                    
                    {/* Only show Edit/Delete for comment owner */}
                    {isOwner && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(comment)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded font-medium transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteComment(comment.id)}
                          disabled={deletingId === comment.id}
                          className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingId === comment.id ? '⏳ Deleting...' : '🗑️ Delete'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default CommentSection;