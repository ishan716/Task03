// frontend/dashboard/components/AttendanceSection.jsx
import React, { useState, useEffect } from 'react';
import '../src/App.css';

const AttendanceSection = ({ eventId }) => {
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [attendees, setAttendees] = useState([]);
  const [isAttending, setIsAttending] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch attendance data
  const fetchAttendance = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/attendance`);
      const data = await response.json();
      setAttendanceCount(data.count);
      setAttendees(data.attendees);
      
      // Check if current user is attending (if we have a userName in localStorage)
      const savedUserName = localStorage.getItem('userName');
      if (savedUserName) {
        setUserName(savedUserName);
        const userAttending = data.attendees.some(a => a.user_name === savedUserName);
        setIsAttending(userAttending);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  // Handle attend button click
  const handleAttendClick = () => {
    const savedUserName = localStorage.getItem('userName');
    if (!savedUserName) {
      setShowNameInput(true);
    } else {
      markAttendance(savedUserName);
    }
  };

  // Mark attendance
  const markAttendance = async (name) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/attend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: name }),
      });

      if (response.ok) {
        localStorage.setItem('userName', name);
        setUserName(name);
        setIsAttending(true);
        setShowNameInput(false);
        fetchAttendance(); // Refresh count
      } else {
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

  // Unmark attendance
  const handleUnattend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}/attend`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName }),
      });

      if (response.ok) {
        setIsAttending(false);
        fetchAttendance(); // Refresh count
      }
    } catch (error) {
      console.error('Error removing attendance:', error);
      alert('Failed to remove attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>👥 Attendance</h3>
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

      {!showNameInput ? (
        <div>
          {!isAttending ? (
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

      {attendanceCount > 0 && (
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          <strong>Attendees:</strong> {attendees.map(a => a.user_name).join(', ')}
        </div>
      )}
    </div>
  );
};

export default AttendanceSection;