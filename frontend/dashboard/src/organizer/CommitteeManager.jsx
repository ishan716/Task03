import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Plus, Edit, Trash2, ArrowLeft, Save, X, Mail, Phone, RefreshCw } from 'lucide-react';

function CommitteeManager() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    member_name: '',
    role: '',
    email: '',
    phone: '',
    responsibilities: ''
  });

  const roleOptions = [
    'President',
    'Vice President',
    'Secretary',
    'Treasurer',
    'Event Coordinator',
    'Marketing Head',
    'Logistics Head',
    'Technical Head',
    'Volunteer Coordinator',
    'Member'
  ];

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

      // Load committee members after successful auth
      loadMembers();
    } catch (error) {
      console.error('Auth check error:', error);
      setError('Authentication failed');
    }
  };

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user) {
        throw new Error('No user session');
      }

      console.log('📋 Loading committee members...');
      
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const response = await fetch('http://localhost:3000/api/organizer/committee', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Committee members loaded:', result.members?.length || 0);
        setMembers(result.members || []);
      } else {
        throw new Error(result.error || 'Failed to load committee members');
      }
    } catch (error) {
      console.error('❌ Error loading committee members:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.member_name || !formData.role) {
      setError('Member name and role are required');
      return;
    }

    try {
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      // Use member_id for update operations
      const url = editingMember 
        ? `http://localhost:3000/api/organizer/committee/${editingMember.member_id}`
        : 'http://localhost:3000/api/organizer/committee';

      const method = editingMember ? 'PUT' : 'POST';

      console.log(`📝 ${editingMember ? 'Updating' : 'Adding'} committee member:`, formData);

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
        console.log(`✅ Member ${editingMember ? 'updated' : 'added'} successfully`);
        alert(editingMember ? 'Member updated successfully!' : 'Member added successfully!');
        resetForm();
        loadMembers();
      } else {
        throw new Error(result.error || 'Failed to save member');
      }
    } catch (error) {
      console.error('❌ Error saving committee member:', error);
      setError(error.message || 'Failed to save member. Please try again.');
    }
  };

  const handleEdit = (member) => {
    console.log('✏️ Editing committee member:', member);
    setEditingMember(member);
    setFormData({
      member_name: member.member_name,
      role: member.role,
      email: member.email || '',
      phone: member.phone || '',
      responsibilities: member.responsibilities || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (member_id) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      console.log('🗑️ Deleting committee member with member_id:', member_id);

      // Updated URL to use member_id
      const response = await fetch(`http://localhost:3000/api/organizer/committee/${member_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Member deleted successfully');
        alert('Member removed successfully!');
        loadMembers();
      } else {
        throw new Error(result.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('❌ Error deleting committee member:', error);
      setError(error.message || 'Failed to remove member. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      member_name: '',
      role: '',
      email: '',
      phone: '',
      responsibilities: ''
    });
    setEditingMember(null);
    setShowForm(false);
    setError('');
  };

  const retryLoad = () => {
    setError('');
    loadMembers();
  };

  // Group members by role
  const membersByRole = members.reduce((acc, member) => {
    if (!acc[member.role]) acc[member.role] = [];
    acc[member.role].push(member);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
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
            <Users className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">Committee Manager</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={retryLoad}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              title="Reload members"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Member
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

        {/* Member Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingMember ? 'Edit Member' : 'Add New Member'}
                  </h2>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Member Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.member_name}
                      onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Role</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="member@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Responsibilities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsibilities
                    </label>
                    <textarea
                      value={formData.responsibilities}
                      onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="3"
                      placeholder="List key responsibilities..."
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      <Save className="w-5 h-5" />
                      {editingMember ? 'Update Member' : 'Add Member'}
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

        {/* Members List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading committee members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No committee members yet</p>
            <p className="text-gray-500 text-sm mt-2">Add your first committee member to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(membersByRole).map(([role, roleMembers]) => (
              <div key={role} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    {roleMembers.length}
                  </span>
                  {role}
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {roleMembers.map((member) => (
                    <div key={member.member_id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-800 text-lg">{member.member_name}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.member_id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {member.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${member.email}`} className="hover:text-purple-600 truncate">
                            {member.email}
                          </a>
                        </div>
                      )}
                      
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${member.phone}`} className="hover:text-purple-600">
                            {member.phone}
                          </a>
                        </div>
                      )}
                      
                      {member.responsibilities && (
                        <p className="text-xs text-gray-500 mt-2 border-t pt-2">
                          {member.responsibilities}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommitteeManager;