// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Import components
import UnifiedLogin from './UnifiedLogin';
import EventsScreen from './EventsScreen';
import OrganizerDashboard from './OrganizerDashboard';
import AuthCallback from './AuthCallback';

// Manager components
import EventManager from './organizer/EventManager';
import ExpensesManager from './organizer/ExpensesManager';
import CommitteeManager from './organizer/CommitteeManager';
import NoticesManager from './organizer/NoticesManager';

import './App.css';

// ============================================================================
// SIMPLE ORGANIZER CHECK HOOK
// ============================================================================
function useOrganizerCheck() {
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOrganizerStatus();
  }, []);

  const checkOrganizerStatus = async () => {
    try {
      console.log('🔍 Checking organizer status...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('❌ No session found');
        setIsOrganizer(false);
        setLoading(false);
        return;
      }

      console.log('✅ Session found, checking role for:', session.user.email);

      // Use the API to check organizer status
      const response = await fetch('http://localhost:3000/api/auth/verify-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session.user.email }),
      });

      const result = await response.json();
      
      if (result.success && result.isOrganizer) {
        console.log('✅ User is organizer');
        setIsOrganizer(true);
      } else {
        console.log('❌ User is not organizer');
        setIsOrganizer(false);
      }
      
    } catch (error) {
      console.error('💥 Organizer check error:', error);
      setIsOrganizer(false);
    } finally {
      setLoading(false);
    }
  };

  return { isOrganizer, loading, checkOrganizerStatus };
}

// ============================================================================
// SIMPLE ORGANIZER ROUTE COMPONENT (UPDATED)
// ============================================================================
function OrganizerRoute({ children }) {
  const { isOrganizer, loading } = useOrganizerCheck();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking organizer access...</p>
        </div>
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* Note: You'll need to import AlertCircle from react-icons or use an alternative */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Organizer privileges required.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
}

// ============================================================================
// APP COMPONENT (MAIN) - SIMPLIFIED VERSION
// ============================================================================

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================================================================
  // AUTHENTICATION CHECK ON MOUNT
  // ================================================================

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ================================================================
  // AUTHENTICATION HANDLERS
  // ================================================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/'; // Force reload to clear state
  };

  // ================================================================
  // RENDER
  // ================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ========================================= */}
        {/* UNIFIED LOGIN PAGE (DEFAULT ROUTE)        */}
        {/* ========================================= */}
        
        <Route path="/" element={
          !user ? <UnifiedLogin /> : <Navigate to="/events" replace />
        } />

        {/* ========================================= */}
        {/* AUTH CALLBACK ROUTE                       */}
        {/* ========================================= */}
        
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* ========================================= */}
        {/* USER ROUTES                               */}
        {/* ========================================= */}

        <Route path="/events" element={
          user ? (
            <div className="App">
              <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <h1 className="text-lg font-bold text-gray-800">Event Manager</h1>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>

              <EventsScreen user={user} />
            </div>
          ) : <Navigate to="/" replace />
        } />

        {/* ========================================= */}
        {/* ORGANIZER ROUTES (PROTECTED)              */}
        {/* ========================================= */}

        {/* Organizer Dashboard */}
        <Route path="/organizer/dashboard" element={
          <OrganizerRoute>
            <OrganizerDashboard />
          </OrganizerRoute>
        } />

        {/* Organizer Manager Routes */}
        <Route path="/organizer/events" element={
          <OrganizerRoute>
            <EventManager />
          </OrganizerRoute>
        } />

        <Route path="/organizer/expenses" element={
          <OrganizerRoute>
            <ExpensesManager />
          </OrganizerRoute>
        } />

        <Route path="/organizer/committee" element={
          <OrganizerRoute>
            <CommitteeManager />
          </OrganizerRoute>
        } />

        <Route path="/organizer/notices" element={
          <OrganizerRoute>
            <NoticesManager />
          </OrganizerRoute>
        } />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;