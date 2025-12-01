const express = require('express');
const supabase = require('../db');
const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    console.log('👤 Starting user registration for:', email);

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and full name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email.trim())
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'An account with this email already exists. Please login instead.' 
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          full_name: full_name.trim(),
          role: 'user'
        }
      }
    });

    if (authError) {
      console.log('❌ Auth registration error:', authError);
      return res.status(400).json({ 
        success: false, 
        error: authError.message 
      });
    }

    // Create user record in users table
    if (authData.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: email.trim(),
            full_name: full_name.trim(),
            role: 'user'
          }
        ])
        .select()
        .single();

      if (userError) {
        console.log('❌ User table insertion error:', userError);
        return res.status(400).json({ 
          success: false, 
          error: 'Failed to create user profile. Please try again.' 
        });
      }

      console.log('✅ User profile created successfully');
      return res.status(201).json({
        success: true,
        message: 'Registration successful! You can now login.',
        user: userData
      });
    } else {
      // Email confirmation required
      return res.status(201).json({
        success: true,
        message: 'Please check your email to verify your account before logging in.',
        requiresConfirmation: true
      });
    }

  } catch (error) {
    console.error('💥 Server error during registration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error. Please try again later.' 
    });
  }
});

// Organizer Login Verification
router.post('/verify-organizer', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔍 Verifying organizer status for:', email);

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Check if user exists and is organizer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', email.trim())
      .single();

    if (userError || !userData) {
      console.log('❌ User not found:', userError);
      return res.json({ 
        success: false,
        isOrganizer: false, 
        error: 'User not found. Please check your credentials.' 
      });
    }

    console.log('📊 User role:', userData.role);

    const isOrganizer = userData.role === 'organizer';

    if (isOrganizer) {
      console.log('✅ User is verified organizer');
      return res.json({ 
        success: true,
        isOrganizer: true, 
        message: 'Welcome organizer!',
        user: {
          id: userData.id,
          name: userData.full_name,
          email: userData.email,
          role: userData.role
        }
      });
    } else {
      console.log('❌ User is not organizer');
      return res.json({ 
        success: false,
        isOrganizer: false, 
        error: 'Access denied. Organizer role required.' 
      });
    }

  } catch (error) {
    console.error('💥 Server error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// Simple organizer check (for backward compatibility)
router.post('/check-organizer', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔍 Checking organizer status for:', email);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('email', email.trim())
      .single();

    if (userError || !userData) {
      console.log('❌ User not found:', userError);
      return res.json({ 
        success: false,
        isOrganizer: false, 
        error: 'User not found' 
      });
    }

    const isOrganizer = userData.role === 'organizer';

    if (isOrganizer) {
      console.log('✅ User is organizer');
      res.json({ 
        success: true,
        isOrganizer: true, 
        message: 'Welcome organizer!',
        user: userData 
      });
    } else {
      console.log('❌ User is not organizer');
      res.json({ 
        success: false,
        isOrganizer: false, 
        error: 'Access denied. Organizer role required.' 
      });
    }

  } catch (error) {
    console.error('💥 Server error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

module.exports = router;