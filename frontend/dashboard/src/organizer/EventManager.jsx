import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Calendar, Plus, Edit, Trash2, ArrowLeft, Save, X, RefreshCw } from 'lucide-react';

function EventManager() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    event_title: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    selectedCategories: []
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('❌ No session found');
        navigate('/');
        return;
      }

      setUser(session.user);
      
      // Verify organizer status
      const response = await fetch('http://localhost:3000/api/auth/verify-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session.user.email })
      });

      const result = await response.json();
      
      if (!result.success || !result.isOrganizer) {
        setError('Organizer access required');
        return;
      }

      // Load events and categories after successful auth
      loadEvents();
      loadCategories();
    } catch (error) {
      console.error('Auth check error:', error);
      setError('Authentication failed');
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user) {
        throw new Error('No user session');
      }

      console.log('📅 Loading events...');
      
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const response = await fetch('http://localhost:3000/api/organizer/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Events loaded:', result.events?.length || 0);
        setEvents(result.events || []);
      } else {
        throw new Error(result.error || 'Failed to load events');
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const response = await fetch('http://localhost:3000/api/organizer/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setCategories(result.categories || []);
      } else {
        throw new Error(result.error || 'Failed to load categories');
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      setError('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.event_title || !formData.start_time || !formData.end_time) {
      setError('Event title, start time, and end time are required');
      return;
    }

    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      setError('End time must be after start time');
      return;
    }

    try {
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const url = editingEvent 
        ? `http://localhost:3000/api/organizer/events/${editingEvent.event_id}`
        : 'http://localhost:3000/api/organizer/events';

      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
        resetForm();
        loadEvents();
      } else {
        throw new Error(result.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('❌ Error saving event:', error);
      setError(error.message);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      event_title: event.event_title,
      start_time: event.start_time ? event.start_time.slice(0, 16) : '',
      end_time: event.end_time ? event.end_time.slice(0, 16) : '',
      location: event.location || '',
      description: event.description || '',
      selectedCategories: event.event_categories?.map(ec => ec.category_id.toString()) || []
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    try {
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const response = await fetch(`http://localhost:3000/api/organizer/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('Event deleted successfully!');
        loadEvents();
      } else {
        throw new Error(result.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      event_title: '',
      start_time: '',
      end_time: '',
      location: '',
      description: '',
      selectedCategories: []
    });
    setEditingEvent(null);
    setShowForm(false);
    setError('');
  };

  const retryLoad = () => {
    setError('');
    loadEvents();
  };

  const toggleCategory = (categoryId) => {
    const categoryIdStr = categoryId.toString();
    setFormData(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryIdStr)
        ? prev.selectedCategories.filter(id => id !== categoryIdStr)
        : [...prev.selectedCategories, categoryIdStr]
    }));
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now >= startDate && now <= endDate) {
      return { label: "On Going", color: "bg-green-100 text-green-700" };
    } else if (now < startDate) {
      return { label: "Up Coming", color: "bg-yellow-100 text-yellow-700" };
    } else {
      return { label: "Ended", color: "bg-red-100 text-red-700" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/organizer/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Events Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={retryLoad}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              title="Reload events"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              New Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-red-700">{error}</p>
              <button
                onClick={retryLoad}
                className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Event Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                  </h2>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Event Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={formData.event_title}
                      onChange={(e) => setFormData({ ...formData, event_title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter event title..."
                      required
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter event location..."
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      placeholder="Enter event description..."
                    />
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categories
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {categories.map((cat) => (
                        <label key={cat.category_id} className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                          <input
                            type="checkbox"
                            checked={formData.selectedCategories.includes(cat.category_id.toString())}
                            onChange={() => toggleCategory(cat.category_id)}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{cat.category_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Save className="w-5 h-5" />
                      {editingEvent ? 'Update Event' : 'Create Event'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No events yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => {
              const status = getEventStatus(event.start_time, event.end_time);
              
              return (
                <div key={event.event_id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{event.event_title}</h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-3">
                        <p className="flex items-center gap-2">
                          <span className="font-semibold">📅 Start:</span> 
                          {formatDateTime(event.start_time)}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-semibold">📅 End:</span> 
                          {formatDateTime(event.end_time)}
                        </p>
                        {event.location && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">📍 Location:</span> 
                            {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-gray-700 mt-2">{event.description}</p>
                        )}
                      </div>
                      
                      {event.event_categories && event.event_categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {event.event_categories.map((ec) => (
                            <span 
                              key={ec.category_id} 
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                            >
                              {ec.category?.category_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit event"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.event_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete event"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventManager;