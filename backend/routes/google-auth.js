const express = require('express');
const supabase = require('../db');
const router = express.Router();

// Handle Google OAuth callback and user creation
router.post('/google-callback', async (req, res) => {
  try {
    const { user } = req.body;

    console.log('🔐 Processing Google OAuth callback for:', user.email);

    if (!user || !user.email) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user data from Google'
      });
    }

    // Check if user already exists in our database
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', user.email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('⚠️ Error checking existing user:', checkError);
    }

    // If user doesn't exist, create a new user record
    if (!existingUser) {
      console.log('👤 Creating new user from Google OAuth...');

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: 'user' // Always set as regular user for Google OAuth
          }
        ])
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating user from Google:', createError);
        
        // If it's a duplicate key error, user might already exist
        if (createError.code === '23505') {
          // Try to fetch the existing user
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
          
          if (existingUser) {
            console.log('✅ User already exists, proceeding with login');
            return res.json({
              success: true,
              user: existingUser,
              message: 'Google login successful'
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          error: 'Failed to create user profile from Google'
        });
      }

      console.log('✅ New user created from Google OAuth:', newUser);
      return res.json({
        success: true,
        user: newUser,
        message: 'Google registration successful'
      });
    }

    // User already exists, just return success
    console.log('✅ Existing user logged in via Google:', existingUser);
    res.json({
      success: true,
      user: existingUser,
      message: 'Google login successful'
    });

  } catch (error) {
    console.error('💥 Google OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during Google authentication'
    });
  }
});

// Check if user is organizer (for Google users)
router.post('/check-google-organizer', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔍 Checking organizer status for Google user:', email);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.log('❌ Google user not found in database:', userError);
      return res.json({ 
        success: false,
        isOrganizer: false, 
        error: 'User not found' 
      });
    }

    console.log('📊 Google user data:', userData);

    const isOrganizer = userData.role === 'organizer';

    if (isOrganizer) {
      console.log('❌ Google user is organizer - redirecting to normal login');
      return res.json({ 
        success: false,
        isOrganizer: true, 
        error: 'Organizers must use email/password login, not Google OAuth'
      });
    }

    // User is not organizer (good for Google OAuth)
    console.log('✅ Google user is regular user - access granted');
    res.json({ 
      success: true,
      isOrganizer: false, 
      message: 'Google login successful for regular user',
      user: userData
    });

  } catch (error) {
    console.error('💥 Google organizer check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

module.exports = router;