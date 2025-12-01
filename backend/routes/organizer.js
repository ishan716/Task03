const express = require('express');
const supabase = require('../db');
const router = express.Router();

// Updated Middleware to check if user is organizer
const requireOrganizer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization header required' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Bearer token required' 
      });
    }

    console.log('🔍 Verifying organizer access...');

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('❌ Token verification error:', error);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }

    console.log('✅ Token verified for user:', user.email);

    // Check if user exists in our database and is organizer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, full_name, email')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      console.error('❌ User not found in database:', userError);
      return res.status(403).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    if (userData.role !== 'organizer') {
      console.error('❌ User is not organizer:', userData.role);
      return res.status(403).json({ 
        success: false, 
        error: 'Organizer access required' 
      });
    }

    console.log('✅ Organizer access granted for:', user.email);
    req.user = userData;
    next();
  } catch (error) {
    console.error('💥 Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
};

// Apply organizer middleware to all routes
router.use(requireOrganizer);

// Debug route to check committee data structure
router.get('/committee/debug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('committee')
      .select('*')
      .order('member_id', { ascending: true })
      .limit(5);

    if (error) throw error;
    
    console.log('🔍 Committee table structure:', data.length > 0 ? Object.keys(data[0]) : 'No data');
    
    res.json({
      success: true,
      members: data,
      columns: data.length > 0 ? Object.keys(data[0]) : [],
      message: 'Committee debug information'
    });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Committee management routes - USING CORRECT COLUMN NAMES
router.get('/committee', async (req, res) => {
  try {
    console.log('📋 Fetching committee members...');
    
    const { data, error } = await supabase
      .from('committee')
      .select('*')
      .order('member_id', { ascending: true });  // Changed to member_id

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} committee members`);
    res.json({ 
      success: true, 
      members: data || [] 
    });
  } catch (error) {
    console.error('💥 Error fetching committee:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/committee', async (req, res) => {
  try {
    const { member_name, role, email, phone, responsibilities } = req.body;
    
    console.log('➕ Adding committee member:', { member_name, role, email });
    
    if (!member_name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Member name and role are required'
      });
    }

    const { data, error } = await supabase
      .from('committee')
      .insert([{ 
        member_name: member_name.trim(),
        role: role.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        responsibilities: responsibilities ? responsibilities.trim() : null
      }])
      .select();

    if (error) {
      console.error('❌ Insert error:', error);
      throw error;
    }
    
    console.log('✅ Committee member added successfully');
    res.json({ 
      success: true, 
      member: data[0] 
    });
  } catch (error) {
    console.error('💥 Error adding committee member:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update committee member - USING member_id
router.put('/committee/:member_id', async (req, res) => {  // Changed parameter name
  try {
    const { member_id } = req.params;  // Changed to member_id
    const { member_name, role, email, phone, responsibilities } = req.body;
    
    console.log('✏️ Updating committee member with member_id:', member_id);
    
    const { data, error } = await supabase
      .from('committee')
      .update({ 
        member_name: member_name.trim(),
        role: role.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        responsibilities: responsibilities ? responsibilities.trim() : null,
        created_at: new Date().toISOString()  // Using created_at since no updated_at column
      })
      .eq('member_id', member_id)  // Using member_id
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Committee member not found'
      });
    }
    
    console.log('✅ Committee member updated successfully');
    res.json({ 
      success: true, 
      member: data[0] 
    });
  } catch (error) {
    console.error('💥 Error updating committee member:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete committee member - USING member_id
router.delete('/committee/:member_id', async (req, res) => {  // Changed parameter name
  try {
    const { member_id } = req.params;  // Changed to member_id
    
    console.log('🗑️ Deleting committee member with member_id:', member_id);
    
    const { error } = await supabase
      .from('committee')
      .delete()
      .eq('member_id', member_id);  // Using member_id

    if (error) throw error;
    
    console.log('✅ Committee member deleted successfully');
    res.json({ 
      success: true, 
      message: 'Committee member deleted successfully' 
    });
  } catch (error) {
    console.error('💥 Error deleting committee member:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get committee statistics
router.get('/committee/stats', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('committee')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    
    res.json({
      success: true,
      totalMembers: count || 0
    });
  } catch (error) {
    console.error('💥 Error fetching committee stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug route to check expenses data structure
router.get('/expenses/debug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_id', { ascending: true })
      .limit(5);

    if (error) throw error;
    
    console.log('🔍 Expenses table structure:', data.length > 0 ? Object.keys(data[0]) : 'No data');
    
    res.json({
      success: true,
      expenses: data,
      columns: data.length > 0 ? Object.keys(data[0]) : [],
      message: 'Expenses debug information'
    });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Expenses management routes
router.get('/expenses', async (req, res) => {
  try {
    console.log('💰 Fetching expenses...');
    
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        event:events(event_title, event_id)
      `)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      if (error.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Expenses table does not exist. Please run the setup SQL.'
        });
      }
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} expenses`);
    res.json({ 
      success: true, 
      expenses: data || [] 
    });
  } catch (error) {
    console.error('💥 Error fetching expenses:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const { event_id, expense_category, amount, description, expense_date } = req.body;
    
    console.log('➕ Adding expense:', { event_id, expense_category, amount });
    
    if (!event_id || !expense_category || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Event, category, and amount are required'
      });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ 
        event_id: parseInt(event_id),
        expense_category: expense_category.trim(),
        amount: parseFloat(amount),
        description: description ? description.trim() : null,
        expense_date: expense_date || new Date().toISOString().split('T')[0]
      }])
      .select(`
        *,
        event:events(event_title, event_id)
      `);

    if (error) {
      console.error('❌ Insert error:', error);
      if (error.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Expenses table does not exist. Please run the setup SQL.'
        });
      }
      throw error;
    }
    
    console.log('✅ Expense added successfully');
    res.json({ 
      success: true, 
      expense: data[0] 
    });
  } catch (error) {
    console.error('💥 Error adding expense:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update expense - USING expense_id
router.put('/expenses/:expense_id', async (req, res) => {
  try {
    const { expense_id } = req.params;
    const { event_id, expense_category, amount, description, expense_date } = req.body;
    
    console.log('✏️ Updating expense with expense_id:', expense_id);
    
    const { data, error } = await supabase
      .from('expenses')
      .update({ 
        event_id: parseInt(event_id),
        expense_category: expense_category.trim(),
        amount: parseFloat(amount),
        description: description ? description.trim() : null,
        expense_date: expense_date,
        updated_at: new Date().toISOString()
      })
      .eq('expense_id', expense_id)
      .select(`
        *,
        event:events(event_title, event_id)
      `);

    if (error) {
      if (error.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Expenses table does not exist. Please run the setup SQL.'
        });
      }
      throw error;
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    console.log('✅ Expense updated successfully');
    res.json({ 
      success: true, 
      expense: data[0] 
    });
  } catch (error) {
    console.error('💥 Error updating expense:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete expense - USING expense_id
router.delete('/expenses/:expense_id', async (req, res) => {
  try {
    const { expense_id } = req.params;
    
    console.log('🗑️ Deleting expense with expense_id:', expense_id);
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('expense_id', expense_id);

    if (error) {
      if (error.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Expenses table does not exist. Please run the setup SQL.'
        });
      }
      throw error;
    }
    
    console.log('✅ Expense deleted successfully');
    res.json({ 
      success: true, 
      message: 'Expense deleted successfully' 
    });
  } catch (error) {
    console.error('💥 Error deleting expense:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get expenses statistics
router.get('/expenses/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount');

    if (error) {
      if (error.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Expenses table does not exist. Please run the setup SQL.'
        });
      }
      throw error;
    }
    
    const totalExpenses = data?.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) || 0;
    
    res.json({
      success: true,
      totalExpenses: totalExpenses,
      totalCount: data?.length || 0
    });
  } catch (error) {
    console.error('💥 Error fetching expense stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Setup expenses table route
router.post('/setup-expenses', async (req, res) => {
  try {
    console.log('🛠️ Setting up expenses table...');
    
    // Create expenses table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS expenses (
          expense_id SERIAL PRIMARY KEY,
          event_id INTEGER NOT NULL REFERENCES events(event_id),
          expense_category TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          description TEXT,
          expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
      `
    });

    if (createError) {
      console.error('❌ Expenses setup error:', createError);
      return res.status(500).json({
        success: false,
        error: 'Please run the setup SQL manually in Supabase SQL editor',
        sql: `
          CREATE TABLE IF NOT EXISTS expenses (
            expense_id SERIAL PRIMARY KEY,
            event_id INTEGER NOT NULL REFERENCES events(event_id),
            expense_category TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            description TEXT,
            expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
    }
    
    console.log('✅ Expenses table setup completed');
    res.json({
      success: true,
      message: 'Expenses table created successfully'
    });
  } catch (error) {
    console.error('💥 Expenses setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get events for dropdown
router.get('/events', async (req, res) => {
  try {
    console.log('📅 Fetching events for dropdown...');
    
    const { data, error } = await supabase
      .from('events')
      .select('event_id, event_title')
      .order('event_title');

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} events`);
    res.json({ 
      success: true, 
      events: data || [] 
    });
  } catch (error) {
    console.error('💥 Error fetching events:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;