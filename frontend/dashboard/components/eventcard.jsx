// // ============================================================================
// // IMPORTS & DEPENDENCIES
// // ============================================================================

// import React from 'react';  // React library for component creation

// // ============================================================================
// // EVENTCARD COMPONENT
// // ============================================================================
// // Displays a single event in a stylized card format with gradient background

// /**
//  * EventCard Component
//  * Renders a visually appealing card for displaying event information
//  * Features hover animation, gradient background, and event details
//  * @param {Object} props - Component props
//  * @param {Object} props.event - Event data object
//  * @param {string} props.event.image - Event image URL
//  * @param {string} props.event.name - Event name/title
//  * @param {string} props.event.description - Event description
//  * @param {string} props.event.date - Event date
//  */
// const EventCard = ({ event }) => {
//   // ================================================================
//   // RENDER - Event Card UI
//   // ================================================================
  
//   return (
//     <div className="max-w-sm rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 text-white">
//       {/* Event image section - displayed only if image URL exists */}
//       {event.image && (
//         <img 
//           className="w-full h-48 object-cover" 
//           src={event.image} 
//           alt={event.name} 
//         />
//       )}
      
//       {/* Event details section */}
//       <div className="px-6 py-4">
//         {/* Event name/title - displayed with extra emphasis */}
//         <div className="font-extrabold text-2xl mb-2 drop-shadow-lg">
//           {event.name}
//         </div>
        
//         {/* Event description - main content area */}
//         <p className="text-white text-base drop-shadow-md">
//           {event.description}
//         </p>
//       </div>
      
//       {/* Event footer - date and action button */}
//       <div className="px-6 pt-4 pb-4 flex justify-between items-center">
//         {/* Date badge - displayed with white background and purple text */}
//         <span className="bg-white text-purple-700 font-bold px-3 py-1 rounded-full shadow-md">
//           {event.date}
//         </span>
        
//         {/* Details button - action button with hover effects */}
//         <button className="bg-yellow-400 text-purple-800 font-bold px-4 py-2 rounded-full shadow-md hover:bg-yellow-300 hover:scale-105 transition-all duration-200">
//           Details
//         </button>
//       </div>
//     </div>
//   );
// };

// // ============================================================================
// // EXPORT
// // ============================================================================

// export default EventCard;

// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import React, { useState, useEffect } from 'react';

// ============================================================================
// EVENTCARD COMPONENT
// ============================================================================

const EventCard = ({ event }) => {
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  
  // Example 1: Fetch related events
  useEffect(() => {
    const fetchRelatedEvents = async () => {
      try {
        // BEFORE: fetch('http://localhost:3000/api/events/related')
        // AFTER:
        const response = await fetch('https://event-manager-app-jade.vercel.app/api/events/related');
        const data = await response.json();
        setRelatedEvents(data);
      } catch (error) {
        console.error('Error fetching related events:', error);
      }
    };
    
    fetchRelatedEvents();
  }, [event.id]);
  
  // Example 2: Fetch event details
  const fetchEventDetails = async () => {
    try {
      // BEFORE: fetch(`http://localhost:3000/api/events/${event.id}`)
      // AFTER:
      const response = await fetch(`https://event-manager-app-jade.vercel.app/api/events/${event.id}`);
      const data = await response.json();
      setEventDetails(data);
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };
  
  // Example 3: Register for event
  const handleRegister = async () => {
    try {
      // BEFORE: fetch('http://localhost:3000/api/register', { ... })
      // AFTER:
      const response = await fetch('https://event-manager-app-jade.vercel.app/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          userId: 'current-user-id'
        })
      });
      
      if (response.ok) {
        alert('Registered successfully!');
      }
    } catch (error) {
      console.error('Error registering:', error);
    }
  };
  
  // ================================================================
  // RENDER - Event Card UI
  // ================================================================
  
  return (
    <div className="max-w-sm rounded-xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 text-white">
      {event.image && (
        <img 
          className="w-full h-48 object-cover" 
          src={event.image} 
          alt={event.name} 
        />
      )}
      
      <div className="px-6 py-4">
        <div className="font-extrabold text-2xl mb-2 drop-shadow-lg">
          {event.name}
        </div>
        
        <p className="text-white text-base drop-shadow-md">
          {event.description}
        </p>
        
        {/* Show event details if fetched */}
        {eventDetails && (
          <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
            <p className="font-bold">Location: {eventDetails.location}</p>
            <p>Capacity: {eventDetails.capacity}</p>
          </div>
        )}
        
        {/* Show related events count */}
        {relatedEvents.length > 0 && (
          <p className="mt-2 text-sm">
            {relatedEvents.length} related events available
          </p>
        )}
      </div>
      
      <div className="px-6 pt-4 pb-4 flex justify-between items-center">
        <span className="bg-white text-purple-700 font-bold px-3 py-1 rounded-full shadow-md">
          {event.date}
        </span>
        
        <div className="space-x-2">
          <button 
            onClick={fetchEventDetails}
            className="bg-blue-400 text-white font-bold px-4 py-2 rounded-full shadow-md hover:bg-blue-300 hover:scale-105 transition-all duration-200"
          >
            More Info
          </button>
          
          <button 
            onClick={handleRegister}
            className="bg-yellow-400 text-purple-800 font-bold px-4 py-2 rounded-full shadow-md hover:bg-yellow-300 hover:scale-105 transition-all duration-200"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default EventCard;