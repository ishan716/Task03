// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import React, { useState, useEffect } from 'react';  // React hooks for state and lifecycle

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
  // ================================================================
  // STATE MANAGEMENT - Rating Section
  // ================================================================
  
  const [ratings, setRatings] = useState([]);            // All ratings for this event
  const [averageRating, setAverageRating] = useState(0); // Average rating score (decimal)
  const [totalRatings, setTotalRatings] = useState(0);   // Total number of ratings
  const [userName, setUserName] = useState('');          // Current user's name input
  const [selectedRating, setSelectedRating] = useState(0);     // Current rating selection (1-5)
  const [hoverRating, setHoverRating] = useState(0);           // Rating highlighted on hover
  const [hasRated, setHasRated] = useState(false);             // Has user already rated?
  const [userRating, setUserRating] = useState(null);          // User's existing rating value
  const [loading, setLoading] = useState(false);               // Loading state for submission
  const [message, setMessage] = useState('');                  // Feedback message to user

  /**
   * Fetch ratings on component mount
   * Runs once when component is created
   */
  useEffect(() => {
    fetchRatings();
  }, [eventId]);

  /**
   * Check user's existing rating when name changes
   * Runs whenever userName state changes
   */
  useEffect(() => {
    if (userName.trim()) {
      checkUserRating();
    }
  }, [userName]);

  /**
   * Fetches all ratings and calculates average from backend
   * Calls GET /api/events/:eventId/rating endpoint
   */
  const fetchRatings = async () => {
    try {
      // Send GET request to fetch ratings data
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/rating`);
      const data = await response.json();
      
      // Update state with fetched data
      setAverageRating(data.averageRating);
      setTotalRatings(data.totalRatings);
      setRatings(data.ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  /**
   * Checks if current user has already rated this event
   * Calls GET /api/events/:eventId/check-rating/:userName endpoint
   */
  const checkUserRating = async () => {
    try {
      // Send GET request to check if user already rated
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/check-rating/${userName.trim()}`
      );
      const data = await response.json();
      
      // Update state with rating status
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
   * Calls POST /api/events/:eventId/rating endpoint
   */
  const submitRating = async () => {
    // Validate user name
    if (!userName.trim()) {
      setMessage('⚠️ Please enter your name');
      return;
    }
    
    // Validate rating selection (1-5)
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
        // Success - show confirmation message
        setMessage('✅ Rating submitted successfully!');
        setHasRated(true);
        setUserRating(selectedRating);
        // Refresh ratings list and average
        fetchRatings();
      } else {
        // Error response from backend
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error submitting rating');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine if event has ended (only then can user rate)
  const isEnded = eventStatus === "Ended";

  /**
   * Renders interactive or static star rating display
   * Stars light up on hover (interactive mode) or show current rating (static mode)
   * @param {number} rating - Current rating value (1-5)
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
            {/* Show filled star if hover or rating is >= current star number */}
            {star <= (hoverRating || rating) ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
  };

  // ================================================================
  // RENDER - Rating Section UI
  // ================================================================

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Header with title */}
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        ⭐ Event Rating
      </h4>

      {/* Display average rating if event has ratings */}
      {totalRatings > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            {/* Average rating score and count */}
            <div>
              <div className="text-3xl font-bold text-yellow-600">
                {averageRating} ⭐
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
              </div>
            </div>
            {/* Visual star representation of average */}
            {renderStars(Math.round(averageRating))}
          </div>
        </div>
      )}

      {/* Rating input section - only available after event ends */}
      {isEnded ? (
        <div className="space-y-3">
          {hasRated ? (
            // Show message if user already rated
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✅ You rated this event {userRating} star{userRating !== 1 ? 's' : ''}
            </div>
          ) : (
            // Show rating form if user hasn't rated yet
            <>
              {/* User name input field */}
              <input
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />

              {/* Interactive star rating selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Your rating:</span>
                {renderStars(selectedRating, true)}
              </div>

              {/* Submit button */}
              <button
                onClick={submitRating}
                disabled={loading || hasRated}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>

              {/* Feedback message for rating submission */}
              {message && (
                <div className={`p-2 rounded-lg text-sm ${
                  message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Show message if event hasn't ended yet
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          ℹ️ You can rate this event after it ends
        </div>
      )}

      {/* Display recent ratings from other users */}
      {ratings.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent Ratings:</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {/* Display up to 5 most recent ratings */}
            {ratings.slice(0, 5).map((r) => (
              <div key={r.rating_id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm">
                <span className="font-medium text-gray-800">{r.user_name}</span>
                {/* Display stars equal to rating value */}
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
// EXPORT
// ============================================================================

export default RatingSection;