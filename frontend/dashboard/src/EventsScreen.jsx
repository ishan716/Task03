// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';  // Cookie management library

// ============================================================================
// SHAREBUTTON COMPONENT
// ============================================================================
// Allows users to copy event share links to clipboard with visual feedback

/**
 * ShareButton Component
 * Generates shareable URL with event details and copies to clipboard
 * @param {Object} event - Event data object containing title and location
 * @param {string} eventId - Unique event identifier
 */
const ShareButton = ({ event, eventId }) => {
  const [showNotification, setShowNotification] = useState(false);

  /**
   * Handles share link generation and clipboard copy operation
   * Constructs URL with event parameters and provides user feedback
   */
  const handleShare = async () => {
    // Construct shareable link with event details as URL parameters
    const shareLink = `${window.location.origin}?eventId=${eventId}&eventTitle=${encodeURIComponent(
      event.title || event.event_title
    )}&location=${encodeURIComponent(event.location || 'No location')}`;

    try {
      // Copy link to clipboard
      await navigator.clipboard.writeText(shareLink);
      setShowNotification(true);
      // Hide notification after 2 seconds
      setTimeout(() => setShowNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link to clipboard');
    }
  };

  return (
    <div className="relative w-full">
      <button
        onClick={handleShare}
        className="w-full px-3 py-2 rounded-lg transition-all duration-300 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm"
      >
        🔗 Share
      </button>
      
      {/* Success notification - appears briefly after copying */}
      {showNotification && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg whitespace-nowrap shadow-lg z-50">
          ✅ Link copied!
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMMENTSECTION COMPONENT
// ============================================================================
// Manages event comments with create and delete functionality

/**
 * CommentSection Component
 * Displays comments for an event and allows users to add/delete comments
 * Fetches data from backend API
 * @param {string} eventId - Event identifier for API calls
 */
const CommentSection = ({ eventId }) => {
  // State management
  const [comments, setComments] = useState([]);           // All comments for this event
  const [authorName, setAuthorName] = useState('');       // Current user's name
  const [commentText, setCommentText] = useState('');     // Current comment text
  const [loading, setLoading] = useState(false);          // Loading state for add operation
  const [deletingId, setDeletingId] = useState(null);     // ID of comment being deleted

  /**
   * Fetch comments on component mount
   */
  useEffect(() => {
    fetchComments();
  }, [eventId]);

  /**
   * Retrieves all comments for the event from backend API
   */
  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  /**
   * Submits a new comment to the backend
   * Validates input fields before submission
   */
  const addComment = async () => {
    // Validate both fields are filled
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
        // Clear form on success
        setAuthorName('');
        setCommentText('');
        // Refresh comments list
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
   * Deletes a comment after user confirmation
   * @param {string} commentId - ID of comment to delete
   */
  const deleteComment = async (commentId) => {
    // Confirm deletion with user
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setDeletingId(commentId);
    try {
      // Send DELETE request
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

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-blue-900 mb-3">💬 Comments ({comments.length})</h4>
      
      {/* Comment input form */}
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

      {/* Display comments or empty state */}
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
              
              {/* Delete button for individual comments */}
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

// ============================================================================
// ATTENDANCESECTION COMPONENT
// ============================================================================
// Manages event attendance tracking with add and remove functionality

/**
 * AttendanceSection Component
 * Displays event attendance and allows users to mark themselves as attending
 * Manages attendance count and attendee list
 * @param {string} eventId - Event identifier for API calls
 */
const AttendanceSection = ({ eventId }) => {
  // State management
  const [attendanceCount, setAttendanceCount] = useState(0);   // Total attendees
  const [attendees, setAttendees] = useState([]);              // List of attendees
  const [userName, setUserName] = useState('');                // Current user's name
  const [isAttending, setIsAttending] = useState(false);       // Is user already attending?
  const [loading, setLoading] = useState(false);               // Loading state for operations
  const [message, setMessage] = useState('');                  // Feedback message

  /**
   * Fetch attendance data on component mount
   */
  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  /**
   * Check attendance status when user name changes
   */
  useEffect(() => {
    if (userName.trim()) {
      checkAttendance();
    }
  }, [userName]);

  /**
   * Fetches attendance count and attendees list from backend
   */
  const fetchAttendance = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/attendance`);
      const data = await response.json();
      setAttendanceCount(data.count);
      setAttendees(data.attendees);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  /**
   * Checks if the current user is already marked as attending
   */
  const checkAttendance = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/check-attendance/${userName.trim()}`
      );
      const data = await response.json();
      setIsAttending(data.isAttending);
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  /**
   * Marks the current user as attending the event
   * Validates user input before submission
   */
  const markAttendance = async () => {
    // Validate user name input
    if (!userName.trim()) {
      setMessage('⚠️ Please enter your name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Send POST request to mark attendance
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/attend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName: userName.trim() })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Marked as attending!');
        setIsAttending(true);
        fetchAttendance(); // Refresh list
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error marking attendance');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Removes the current user from event attendance
   */
  const removeAttendance = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Send DELETE request to remove attendance
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/attend`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName: userName.trim() })
        }
      );

      if (response.ok) {
        setMessage('✅ Attendance removed');
        setIsAttending(false);
        fetchAttendance(); // Refresh list
      }
    } catch (error) {
      setMessage('❌ Error removing attendance');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
      <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
        👥 Attendance
        <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">
          {attendanceCount}
        </span>
      </h4>

      {/* Attendance input and action buttons */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
          disabled={loading}
        />

        {/* Show appropriate button based on attendance status */}
        {!isAttending ? (
          <button
            onClick={markAttendance}
            disabled={loading}
            className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:bg-gray-400 text-sm"
          >
            {loading ? 'Processing...' : '✓ Mark as Attending'}
          </button>
        ) : (
          <button
            onClick={removeAttendance}
            disabled={loading}
            className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:bg-gray-400 text-sm"
          >
            {loading ? 'Processing...' : '✗ Remove Attendance'}
          </button>
        )}

        {/* Feedback message for user actions */}
        {message && (
          <div className={`p-2 rounded-lg text-sm ${
            message.includes('✅') ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Display list of attendees */}
      {attendees.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-green-900 mb-2">Attendees:</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {attendees.map((attendee) => (
              <div key={attendee.attendance_id} className="flex items-center gap-2 p-2 bg-white rounded border border-green-200 text-sm">
                <span className="text-green-600 font-bold">✓</span>
                <span className="font-medium text-green-900">{attendee.user_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// RATINGSECTION COMPONENT
// ============================================================================
// Handles event rating submission and display

/**
 * RatingSection Component
 * Allows users to rate events (only after event has ended)
 * Displays average rating and individual user ratings
 * @param {string} eventId - Event identifier for API calls
 * @param {string} eventStatus - Current status of event (Ended, Up Coming, On Going)
 */
const RatingSection = ({ eventId, eventStatus }) => {
  // State management
  const [ratings, setRatings] = useState([]);            // All ratings for event
  const [averageRating, setAverageRating] = useState(0); // Average rating score
  const [totalRatings, setTotalRatings] = useState(0);   // Total number of ratings
  const [userName, setUserName] = useState('');          // Current user's name
  const [selectedRating, setSelectedRating] = useState(0);     // Current rating selection (1-5)
  const [hoverRating, setHoverRating] = useState(0);           // Rating on hover
  const [hasRated, setHasRated] = useState(false);             // Has user already rated?
  const [userRating, setUserRating] = useState(null);          // User's existing rating
  const [loading, setLoading] = useState(false);               // Loading state
  const [message, setMessage] = useState('');                  // Feedback message

  /**
   * Fetch ratings on component mount
   */
  useEffect(() => {
    fetchRatings();
  }, [eventId]);

  /**
   * Check user's existing rating when name changes
   */
  useEffect(() => {
    if (userName.trim()) {
      checkUserRating();
    }
  }, [userName]);

  /**
   * Fetches all ratings and calculates average from backend
   */
  const fetchRatings = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/rating`);
      const data = await response.json();
      
      setAverageRating(data.averageRating);
      setTotalRatings(data.totalRatings);
      setRatings(data.ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  /**
   * Checks if current user has already rated this event
   */
  const checkUserRating = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/check-rating/${userName.trim()}`
      );
      const data = await response.json();
      
      setHasRated(data.hasRated);
      setUserRating(data.userRating);
      // Pre-fill stars if user already rated
      if (data.hasRated) {
        setSelectedRating(data.userRating);
      }
    } catch (error) {
      console.error('Error checking rating:', error);
    }
  };

  /**
   * Submits rating to backend after validation
   */
  const submitRating = async () => {
    // Validate user name
    if (!userName.trim()) {
      setMessage('⚠️ Please enter your name');
      return;
    }
    
    // Validate rating selection
    if (selectedRating === 0) {
      setMessage('⚠️ Please select a rating');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Send POST request to submit rating
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/rating`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: userName.trim(),
            rating: selectedRating
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Rating submitted successfully!');
        setHasRated(true);
        setUserRating(selectedRating);
        fetchRatings(); // Refresh ratings list
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error submitting rating');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine if event has ended
  const isEnded = eventStatus === "Ended";

  /**
   * Renders interactive or static star rating display
   * @param {number} rating - Current rating value
   * @param {boolean} isInteractive - Whether stars are clickable
   * @returns {JSX} Star rating component
   */
  const renderStars = (rating, isInteractive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive || hasRated}
            onClick={() => isInteractive && setSelectedRating(star)}
            onMouseEnter={() => isInteractive && setHoverRating(star)}
            onMouseLeave={() => isInteractive && setHoverRating(0)}
            className={`text-2xl transition-all ${
              isInteractive && !hasRated ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            }`}
          >
            {star <= (hoverRating || rating) ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
      <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
        ⭐ Event Rating
      </h4>

      {/* Display average rating if event has ratings */}
      {totalRatings > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-600">
                {averageRating} ⭐
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
              </div>
            </div>
            {renderStars(Math.round(averageRating))}
          </div>
        </div>
      )}

      {/* Rating input section - only available after event ends */}
      {isEnded ? (
        <div className="space-y-3">
          {hasRated ? (
            <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm font-medium">
              ✅ You rated this event {userRating} star{userRating !== 1 ? 's' : ''}
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm bg-white"
                disabled={loading}
              />

              {/* Interactive star rating */}
              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-yellow-200">
                <span className="text-sm text-yellow-900 font-medium">Your rating:</span>
                {renderStars(selectedRating, true)}
              </div>

              <button
                onClick={submitRating}
                disabled={loading || hasRated}
                className="w-full py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>

              {/* Feedback message for rating submission */}
              {message && (
                <div className={`p-2 rounded-lg text-sm ${
                  message.includes('✅') ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                }`}>
                  {message}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Show message if event hasn't ended yet
        <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg text-orange-800 text-sm font-medium">
          ℹ️ You can rate this event after it ends
        </div>
      )}

      {/* Display recent ratings from other users */}
      {ratings.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-yellow-900 mb-2">Recent Ratings:</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {ratings.slice(0, 5).map((r) => (
              <div key={r.rating_id} className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200 text-sm">
                <span className="font-medium text-yellow-900">{r.user_name}</span>
                <span className="text-yellow-600">{'⭐'.repeat(r.rating)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EVENTSSCREEN COMPONENT (MAIN)
// ============================================================================
// Main component that displays events list with filtering, searching, and saving

/**
 * EventsScreen Component
 * Displays list of events with filtering, searching, and saving capabilities
 * Integrates all sub-components for comments, attendance, and ratings
 */
const EventsScreen = () => {
  // State management
  const [events, setEvents] = useState([]);                    // All events from API
  const [loading, setLoading] = useState(true);                // Initial data loading
  const [error, setError] = useState(null);                    // Error messages
  const [savedEvents, setSavedEvents] = useState([]);          // Saved event IDs
  const [showSaved, setShowSaved] = useState(false);           // Toggle saved view
  const [searchTerm, setSearchTerm] = useState("");             // Search filter
  const [selectedCategories, setSelectedCategories] = useState([]); // Category filters
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // Dropdown toggle
  const [expandedEventId, setExpandedEventId] = useState(null); // Expanded event for details
  const [showRatingModal, setShowRatingModal] = useState(null); // Expanded rating section

  /**
   * Load saved events from browser cookies on component mount
   */
  useEffect(() => {
    const loadSavedEventsFromCookies = () => {
      try {
        // Retrieve saved events from cookies
        const savedEventsCookie = Cookies.get('savedEvents');
        if (savedEventsCookie) {
          const parsedSavedEvents = JSON.parse(savedEventsCookie);
          setSavedEvents(parsedSavedEvents);
        }
      } catch (error) {
        console.error('Error loading events from cookies:', error);
        // Remove corrupted cookie
        Cookies.remove('savedEvents');
      }
    };
    loadSavedEventsFromCookies();
  }, []);

  /**
   * Extract unique categories from all events
   */
  const categories = Array.from(
    new Set(
      events.flatMap(e => (e.categories || []).map(c => c.category_name)).filter(Boolean)
    )
  );

  /**
   * Persist saved events to cookies whenever they change
   * Cookies expire after 30 days
   */
  useEffect(() => {
    if (savedEvents.length > 0) {
      Cookies.set('savedEvents', JSON.stringify(savedEvents), { expires: 30 });
    } else {
      Cookies.remove('savedEvents');
    }
  }, [savedEvents]);

  /**
   * Fetch all events from backend API on component mount
   */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/events");
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  /**
   * Safely retrieves event ID from event object
   * Handles both 'id' and 'event_id' property names
   * @param {Object} event - Event data object
   * @returns {string} Event ID
   */
  const getEventId = (event) => event.id || event.event_id;

  /**
   * Toggles event save/unsave status
   * Updates state and persists to cookies
   * @param {Object} event - Event to toggle
   */
  const toggleSave = (event) => {
    const eventId = getEventId(event);
    setSavedEvents((prev) => {
      const newSavedEvents = prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId];
      return newSavedEvents;
    });
  };

  /**
   * Formats date string to locale-specific readable format
   * Includes date, month, year, hour, and minute
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date and time (e.g., "January 28, 2025, 02:30 PM")
   */
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Determines event status based on current time and event dates
   * Compares current time with start_time and end_time
   * @param {string} start - Event start time (ISO format)
   * @param {string} end - Event end time (ISO format)
   * @returns {Object} Status object with label and color classes
   * Status types: "On Going" (green), "Up Coming" (yellow), "Ended" (red)
   */
  const getEventStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now >= startDate && now <= endDate) {
      return { label: "On Going", color: "bg-green-100 text-green-700" };
    } else if (now < startDate) {
      return { label: "Up Coming", color: "bg-yellow-100 text-yellow-700" };
    } else {
      return { label: "Ended", color: "bg-red-100 text-red-700" };
    }
  };

  // Show loading state
  if (loading) return <p className="p-6 text-center text-gray-600">Loading events...</p>;
  
  // Show error state
  if (error) return <p className="p-6 text-center text-red-600">Error: {error}</p>;

  // Filter events based on saved/all toggle
  const displayedEvents = showSaved
    ? events.filter((event) => savedEvents.includes(getEventId(event)))
    : events;

  // Apply search and category filters
  let filteredEvents = displayedEvents.filter(event => {
    // Search by event title
    const matchesSearch = searchTerm === "" || (event.title || event.event_title || "").toLowerCase().includes(searchTerm.toLowerCase());
    // Filter by selected categories
    const matchesCategory =
      selectedCategories.length === 0 ||
      (event.categories || []).some(c => selectedCategories.includes(c.category_name));
    return matchesSearch && matchesCategory;
  });

  // Sort events by status priority, then by date
  const statusOrder = { "On Going": 0, "Up Coming": 1, "Ended": 2 };
  filteredEvents = filteredEvents.sort((a, b) => {
    const statusA = getEventStatus(a.start_time, a.end_time).label;
    const statusB = getEventStatus(b.start_time, b.end_time).label;
    if (statusA === statusB) {
      return new Date(a.start_time) - new Date(b.start_time);
    }
    return statusOrder[statusA] - statusOrder[statusB];
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ================================================================ */}
      {/* STICKY HEADER - Search, Filter, and Toggle Controls             */}
      {/* ================================================================ */}
      <div className="sticky top-0 z-10 bg-white shadow-md border-b border-gray-200">
        <div className="p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Header Title */}
            <h2 className="text-3xl font-bold text-gray-800">
              {showSaved ? "❤️ Saved Events" : "📅 Events"}
            </h2>
            
            {/* Search, Filter, and Toggle Controls */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              {/* Search input field */}
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
              />
              
              {/* Category filter dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => setShowCategoryDropdown((prev) => !prev)}
                >
                  {selectedCategories.length > 0 ? `${selectedCategories.join(", ")}` : "Categories"}
                  <span className="ml-2">▼</span>
                </button>
                
                {/* Dropdown menu for categories */}
                {showCategoryDropdown && (
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                    {categories.map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center px-2 py-2 cursor-pointer rounded-lg hover:bg-blue-50 transition-all duration-150"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedCategories(prev => [...prev, cat]);
                            } else {
                              setSelectedCategories(prev => prev.filter(c => c !== cat));
                            }
                          }}
                          className="mr-2 accent-blue-600"
                        />
                        <span className={selectedCategories.includes(cat) ? "font-bold text-blue-700" : "text-gray-800"}>{cat}</span>
                      </label>
                    ))}
                    
                    {/* Close dropdown button */}
                    <div className="flex justify-end mt-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all duration-150"
                        onClick={() => setShowCategoryDropdown(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* All Events toggle button */}
              <button
                onClick={() => setShowSaved(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  !showSaved ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                All Events
              </button>
              
              {/* Saved Events toggle button */}
              <button
                onClick={() => setShowSaved(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  showSaved ? "bg-red-600 text-white shadow-md" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Saved ({savedEvents.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* EVENTS GRID - Main Content Area                                  */}
      {/* ================================================================ */}
      <div className="p-6 pt-4">
        {/* Empty state message */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {searchTerm
                ? `No events found for "${searchTerm}"`
                : showSaved
                  ? "No saved events yet"
                  : "No events scheduled"}
            </p>
          </div>
        ) : (
          // Events grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const eventId = getEventId(event);
              const status = getEventStatus(event.start_time, event.end_time);

              return (
                <div
                  key={eventId}
                  className="bg-white border rounded-xl p-5 shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:border-blue-300 flex flex-col h-full"
                >
                  {/* Event Title */}
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    {event.title || event.event_title || "Untitled Event"}
                  </h3>

                  {/* Date and Time */}
                  <p className="text-gray-600 text-sm mb-2">
                    📅 {formatDate(event.start_time)}
                    {event.end_time && ` - ${formatDate(event.end_time)}`}
                  </p>

                  {/* Location */}
                  <p className="text-gray-600 text-sm mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location || "No location"}
                  </p>

                  {/* Status Badge */}
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4 w-fit ${status.color}`}>
                    {status.label}
                  </span>

                  {/* Action Buttons - Grid Layout */}
                  <div className="mt-auto space-y-2">
                    {/* First Row - Rating Button */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowRatingModal(showRatingModal === eventId ? null : eventId)}
                        className={`px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm whitespace-nowrap ${
                          status.label === "Ended"
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        }`}
                        disabled={status.label !== "Ended"}
                        title={status.label !== "Ended" ? "Available after event ends" : "Click to rate"}
                      >
                        ⭐ Rate
                      </button>

                      {/* Action buttons - varies based on saved status */}
                      {!showSaved && (
                        <>
                          {/* Info button - expands comments and attendance */}
                          <button
                            className="px-3 py-2 rounded-lg transition-all duration-300 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm border border-blue-200"
                            onClick={() => setExpandedEventId(expandedEventId === eventId ? null : eventId)}
                            title="View comments and attendance"
                          >
                            💬 Info
                          </button>

                          {/* Share button */}
                          <ShareButton event={event} eventId={eventId} />

                          {/* Save/Remove button */}
                          <button
                            onClick={() => toggleSave(event)}
                            className={`px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm border ${
                              savedEvents.includes(eventId)
                                ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
                                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            }`}
                            title={savedEvents.includes(eventId) ? "Click to remove" : "Click to save"}
                          >
                            ❤️ {savedEvents.includes(eventId) ? "Saved" : "Save"}
                          </button>
                        </>
                      )}

                      {/* Show remove button in saved view */}
                      {showSaved && (
                        <button
                          onClick={() => toggleSave(event)}
                          className="px-3 py-2 rounded-lg transition-all duration-300 bg-red-100 text-red-700 hover:bg-red-200 font-medium text-sm border border-red-300"
                          title="Remove from saved"
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Sections - Rating, Attendance, Comments */}
                  {showRatingModal === eventId && (
                    <RatingSection eventId={eventId} eventStatus={status.label} />
                  )}
                  
                  {expandedEventId === eventId && (
                    <>
                      <AttendanceSection eventId={eventId} />
                      <CommentSection eventId={eventId} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsScreen;