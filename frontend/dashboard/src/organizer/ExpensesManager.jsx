// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../supabaseClient';
// import { DollarSign, Plus, Edit, Trash2, ArrowLeft, Save, X, RefreshCw, Database } from 'lucide-react';

// function ExpensesManager() {
//   const navigate = useNavigate();
//   const [expenses, setExpenses] = useState([]);
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editingExpense, setEditingExpense] = useState(null);
//   const [error, setError] = useState('');
//   const [user, setUser] = useState(null);
//   const [totalExpenses, setTotalExpenses] = useState(0);
  
//   const [formData, setFormData] = useState({
//     event_id: '',
//     expense_category: '',
//     amount: '',
//     description: '',
//     expense_date: new Date().toISOString().split('T')[0]
//   });

//   const expenseCategories = [
//     'Venue',
//     'Catering',
//     'Decoration',
//     'Equipment',
//     'Marketing',
//     'Staff',
//     'Transportation',
//     'Entertainment',
//     'Miscellaneous'
//   ];

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   useEffect(() => {
//     const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
//     setTotalExpenses(total);
//   }, [expenses]);

//   const checkAuth = async () => {
//     try {
//       setError('');
//       const { data: { session } } = await supabase.auth.getSession();
      
//       if (!session) {
//         console.log('❌ No session found');
//         navigate('/');
//         return;
//       }

//       setUser(session.user);
      
//       // Verify organizer status
//       const response = await fetch('http://localhost:3000/api/auth/verify-organizer', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email: session.user.email })
//       });

//       const result = await response.json();
      
//       if (!result.success || !result.isOrganizer) {
//         setError('Organizer access required');
//         return;
//       }

//       // Load expenses and events after successful auth
//       loadExpenses();
//       loadEvents();
//     } catch (error) {
//       console.error('Auth check error:', error);
//       setError('Authentication failed');
//     }
//   };

//   const loadExpenses = async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       if (!user) {
//         throw new Error('No user session');
//       }

//       console.log('💰 Loading expenses...');
      
//       // Get the JWT token from Supabase session
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         throw new Error('No session found');
//       }

//       const token = session.access_token;

//       const response = await fetch('http://localhost:3000/api/organizer/expenses', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
      
//       if (result.success) {
//         console.log('✅ Expenses loaded:', result.expenses?.length || 0);
//         setExpenses(result.expenses || []);
//       } else {
//         // Check if it's a table missing error
//         if (result.error && result.error.includes('does not exist')) {
//           throw new Error('Expenses table not found. Please set up the database first.');
//         }
//         throw new Error(result.error || 'Failed to load expenses');
//       }
//     } catch (error) {
//       console.error('❌ Error loading expenses:', error);
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadEvents = async () => {
//     try {
//       // Get the JWT token from Supabase session
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         throw new Error('No session found');
//       }

//       const token = session.access_token;

//       const response = await fetch('http://localhost:3000/api/organizer/events', {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
      
//       if (result.success) {
//         setEvents(result.events || []);
//       } else {
//         throw new Error(result.error || 'Failed to load events');
//       }
//     } catch (error) {
//       console.error('❌ Error loading events:', error);
//       setError('Failed to load events');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
    
//     if (!formData.event_id || !formData.expense_category || !formData.amount) {
//       setError('Event, category, and amount are required');
//       return;
//     }

//     try {
//       // Get the JWT token from Supabase session
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         throw new Error('No session found');
//       }

//       const token = session.access_token;

//       const url = editingExpense 
//         ? `http://localhost:3000/api/organizer/expenses/${editingExpense.expense_id}`
//         : 'http://localhost:3000/api/organizer/expenses';

//       const method = editingExpense ? 'PUT' : 'POST';

//       const response = await fetch(url, {
//         method: method,
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           ...formData,
//           amount: parseFloat(formData.amount)
//         })
//       });

//       const result = await response.json();

//       if (result.success) {
//         alert(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
//         resetForm();
//         loadExpenses();
//       } else {
//         throw new Error(result.error || 'Failed to save expense');
//       }
//     } catch (error) {
//       console.error('❌ Error saving expense:', error);
//       setError(error.message);
//     }
//   };

//   const handleEdit = (expense) => {
//     setEditingExpense(expense);
//     setFormData({
//       event_id: expense.event_id.toString(),
//       expense_category: expense.expense_category,
//       amount: expense.amount.toString(),
//       description: expense.description || '',
//       expense_date: expense.expense_date
//     });
//     setShowForm(true);
//   };

//   const handleDelete = async (expenseId) => {
//     if (!window.confirm('Are you sure you want to delete this expense?')) return;

//     try {
//       // Get the JWT token from Supabase session
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         throw new Error('No session found');
//       }

//       const token = session.access_token;

//       const response = await fetch(`http://localhost:3000/api/organizer/expenses/${expenseId}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();

//       if (result.success) {
//         alert('Expense deleted successfully!');
//         loadExpenses();
//       } else {
//         throw new Error(result.error || 'Failed to delete expense');
//       }
//     } catch (error) {
//       console.error('❌ Error deleting expense:', error);
//       setError(error.message);
//     }
//   };

//   const setupExpensesTable = async () => {
//     if (!window.confirm('This will set up the expenses table in the database. Continue?')) return;

//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         throw new Error('No session found');
//       }

//       const token = session.access_token;

//       const response = await fetch('http://localhost:3000/api/organizer/setup-expenses', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         }
//       });

//       const result = await response.json();
      
//       if (result.success) {
//         alert('Expenses table created successfully!');
//         loadExpenses();
//       } else {
//         throw new Error(result.error || 'Failed to set up expenses table');
//       }
//     } catch (error) {
//       console.error('❌ Expenses setup error:', error);
//       setError('Failed to set up expenses table: ' + error.message);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       event_id: '',
//       expense_category: '',
//       amount: '',
//       description: '',
//       expense_date: new Date().toISOString().split('T')[0]
//     });
//     setEditingExpense(null);
//     setShowForm(false);
//     setError('');
//   };

//   const retryLoad = () => {
//     setError('');
//     loadExpenses();
//   };

//   // Group expenses by event
//   const expensesByEvent = expenses.reduce((acc, expense) => {
//     const eventId = expense.event_id;
//     const eventTitle = expense.event?.event_title || 'Unknown Event';
    
//     if (!acc[eventId]) {
//       acc[eventId] = {
//         event_title: eventTitle,
//         expenses: [],
//         total: 0
//       };
//     }
//     acc[eventId].expenses.push(expense);
//     acc[eventId].total += parseFloat(expense.amount || 0);
//     return acc;
//   }, {});

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
//       {/* Header */}
//       <div className="bg-white shadow-md">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => navigate('/organizer/dashboard')}
//               className="p-2 hover:bg-gray-100 rounded-lg transition"
//             >
//               <ArrowLeft className="w-5 h-5" />
//             </button>
//             <DollarSign className="w-8 h-8 text-green-600" />
//             <h1 className="text-2xl font-bold text-gray-800">Expenses Tracker</h1>
//           </div>
//           <div className="flex items-center gap-3">
//             <button
//               onClick={retryLoad}
//               className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
//               title="Reload expenses"
//             >
//               <RefreshCw className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => setShowForm(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//             >
//               <Plus className="w-5 h-5" />
//               Add Expense
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-8">
//         {/* Error Display */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//             <div className="flex justify-between items-center">
//               <p className="text-red-700">{error}</p>
//               <div className="flex gap-2">
//                 <button
//                   onClick={retryLoad}
//                   className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
//                 >
//                   <RefreshCw className="w-4 h-4" />
//                   Retry
//                 </button>
//                 {error.includes('does not exist') && (
//                   <button
//                     onClick={setupExpensesTable}
//                     className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
//                   >
//                     <Database className="w-4 h-4" />
//                     Setup Database
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Total Summary */}
//         {expenses.length > 0 && (
//           <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
//             <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Expenses</h2>
//             <p className="text-4xl font-bold text-green-600">
//               Rs. {totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//             </p>
//             <p className="text-sm text-gray-500 mt-1">
//               Across {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
//             </p>
//           </div>
//         )}

//         {/* Expense Form Modal */}
//         {showForm && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
//               <div className="p-6">
//                 <div className="flex justify-between items-center mb-6">
//                   <h2 className="text-2xl font-bold text-gray-800">
//                     {editingExpense ? 'Edit Expense' : 'Add New Expense'}
//                   </h2>
//                   <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
//                     <X className="w-6 h-6" />
//                   </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   {/* Event Selection */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Event *
//                     </label>
//                     <select
//                       value={formData.event_id}
//                       onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                       required
//                     >
//                       <option value="">Select Event</option>
//                       {events.map((event) => (
//                         <option key={event.event_id} value={event.event_id}>
//                           {event.event_title}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Category */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Category *
//                     </label>
//                     <select
//                       value={formData.expense_category}
//                       onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                       required
//                     >
//                       <option value="">Select Category</option>
//                       {expenseCategories.map((cat) => (
//                         <option key={cat} value={cat}>{cat}</option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Amount */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Amount (Rs.) *
//                     </label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       min="0"
//                       value={formData.amount}
//                       onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                       placeholder="0.00"
//                       required
//                     />
//                   </div>

//                   {/* Date */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Date *
//                     </label>
//                     <input
//                       type="date"
//                       value={formData.expense_date}
//                       onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                       required
//                     />
//                   </div>

//                   {/* Description */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Description
//                     </label>
//                     <textarea
//                       value={formData.description}
//                       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                       className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                       rows="3"
//                       placeholder="Enter expense description..."
//                     />
//                   </div>

//                   {/* Submit Buttons */}
//                   <div className="flex gap-3 pt-4">
//                     <button
//                       type="submit"
//                       className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//                     >
//                       <Save className="w-5 h-5" />
//                       {editingExpense ? 'Update Expense' : 'Add Expense'}
//                     </button>
//                     <button
//                       type="button"
//                       onClick={resetForm}
//                       className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Expenses List */}
//         {loading ? (
//           <div className="text-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
//             <p className="text-gray-600 mt-4">Loading expenses...</p>
//           </div>
//         ) : expenses.length === 0 ? (
//           <div className="text-center py-12">
//             <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//             <p className="text-gray-600 text-lg">No expenses recorded yet</p>
//             <p className="text-gray-500 text-sm mt-2">Add your first expense to start tracking</p>
//             {events.length === 0 && (
//               <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
//                 <p className="text-yellow-700 text-sm">
//                   No events found. You need to create events first before adding expenses.
//                 </p>
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {Object.entries(expensesByEvent).map(([eventId, eventData]) => (
//               <div key={eventId} className="bg-white rounded-xl shadow-lg p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-xl font-bold text-gray-800">{eventData.event_title}</h3>
//                   <span className="text-lg font-semibold text-green-600">
//                     Total: Rs. {eventData.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                   </span>
//                 </div>
                
//                 <div className="space-y-3">
//                   {eventData.expenses.map((expense) => (
//                     <div key={expense.expense_id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-3 mb-1">
//                           <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
//                             {expense.expense_category}
//                           </span>
//                           <span className="text-sm text-gray-500">
//                             {new Date(expense.expense_date).toLocaleDateString()}
//                           </span>
//                         </div>
//                         {expense.description && (
//                           <p className="text-sm text-gray-600">{expense.description}</p>
//                         )}
//                       </div>
//                       <div className="flex items-center gap-4">
//                         <span className="text-lg font-bold text-gray-800">
//                           Rs. {parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
//                         </span>
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => handleEdit(expense)}
//                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
//                             title="Edit expense"
//                           >
//                             <Edit className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => handleDelete(expense.expense_id)}
//                             className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
//                             title="Delete expense"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default ExpensesManager;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { DollarSign, Plus, Edit, Trash2, ArrowLeft, Save, X, RefreshCw, Database } from 'lucide-react';

function ExpensesManager() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  const [formData, setFormData] = useState({
    event_id: '',
    expense_category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const expenseCategories = [
    'Venue',
    'Catering',
    'Decoration',
    'Equipment',
    'Marketing',
    'Staff',
    'Transportation',
    'Entertainment',
    'Miscellaneous'
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    setTotalExpenses(total);
  }, [expenses]);

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
      const response = await fetch('https://event-manager-app-jade.vercel.app/api/auth/verify-organizer', {
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

      // Load expenses and events after successful auth
      loadExpenses();
      loadEvents();
    } catch (error) {
      console.error('Auth check error:', error);
      setError('Authentication failed');
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user) {
        throw new Error('No user session');
      }

      console.log('💰 Loading expenses...');
      
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const response = await fetch('https://event-manager-app-jade.vercel.app/api/organizer/expenses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Expenses loaded:', result.expenses?.length || 0);
        setExpenses(result.expenses || []);
      } else {
        // Check if it's a table missing error
        if (result.error && result.error.includes('does not exist')) {
          throw new Error('Expenses table not found. Please set up the database first.');
        }
        throw new Error(result.error || 'Failed to load expenses');
      }
    } catch (error) {
      console.error('❌ Error loading expenses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const response = await fetch('https://event-manager-app-jade.vercel.app/api/organizer/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setEvents(result.events || []);
      } else {
        throw new Error(result.error || 'Failed to load events');
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      setError('Failed to load events');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.event_id || !formData.expense_category || !formData.amount) {
      setError('Event, category, and amount are required');
      return;
    }

    try {
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const url = editingExpense 
        ? `https://event-manager-app-jade.vercel.app/api/organizer/expenses/${editingExpense.expense_id}`
        : 'https://event-manager-app-jade.vercel.app/api/organizer/expenses';

      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
        resetForm();
        loadExpenses();
      } else {
        throw new Error(result.error || 'Failed to save expense');
      }
    } catch (error) {
      console.error('❌ Error saving expense:', error);
      setError(error.message);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      event_id: expense.event_id.toString(),
      expense_category: expense.expense_category,
      amount: expense.amount.toString(),
      description: expense.description || '',
      expense_date: expense.expense_date
    });
    setShowForm(true);
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      // Get the JWT token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const response = await fetch(`https://event-manager-app-jade.vercel.app/api/organizer/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        alert('Expense deleted successfully!');
        loadExpenses();
      } else {
        throw new Error(result.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      setError(error.message);
    }
  };

  const setupExpensesTable = async () => {
    if (!window.confirm('This will set up the expenses table in the database. Continue?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const token = session.access_token;

      const response = await fetch('https://event-manager-app-jade.vercel.app/api/organizer/setup-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Expenses table created successfully!');
        loadExpenses();
      } else {
        throw new Error(result.error || 'Failed to set up expenses table');
      }
    } catch (error) {
      console.error('❌ Expenses setup error:', error);
      setError('Failed to set up expenses table: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      event_id: '',
      expense_category: '',
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
    setShowForm(false);
    setError('');
  };

  const retryLoad = () => {
    setError('');
    loadExpenses();
  };

  // Group expenses by event
  const expensesByEvent = expenses.reduce((acc, expense) => {
    const eventId = expense.event_id;
    const eventTitle = expense.event?.event_title || 'Unknown Event';
    
    if (!acc[eventId]) {
      acc[eventId] = {
        event_title: eventTitle,
        expenses: [],
        total: 0
      };
    }
    acc[eventId].expenses.push(expense);
    acc[eventId].total += parseFloat(expense.amount || 0);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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
            <DollarSign className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">Expenses Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={retryLoad}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              title="Reload expenses"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Expense
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
              <div className="flex gap-2">
                <button
                  onClick={retryLoad}
                  className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
                {error.includes('does not exist') && (
                  <button
                    onClick={setupExpensesTable}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                  >
                    <Database className="w-4 h-4" />
                    Setup Database
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Total Summary */}
        {expenses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Expenses</h2>
            <p className="text-4xl font-bold text-green-600">
              Rs. {totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Across {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Expense Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </h2>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Event Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event *
                    </label>
                    <select
                      value={formData.event_id}
                      onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Event</option>
                      {events.map((event) => (
                        <option key={event.event_id} value={event.event_id}>
                          {event.event_title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.expense_category}
                      onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (Rs.) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows="3"
                      placeholder="Enter expense description..."
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Save className="w-5 h-5" />
                      {editingExpense ? 'Update Expense' : 'Add Expense'}
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

        {/* Expenses List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No expenses recorded yet</p>
            <p className="text-gray-500 text-sm mt-2">Add your first expense to start tracking</p>
            {events.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-700 text-sm">
                  No events found. You need to create events first before adding expenses.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(expensesByEvent).map(([eventId, eventData]) => (
              <div key={eventId} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{eventData.event_title}</h3>
                  <span className="text-lg font-semibold text-green-600">
                    Total: Rs. {eventData.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {eventData.expenses.map((expense) => (
                    <div key={expense.expense_id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            {expense.expense_category}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(expense.expense_date).toLocaleDateString()}
                          </span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-gray-600">{expense.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-800">
                          Rs. {parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit expense"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.expense_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
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

export default ExpensesManager;