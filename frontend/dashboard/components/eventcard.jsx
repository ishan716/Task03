// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import React from 'react';  // React library for component creation

// ============================================================================
// EVENTCARD COMPONENT
// ============================================================================
// Displays a single event in a stylized card format with gradient background

/**
 * EventCard Component
 * Renders a visually appealing card for displaying event information
 * Features hover animation, gradient background, and event details
 * @param {Object} props - Component props
 * @param {Object} props.event - Event data object
 * @param {string} props.event.image - Event image URL
 * @param {string} props.event.name - Event name/title
 * @param {string} props.event.description - Event description
 * @param {string} props.event.date - Event date
 */
const EventCard = ({ event }) => {
  // ================================================================
  // RENDER - Event Card UI
  // ================================================================
  
  return (
    <div className="max-w-sm rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 text-white">
      {/* Event image section - displayed only if image URL exists */}
      {event.image && (
        <img 
          className="w-full h-48 object-cover" 
          src={event.image} 
          alt={event.name} 
        />
      )}
      
      {/* Event details section */}
      <div className="px-6 py-4">
        {/* Event name/title - displayed with extra emphasis */}
        <div className="font-extrabold text-2xl mb-2 drop-shadow-lg">
          {event.name}
        </div>
        
        {/* Event description - main content area */}
        <p className="text-white text-base drop-shadow-md">
          {event.description}
        </p>
      </div>
      
      {/* Event footer - date and action button */}
      <div className="px-6 pt-4 pb-4 flex justify-between items-center">
        {/* Date badge - displayed with white background and purple text */}
        <span className="bg-white text-purple-700 font-bold px-3 py-1 rounded-full shadow-md">
          {event.date}
        </span>
        
        {/* Details button - action button with hover effects */}
        <button className="bg-yellow-400 text-purple-800 font-bold px-4 py-2 rounded-full shadow-md hover:bg-yellow-300 hover:scale-105 transition-all duration-200">
          Details
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default EventCard;