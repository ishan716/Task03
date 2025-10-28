// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import { useState } from 'react'                       // React hook for state management
import Eventcard from "../components/eventcard.jsx";  // Event card component (currently unused)
import EventsScreen from './EventsScreen';            // Main events screen component
import './App.css'                                     // Application styles

// ============================================================================
// APP COMPONENT (MAIN)
// ============================================================================
// Root component that renders the main application UI

/**
 * App Component
 * Main application component that serves as the entry point
 * Renders the EventsScreen component which displays all events
 */
function App() {
  // ================================================================
  // STATE MANAGEMENT
  // ================================================================
  
  const [count, setCount] = useState(0)  // Unused state - can be removed if not needed

  // ================================================================
  // RENDER
  // ================================================================
  
  return(
    <div className="App">
      {/* Application container */}
      
      {/* Page Title - Currently empty (can be customized) */}
      <h1 className="text-3xl font-bold underline">
      </h1>

      {/* Main Events Screen Component */}
      {/* Displays all events with filtering, searching, and interactive features */}
      <EventsScreen/>
    </div>
  )
}

// ============================================================================
// EXPORT
// ============================================================================

export default App

