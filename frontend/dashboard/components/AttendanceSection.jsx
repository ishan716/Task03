// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import React, { useState, useEffect } from 'react'; // React hooks for state and lifecycle
// Note: The original file had a dependency on '../src/App.css', which is a relative path.
// I will remove the potentially incorrect relative import as it's not present in the provided context.

// ============================================================================
// ATTENDANCESECTION COMPONENT
// ============================================================================
// Manages event attendance tracking with mark/unmark functionality

/**
 * AttendanceSection Component
 * Displays event attendance count and allows users to mark themselves as attending
 * Stores user name in localStorage for persistence across page reloads
 * @param {string} eventId - Event identifier for API calls
 */
const AttendanceSection = ({ eventId }) => {
  // ================================================================
  // STATE MANAGEMENT - Attendance Section
  // ================================================================
  
  const [attendanceCount, setAttendanceCount] = useState(0); 	// Total number of attendees
  const [attendees, setAttendees] = useState([]); 	 	 	// List of attendee objects
  const [isAttending, setIsAttending] = useState(false); 	 // Is current user attending?
  const [userName, setUserName] = useState(''); 	 	 	// Current user's name input
  const [showNameInput, setShowNameInput] = useState(false); // Show name input form?
  const [loading, setLoading] = useState(false); 	 	 	// Loading state for operations

  /**
   * Fetch attendance data from backend API
   * Retrieves attendance count and list of attendees
   * Checks if current user is already attending (using localStorage)
   * Calls GET /api/events/:eventId/attendance endpoint
   */
  const fetchAttendance = async () => {
    try {
      // Fetch attendance data from backend
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/attendance`);
      const data = await response.json();
      
      // Update state with fetched data
      setAttendanceCount(data.count);
      setAttendees(data.attendees);
      
      // Check if current user is attending (retrieve from localStorage)
      const savedUserName = localStorage.getItem('userName');
      if (savedUserName) {
        setUserName(savedUserName);
        // Check if this user exists in attendees list
        const userAttending = data.attendees.some(a => a.user_name === savedUserName);
        setIsAttending(userAttending);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  /**
   * Fetch attendance data on component mount
   * Runs once when component is created
   */
  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  /**
   * Handle attend button click
   * Checks if user name exists in localStorage
   * Shows name input form if not, otherwise marks attendance
   */
  const handleAttendClick = () => {
    // Retrieve saved user name from localStorage
    const savedUserName = localStorage.getItem('userName');
    
    if (!savedUserName) {
      // Show name input form if no saved user name
      setShowNameInput(true);
    } else {
      // Mark attendance directly with saved name
      markAttendance(savedUserName);
    }
  };

  /**
   * Marks the current user as attending the event
   * Saves user name to localStorage for future use
   * Calls POST /api/events/:eventId/attend endpoint
   * @param {string} name - User's name to mark as attending
   */
  const markAttendance = async (name) => {
    setLoading(true);
    try {
      // Send POST request to mark attendance
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/attend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: name }),
      });

      if (response.ok) {
        // Success - save name to localStorage for persistence
        localStorage.setItem('userName', name);
        setUserName(name);
        setIsAttending(true);
        setShowNameInput(false);
        // Refresh attendance list
        fetchAttendance();
      } else {
        // Error response from backend
        const error = await response.json();
        alert(error.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Removes the current user's attendance
   * Calls DELETE /api/events/:eventId/attend endpoint
   */
  const handleUnattend = async () => {
    setLoading(true);
    try {
      // Send DELETE request to remove attendance
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/attend`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName }),
      });

      if (response.ok) {
        // Success - update state
        setIsAttending(false);
        // Refresh attendance list
        fetchAttendance();
      }
    } catch (error) {
      console.error('Error removing attendance:', error);
      alert('Failed to remove attendance');
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // RENDER - Attendance Section UI
  // ================================================================

  return (
    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      {/* Header with title and attendance count badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>👥 Attendance</h3>
        {/* Attendance count badge */}
        <span style={{ 
          backgroundColor: '#007bff', 
          color: 'white', 
          padding: '2px 10px', 
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {attendanceCount}
        </span>
      </div>

      {/* Main content - show different UI based on state */}
      {!showNameInput ? (
        <div>
          {/* Show button based on attendance status */}
          {!isAttending ? (
            // User not attending - show mark attendance button
            <button
              onClick={handleAttendClick}
              disabled={loading}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              {loading ? '⏳ Loading...' : '✓ Mark as Attending'}
            </button>
          ) : (
            // User attending - show confirmation and remove button
            <div>
              <p style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '10px' }}>
                ✓ You're attending as {userName}
              </p>
              <button
                onClick={handleUnattend}
                disabled={loading}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? '⏳ Loading...' : '✗ Remove Attendance'}
              </button>
            </div>
          )}
        </div>
      ) : (
        // Name input form - shown when user needs to enter their name
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
          />
          {/* Submit and Cancel buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => markAttendance(userName)}
              disabled={!userName.trim() || loading}
              style={{
                flex: 1,
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '5px',
                cursor: (!userName.trim() || loading) ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {loading ? '⏳ Submitting...' : 'Submit'}
            </button>
            <button
              onClick={() => setShowNameInput(false)}
              style={{
                flex: 1,
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Display list of attendees */}
      {attendanceCount > 0 && (
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          <strong>Attendees:</strong> {attendees.map(a => a.user_name).join(', ')}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default AttendanceSection;