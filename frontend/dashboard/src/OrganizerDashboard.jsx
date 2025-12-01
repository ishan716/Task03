import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Calendar, DollarSign, Users, Bell, LogOut, AlertCircle } from 'lucide-react';

function OrganizerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalExpenses: 0,
    committeeMembers: 0,
    activeNotices: 0
  });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      setAuthError('');

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No session found, redirecting to login');
        navigate('/');
        return;
      }

      console.log('🔍 Checking organizer access for:', session.user.email);

      // Verify organizer status with backend
      const response = await fetch('http://localhost:3000/api/auth/verify-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session.user.email })
      });

      const result = await response.json();
      
      if (!result.success || !result.isOrganizer) {
        console.log('❌ User is not organizer, redirecting');
        await supabase.auth.signOut();
        setAuthError('Access denied. Organizer privileges required.');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      console.log('✅ Organizer access verified');
      setUser(session.user);
      loadStats();

    } catch (error) {
      console.error('Auth check error:', error);
      setAuthError('Authentication error. Please try again.');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Load expenses total
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount');
      const expensesTotal = expensesData?.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) || 0;

      // Load committee members count
      const { count: committeeCount } = await supabase
        .from('committee')
        .select('*', { count: 'exact', head: true });

      // Load active notices count
      const { count: noticesCount } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        totalEvents: eventsCount || 0,
        totalExpenses: expensesTotal,
        committeeMembers: committeeCount || 0,
        activeNotices: noticesCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Organizer Dashboard</h1>
              <p className="text-sm text-gray-600">Event Management Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, {user?.email || 'Organizer'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Calendar className="w-8 h-8" />}
            title="Total Events"
            value={stats.totalEvents}
            color="bg-blue-500"
          />
          <StatCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Total Expenses"
            value={`Rs. ${stats.totalExpenses.toLocaleString()}`}
            color="bg-green-500"
          />
          <StatCard
            icon={<Users className="w-8 h-8" />}
            title="Committee Members"
            value={stats.committeeMembers}
            color="bg-purple-500"
          />
          <StatCard
            icon={<Bell className="w-8 h-8" />}
            title="Active Notices"
            value={stats.activeNotices}
            color="bg-pink-500"
          />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard
            icon={<Calendar className="w-12 h-12" />}
            title="Manage Events"
            description="Create and manage events"
            onClick={() => navigate('/organizer/events')}
            color="from-blue-500 to-blue-600"
          />
          <ActionCard
            icon={<DollarSign className="w-12 h-12" />}
            title="Track Expenses"
            description="Monitor event budgets"
            onClick={() => navigate('/organizer/expenses')}
            color="from-green-500 to-green-600"
          />
          <ActionCard
            icon={<Users className="w-12 h-12" />}
            title="Committee"
            description="Manage committee members"
            onClick={() => navigate('/organizer/committee')}
            color="from-purple-500 to-purple-600"
          />
          <ActionCard
            icon={<Bell className="w-12 h-12" />}
            title="Notices"
            description="Post announcements"
            onClick={() => navigate('/organizer/notices')}
            color="from-pink-500 to-pink-600"
          />
        </div>

        {/* Quick Info */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Start Guide</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold mb-2">For New Organizers:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Create events in the Events Manager</li>
                <li>Add committee members to manage events</li>
                <li>Track expenses for each event</li>
                <li>Post notices to communicate with users</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Remember:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Only approved organizers can access this dashboard</li>
                <li>Users cannot self-register as organizers</li>
                <li>Use the logout button to securely exit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex items-center gap-4">
        <div className={`${color} text-white p-3 rounded-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Action Card Component
function ActionCard({ icon, title, description, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${color} text-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all text-left`}
    >
      <div className="flex flex-col gap-3">
        {icon}
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-white/90 text-sm">{description}</p>
      </div>
    </button>
  );
}

export default OrganizerDashboard;