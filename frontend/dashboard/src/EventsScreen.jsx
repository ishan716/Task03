// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';

// Import the separated components (REMOVE DUPLICATES!)
import CommentSection from '../components/CommentSection';
import AttendanceSection from '../components/AttendanceSection';
import RatingSection from '../components/RatingSection';

// ============================================================================
// SHAREBUTTON COMPONENT
// ============================================================================
// This component is unique to EventsScreen, so we keep it here

const ShareButton = ({ event, eventId }) => {
  const [showNotification, setShowNotification] = useState(false);

  const handleShare = async () => {
    const shareLink = `${window.location.origin}?eventId=${eventId}&eventTitle=${encodeURIComponent(
      event.title || event.event_title
    )}&location=${encodeURIComponent(event.location || 'No location')}`;

    try {
      await navigator.clipboard.writeText(shareLink);
      setShowNotification(true);
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
      
      {showNotification && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg whitespace-nowrap shadow-lg z-50">
          ✅ Link copied!
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EVENTSSCREEN COMPONENT (MAIN)
// ============================================================================

const EventsScreen = () => {
  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedEvents, setSavedEvents] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(null);

  // Load saved events from cookies
  useEffect(() => {
    const loadSavedEventsFromCookies = () => {
      try {
        const savedEventsCookie = Cookies.get('savedEvents');
        if (savedEventsCookie) {
          const parsedSavedEvents = JSON.parse(savedEventsCookie);
          setSavedEvents(parsedSavedEvents);
        }
      } catch (error) {
        console.error('Error loading events from cookies:', error);
        Cookies.remove('savedEvents');
      }
    };
    loadSavedEventsFromCookies();
  }, []);

  // Extract unique categories
  const categories = Array.from(
    new Set(
      events.flatMap(e => (e.categories || []).map(c => c.category_name)).filter(Boolean)
    )
  );

  // Persist saved events to cookies
  useEffect(() => {
    if (savedEvents.length > 0) {
      Cookies.set('savedEvents', JSON.stringify(savedEvents), { expires: 30 });
    } else {
      Cookies.remove('savedEvents');
    }
  }, [savedEvents]);

  // Fetch events from backend
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

  // Helper functions
  const getEventId = (event) => event.id || event.event_id;// get event's id

  // function to save/remove an event
  const toggleSave = (event) => {
    const eventId = getEventId(event); 
    setSavedEvents((prev) => {  // if the event is already saved, it removes it
      const newSavedEvents = prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId];
      return newSavedEvents;
    });
  };

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

  // Loading and error states
  if (loading) return <p className="p-6 text-center text-gray-600">Loading events...</p>;
  if (error) return <p className="p-6 text-center text-red-600">Error: {error}</p>;

  // Filter events list and returns only the saved ones when showSaved is true
  const displayedEvents = showSaved
    ? events.filter((event) => savedEvents.includes(getEventId(event)))
    : events;

  let filteredEvents = displayedEvents.filter(event => {
    const matchesSearch = searchTerm === "" || (event.title || event.event_title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      (event.categories || []).some(c => selectedCategories.includes(c.category_name));
    return matchesSearch && matchesCategory;
  });

  // Sort events
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
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-10 bg-white shadow-md border-b border-gray-200">
        <div className="p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-3xl font-bold text-gray-800">
              {showSaved ? "❤️ Saved Events" : "📅 Events"}
            </h2>
            
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
              />
              
              {/* Category Filter */}
              <div className="relative">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => setShowCategoryDropdown((prev) => !prev)}
                >
                  {selectedCategories.length > 0 ? `${selectedCategories.join(", ")}` : "Categories"}
                  <span className="ml-2">▼</span>
                </button>
                
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
              
              {/* Toggle Buttons */}
              <button
                onClick={() => setShowSaved(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  !showSaved ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                All Events
              </button>
              
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

      {/* EVENTS GRID */}
      <div className="p-6 pt-4">
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

                  {/* Categories - show as small badges under date/time */}
                  {(event.categories && event.categories.length > 0) ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {event.categories.map((c, idx) => (
                        <span
                          key={c.category_id || c.category_name || idx}
                          className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                        >
                          {c.category_name || c.name || 'Category'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">No category</span>
                    </div>
                  )}

                  

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

                  {/* Action Buttons */}
                  <div className="mt-auto space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Rate Button */}
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

                      {!showSaved && (
                        <>
                          {/* Info Button */}
                          <button
                            className="px-3 py-2 rounded-lg transition-all duration-300 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm border border-blue-200"
                            onClick={() => setExpandedEventId(expandedEventId === eventId ? null : eventId)}
                            title="View comments and attendance"
                          >
                            💬 Info
                          </button>

                          {/* Share Button */}
                          <ShareButton event={event} eventId={eventId} />

                          {/* Save Button */} 
                    
                          <button
                            onClick={() => toggleSave(event)}// this button is shown in every event
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

                      {showSaved && (
                        <button // remove button
                          onClick={() => toggleSave(event)}
                          className="px-3 py-2 rounded-lg transition-all duration-300 bg-red-100 text-red-700 hover:bg-red-200 font-medium text-sm border border-red-300"
                          title="Remove from saved"
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Sections - NOW USING IMPORTED COMPONENTS */}
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
