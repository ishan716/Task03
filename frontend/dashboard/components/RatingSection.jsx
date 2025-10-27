import React, { useState, useEffect } from 'react';

const RatingSection = ({ eventId, eventStatus }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRatings();
  }, [eventId]);

  useEffect(() => {
    if (userName.trim()) {
      checkUserRating();
    }
  }, [userName]);

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

  const checkUserRating = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/events/${eventId}/check-rating/${userName.trim()}`
      );
      const data = await response.json();
      
      setHasRated(data.hasRated);
      setUserRating(data.userRating);
      if (data.hasRated) {
        setSelectedRating(data.userRating);
      }
    } catch (error) {
      console.error('Error checking rating:', error);
    }
  };

  const submitRating = async () => {
    if (!userName.trim()) {
      setMessage('⚠️ Please enter your name');
      return;
    }
    
    if (selectedRating === 0) {
      setMessage('⚠️ Please select a rating');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
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
        fetchRatings();
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

  const isEnded = eventStatus === "Ended";

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
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        ⭐ Event Rating
      </h4>

      {totalRatings > 0 && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-600">
                {averageRating} ⭐
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}
              </div>
            </div>
            {renderStars(Math.round(averageRating))}
          </div>
        </div>
      )}

      {isEnded ? (
        <div className="space-y-3">
          {hasRated ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✅ You rated this event {userRating} star{userRating !== 1 ? 's' : ''}
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                disabled={loading}
              />

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Your rating:</span>
                {renderStars(selectedRating, true)}
              </div>

              <button
                onClick={submitRating}
                disabled={loading || hasRated}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </button>

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
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          ℹ️ You can rate this event after it ends
        </div>
      )}

      {ratings.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Recent Ratings:</h5>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {ratings.slice(0, 5).map((r) => (
              <div key={r.rating_id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm">
                <span className="font-medium text-gray-800">{r.user_name}</span>
                <span className="text-yellow-600">{'⭐'.repeat(r.rating)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingSection;