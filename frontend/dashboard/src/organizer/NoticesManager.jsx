import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Bell, Plus, Edit, Trash2, ArrowLeft, Save, X, Eye, EyeOff } from 'lucide-react';

function NoticesManager() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  
  const [formData, setFormData] = useState({
    notice_title: '',
    notice_content: '',
    priority: 'normal',
    is_active: true
  });

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' }
  ];

  useEffect(() => {
    checkAuth();
    loadNotices();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/organizer-login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'organizer') {
      navigate('/organizer-login');
    }
  };

  const loadNotices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error loading notices:', error);
      alert('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.notice_title || !formData.notice_content) {
      alert('Please fill in title and content');
      return;
    }

    try {
      if (editingNotice) {
        const { error } = await supabase
          .from('notices')
          .update({
            notice_title: formData.notice_title,
            notice_content: formData.notice_content,
            priority: formData.priority,
            is_active: formData.is_active
          })
          .eq('notice_id', editingNotice.notice_id);

        if (error) throw error;
        alert('Notice updated successfully!');
      } else {
        const { error } = await supabase
          .from('notices')
          .insert([{
            notice_title: formData.notice_title,
            notice_content: formData.notice_content,
            priority: formData.priority,
            is_active: formData.is_active
          }]);

        if (error) throw error;
        alert('Notice created successfully!');
      }

      resetForm();
      loadNotices();
    } catch (error) {
      console.error('Error saving notice:', error);
      alert('Failed to save notice: ' + error.message);
    }
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      notice_title: notice.notice_title,
      notice_content: notice.notice_content,
      priority: notice.priority,
      is_active: notice.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('notice_id', noticeId);

      if (error) throw error;
      
      alert('Notice deleted successfully!');
      loadNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Failed to delete notice');
    }
  };

  const toggleActive = async (notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.is_active })
        .eq('notice_id', notice.notice_id);

      if (error) throw error;
      loadNotices();
    } catch (error) {
      console.error('Error toggling notice:', error);
      alert('Failed to update notice status');
    }
  };

  const resetForm = () => {
    setFormData({
      notice_title: '',
      notice_content: '',
      priority: 'normal',
      is_active: true
    });
    setEditingNotice(null);
    setShowForm(false);
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
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
            <Bell className="w-8 h-8 text-pink-600" />
            <h1 className="text-2xl font-bold text-gray-800">Notices Manager</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Notice
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Notice Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingNotice ? 'Edit Notice' : 'Create New Notice'}
                  </h2>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Notice Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.notice_title}
                      onChange={(e) => setFormData({ ...formData, notice_title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                      placeholder="Enter notice title..."
                      required
                    />
                  </div>

                  {/* Notice Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      value={formData.notice_content}
                      onChange={(e) => setFormData({ ...formData, notice_content: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                      rows="6"
                      placeholder="Enter notice content..."
                      required
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: option.value })}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            formData.priority === option.value
                              ? option.color + ' ring-2 ring-offset-2 ring-pink-500'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Publish immediately (make visible to users)
                    </label>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
                    >
                      <Save className="w-5 h-5" />
                      {editingNotice ? 'Update Notice' : 'Create Notice'}
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

        {/* Notices List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No notices yet. Create your first announcement!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notices.map((notice) => (
              <div
                key={notice.notice_id}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition ${
                  !notice.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{notice.notice_title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notice.priority)}`}>
                        {notice.priority.toUpperCase()}
                      </span>
                      {!notice.is_active && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                          DRAFT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Posted: {new Date(notice.created_at).toLocaleString()}
                    </p>
                    <p className="text-gray-700 whitespace-pre-wrap">{notice.notice_content}</p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleActive(notice)}
                      className={`p-2 rounded-lg transition ${
                        notice.is_active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title={notice.is_active ? 'Unpublish' : 'Publish'}
                    >
                      {notice.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(notice)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(notice.notice_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NoticesManager;