import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the session from URL fragments (OAuth callback)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Auth callback error:', error);
        navigate('/?error=Authentication failed');
        return;
      }

      if (session) {
        console.log('✅ Google OAuth successful for:', session.user.email);
        
        // For Google OAuth users, we need to create/update their profile
        if (session.user.app_metadata.provider === 'google') {
          try {
            const response = await fetch('http://localhost:3000/api/auth/google-callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ user: session.user }),
            });

            const result = await response.json();
            
            if (!result.success) {
              console.error('❌ Google user profile creation failed:', result.error);
              // Continue anyway - the user can still access the app
            }
          } catch (profileError) {
            console.error('❌ Profile creation error:', profileError);
            // Continue to events page anyway
          }
        }

        console.log('✅ Auth callback successful, redirecting to events...');
        navigate('/events');
      } else {
        navigate('/?error=No session found');
      }
    } catch (err) {
      console.error('💥 Auth callback processing error:', err);
      navigate('/?error=Authentication error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we log you in.</p>
      </div>
    </div>
  );
}

export default AuthCallback;