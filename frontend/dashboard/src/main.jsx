// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import { StrictMode } from 'react'                    // React strict mode for development warnings
import { createRoot } from 'react-dom/client'         // React 18 root API
import './index.css'                                  // Global styles
import App from './App.jsx'                           // Main App component

// ============================================================================
// ROOT INITIALIZATION
// ============================================================================
// Creates React root and renders the application to the DOM

/**
 * Create React Root and Mount Application
 * - Finds the DOM element with id 'root' in index.html
 * - Creates a React root for rendering
 * - Wraps App component in StrictMode for development checks
 * - StrictMode highlights potential problems in the application
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Main application component */}
    <App />
  </StrictMode>,
)

// ============================================================================
// END OF FILE
// ============================================================================
