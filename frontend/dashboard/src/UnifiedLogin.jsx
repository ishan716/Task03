// import { useState } from 'react';
// import { supabase } from './supabaseClient';
// import { Eye, EyeOff, Mail, Lock, User, LogIn } from 'lucide-react';

// const UnifiedLogin = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [loginType, setLoginType] = useState('attendee'); // 'attendee' or 'organizer'
//   const [showSignup, setShowSignup] = useState(false); // Toggle between login/signup for attendees
//   const [showPassword, setShowPassword] = useState(false);

//   // Signup form state
//   const [signupData, setSignupData] = useState({
//     full_name: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });

//   // =========================================
//   // ATTENDEE SIGNUP FUNCTION
//   // =========================================
//   const handleAttendeeSignup = async (e) => {
//     e.preventDefault();
//     setError('');
    
//     // Validation
//     if (!signupData.full_name || !signupData.email || !signupData.password) {
//       setError('All fields are required');
//       return;
//     }
    
//     if (signupData.password.length < 6) {
//       setError('Password must be at least 6 characters');
//       return;
//     }
    
//     if (signupData.password !== signupData.confirmPassword) {
//       setError('Passwords do not match');
//       return;
//     }

//     setLoading(true);

//     try {
//       console.log('🚀 Starting attendee signup...');

//       const response = await fetch('http://localhost:3000/api/auth/register', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           full_name: signupData.full_name.trim(),
//           email: signupData.email.trim(),
//           password: signupData.password
//         }),
//       });

//       const result = await response.json();

//       if (result.success) {
//         console.log('✅ Signup successful');
//         setError('');
//         alert('✅ Registration successful! You can now login with your credentials.');
//         setShowSignup(false); // Switch back to login
//         setEmail(signupData.email); // Pre-fill email
//         setSignupData({
//           full_name: '',
//           email: '',
//           password: '',
//           confirmPassword: ''
//         });
//       } else {
//         setError(result.error || 'Registration failed');
//       }
//     } catch (err) {
//       console.error('💥 Signup error:', err);
//       setError('Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // =========================================
//   // GOOGLE OAUTH LOGIN FOR ATTENDEES
//   // =========================================
//   const handleGoogleLogin = async () => {
//     setError('');
//     setLoading(true);

//     try {
//       console.log('🔐 Starting Google OAuth...');
      
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: `${window.location.origin}/auth/callback`
//         }
//       });

//       if (error) {
//         throw new Error(error.message);
//       }

//       // The redirect will happen automatically
//       console.log('✅ Google OAuth initiated');

//     } catch (err) {
//       console.error('❌ Google OAuth error:', err);
//       setError(err.message || 'Google login failed');
//       setLoading(false);
//     }
//   };

//   // =========================================
//   // ATTENDEE LOGIN WITH EMAIL/PASSWORD
//   // =========================================
//   const handleAttendeeLogin = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email: email.trim(),
//         password: password,
//       });

//       if (error) {
//         throw new Error(error.message);
//       }

//       if (data.user) {
//         console.log('✅ Attendee login successful');
//         window.location.href = '/events';
//       }
//     } catch (err) {
//       setError(err.message || 'Failed to login');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // =========================================
//   // ORGANIZER LOGIN (EMAIL/PASSWORD ONLY)
//   // =========================================
//   const handleOrganizerLogin = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       console.log('🚀 Starting organizer login for:', email);
      
//       // Step 1: Sign in with Supabase
//       const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
//         email: email.trim(),
//         password: password,
//       });

//       if (authError) {
//         console.error('❌ Login error:', authError);
//         throw new Error('Invalid email or password');
//       }

//       console.log('✅ Login successful, checking organizer role...');

//       // Step 2: Verify organizer role via API
//       const apiResponse = await fetch('http://localhost:3000/api/auth/verify-organizer', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ 
//           email: email.trim() 
//         }),
//       });

//       const result = await apiResponse.json();
//       console.log('📊 Organizer verification result:', result);

//       if (result.success && result.isOrganizer) {
//         console.log('🎉 Organizer access granted! Redirecting...');
//         window.location.href = '/organizer/dashboard';
//       } else {
//         console.log('❌ Not an organizer - signing out');
//         await supabase.auth.signOut();
//         throw new Error(result.error || 'Access denied. Organizer role required.');
//       }

//     } catch (err) {
//       console.error('💥 Organizer login failed:', err);
//       setError(err.message || 'Failed to login as organizer');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // =========================================
//   // MAIN SUBMIT HANDLER
//   // =========================================
//   const handleSubmit = (e) => {
//     if (loginType === 'organizer') {
//       handleOrganizerLogin(e);
//     } else {
//       if (showSignup) {
//         handleAttendeeSignup(e);
//       } else {
//         handleAttendeeLogin(e);
//       }
//     }
//   };

//   // =========================================
//   // RENDER
//   // =========================================
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         {/* Header */}
//         <div>
//           <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//             {showSignup ? 'Create Your Account' : 'Sign in to your account'}
//           </h2>
//           <p className="mt-2 text-center text-sm text-gray-600">
//             {showSignup ? 'Join us to explore amazing events' : 'Choose your login type'}
//           </p>
//         </div>

//         {/* Login Type Selector - Only show when not in signup */}
//         {!showSignup && (
//           <div className="flex justify-center space-x-4 mb-6">
//             <button
//               type="button"
//               onClick={() => setLoginType('attendee')}
//               className={`px-4 py-2 rounded-md font-medium ${
//                 loginType === 'attendee'
//                   ? 'bg-blue-600 text-white shadow-md'
//                   : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//               }`}
//             >
//               Attendee
//             </button>
//             <button
//               type="button"
//               onClick={() => setLoginType('organizer')}
//               className={`px-4 py-2 rounded-md font-medium ${
//                 loginType === 'organizer'
//                   ? 'bg-green-600 text-white shadow-md'
//                   : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//               }`}
//             >
//               Organizer
//             </button>
//           </div>
//         )}

//         {/* Google OAuth Button - Only for attendee login */}
//         {loginType === 'attendee' && !showSignup && (
//           <div className="mt-4">
//             <button
//               onClick={handleGoogleLogin}
//               disabled={loading}
//               className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//             >
//               <img className="h-5 w-5" src="https://www.google.com/favicon.ico" alt="Google" />
//               Sign in with Google
//             </button>
            
//             <div className="mt-4 flex items-center">
//               <div className="flex-1 border-t border-gray-300"></div>
//               <div className="px-3 text-sm text-gray-500">or</div>
//               <div className="flex-1 border-t border-gray-300"></div>
//             </div>
//           </div>
//         )}

//         <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
//           {/* Signup Full Name Field */}
//           {showSignup && (
//             <div>
//               <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
//                 Full Name
//               </label>
//               <div className="relative">
//                 <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   id="full_name"
//                   name="full_name"
//                   type="text"
//                   required
//                   className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                   placeholder="Enter your full name"
//                   value={signupData.full_name}
//                   onChange={(e) => setSignupData({...signupData, full_name: e.target.value})}
//                 />
//               </div>
//             </div>
//           )}

//           {/* Email Field */}
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//               Email address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 required
//                 className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                 placeholder="user@example.com"
//                 value={showSignup ? signupData.email : email}
//                 onChange={(e) => 
//                   showSignup 
//                     ? setSignupData({...signupData, email: e.target.value})
//                     : setEmail(e.target.value)
//                 }
//               />
//             </div>
//           </div>

//           {/* Password Field */}
//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//               Password
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 id="password"
//                 name="password"
//                 type={showPassword ? 'text' : 'password'}
//                 autoComplete={showSignup ? 'new-password' : 'current-password'}
//                 required
//                 className="appearance-none rounded-md relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                 placeholder={showSignup ? 'Create password (min. 6 characters)' : 'Enter your password'}
//                 value={showSignup ? signupData.password : password}
//                 onChange={(e) => 
//                   showSignup 
//                     ? setSignupData({...signupData, password: e.target.value})
//                     : setPassword(e.target.value)
//                 }
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//               >
//                 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//               </button>
//             </div>
//           </div>

//           {/* Confirm Password Field (Signup only) */}
//           {showSignup && (
//             <div>
//               <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
//                 Confirm Password
//               </label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   id="confirmPassword"
//                   name="confirmPassword"
//                   type={showPassword ? 'text' : 'password'}
//                   autoComplete="new-password"
//                   required
//                   className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
//                   placeholder="Confirm your password"
//                   value={signupData.confirmPassword}
//                   onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
//                 />
//               </div>
//             </div>
//           )}

//           {/* Error Message */}
//           {error && (
//             <div className="rounded-md bg-red-50 p-4">
//               <div className="text-sm text-red-700">{error}</div>
//             </div>
//           )}

//           {/* Submit Button */}
//           <div>
//             <button
//               type="submit"
//               disabled={loading}
//               className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
//                 loginType === 'organizer'
//                   ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
//                   : showSignup
//                   ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
//                   : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
//               } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
//                 loading ? 'opacity-50 cursor-not-allowed' : ''
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center">
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                   {showSignup ? 'Creating Account...' : 'Signing in...'}
//                 </span>
//               ) : (
//                 <span className="flex items-center">
//                   <LogIn className="w-4 h-4 mr-2" />
//                   {showSignup ? 'Create Account' : `Sign in as ${loginType}`}
//                 </span>
//               )}
//             </button>
//           </div>
//         </form>

//         {/* Switch between Login and Signup */}
//         <div className="text-center">
//           <p className="text-sm text-gray-600">
//             {showSignup ? 'Already have an account? ' : "Don't have an account? "}
//             {loginType === 'attendee' ? (
//               <button
//                 type="button"
//                 onClick={() => setShowSignup(!showSignup)}
//                 className="font-medium text-blue-600 hover:text-blue-500"
//               >
//                 {showSignup ? 'Sign in here' : 'Sign up here'}
//               </button>
//             ) : (
//               <span className="text-gray-500">
//                 Contact admin for organizer account
//               </span>
//             )}
//           </p>
//         </div>

//         {/* Info Box */}
//         <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
//           <p className="text-sm text-blue-700">
//             <strong>Current Mode:</strong> {showSignup ? 'Attendee Signup' : `${loginType} Login`}
//             {loginType === 'organizer' && (
//               <span className="block mt-1 text-xs">
//                 Organizers must use email/password login. Contact support for organizer access.
//               </span>
//             )}
//             {loginType === 'attendee' && !showSignup && (
//               <span className="block mt-1 text-xs">
//                 Attendees can sign up or login with Google or email/password.
//               </span>
//             )}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UnifiedLogin;

import { useState } from 'react';
import { supabase } from './supabaseClient';
import { Eye, EyeOff, Mail, Lock, User, LogIn } from 'lucide-react';

const UnifiedLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('attendee'); // 'attendee' or 'organizer'
  const [showSignup, setShowSignup] = useState(false); // Toggle between login/signup for attendees
  const [showPassword, setShowPassword] = useState(false);

  // Signup form state
  const [signupData, setSignupData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // =========================================
  // ATTENDEE SIGNUP FUNCTION
  // =========================================
  const handleAttendeeSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!signupData.full_name || !signupData.email || !signupData.password) {
      setError('All fields are required');
      return;
    }
    
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Starting attendee signup...');

      const response = await fetch('https://event-manager-app-jade.vercel.app/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: signupData.full_name.trim(),
          email: signupData.email.trim(),
          password: signupData.password
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Signup successful');
        setError('');
        alert('✅ Registration successful! You can now login with your credentials.');
        setShowSignup(false); // Switch back to login
        setEmail(signupData.email); // Pre-fill email
        setSignupData({
          full_name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('💥 Signup error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // GOOGLE OAUTH LOGIN FOR ATTENDEES
  // =========================================
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Starting Google OAuth...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // The redirect will happen automatically
      console.log('✅ Google OAuth initiated');

    } catch (err) {
      console.error('❌ Google OAuth error:', err);
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  // =========================================
  // ATTENDEE LOGIN WITH EMAIL/PASSWORD
  // =========================================
  const handleAttendeeLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('✅ Attendee login successful');
        window.location.href = '/events';
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ORGANIZER LOGIN (EMAIL/PASSWORD ONLY)
  // =========================================
  const handleOrganizerLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🚀 Starting organizer login for:', email);
      
      // Step 1: Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.error('❌ Login error:', authError);
        throw new Error('Invalid email or password');
      }

      console.log('✅ Login successful, checking organizer role...');

      // Step 2: Verify organizer role via API
      const apiResponse = await fetch('https://event-manager-app-jade.vercel.app/api/auth/verify-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim() 
        }),
      });

      const result = await apiResponse.json();
      console.log('📊 Organizer verification result:', result);

      if (result.success && result.isOrganizer) {
        console.log('🎉 Organizer access granted! Redirecting...');
        window.location.href = '/organizer/dashboard';
      } else {
        console.log('❌ Not an organizer - signing out');
        await supabase.auth.signOut();
        throw new Error(result.error || 'Access denied. Organizer role required.');
      }

    } catch (err) {
      console.error('💥 Organizer login failed:', err);
      setError(err.message || 'Failed to login as organizer');
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // MAIN SUBMIT HANDLER
  // =========================================
  const handleSubmit = (e) => {
    if (loginType === 'organizer') {
      handleOrganizerLogin(e);
    } else {
      if (showSignup) {
        handleAttendeeSignup(e);
      } else {
        handleAttendeeLogin(e);
      }
    }
  };

  // =========================================
  // RENDER
  // =========================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showSignup ? 'Create Your Account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showSignup ? 'Join us to explore amazing events' : 'Choose your login type'}
          </p>
        </div>

        {/* Login Type Selector - Only show when not in signup */}
        {!showSignup && (
          <div className="flex justify-center space-x-4 mb-6">
            <button
              type="button"
              onClick={() => setLoginType('attendee')}
              className={`px-4 py-2 rounded-md font-medium ${
                loginType === 'attendee'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Attendee
            </button>
            <button
              type="button"
              onClick={() => setLoginType('organizer')}
              className={`px-4 py-2 rounded-md font-medium ${
                loginType === 'organizer'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Organizer
            </button>
          </div>
        )}

        {/* Google OAuth Button - Only for attendee login */}
        {loginType === 'attendee' && !showSignup && (
          <div className="mt-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <img className="h-5 w-5" src="https://www.google.com/favicon.ico" alt="Google" />
              Sign in with Google
            </button>
            
            <div className="mt-4 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="px-3 text-sm text-gray-500">or</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>
        )}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {/* Signup Full Name Field */}
          {showSignup && (
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                  value={signupData.full_name}
                  onChange={(e) => setSignupData({...signupData, full_name: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="user@example.com"
                value={showSignup ? signupData.email : email}
                onChange={(e) => 
                  showSignup 
                    ? setSignupData({...signupData, email: e.target.value})
                    : setEmail(e.target.value)
                }
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={showSignup ? 'new-password' : 'current-password'}
                required
                className="appearance-none rounded-md relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={showSignup ? 'Create password (min. 6 characters)' : 'Enter your password'}
                value={showSignup ? signupData.password : password}
                onChange={(e) => 
                  showSignup 
                    ? setSignupData({...signupData, password: e.target.value})
                    : setPassword(e.target.value)
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Signup only) */}
          {showSignup && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loginType === 'organizer'
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : showSignup
                  ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {showSignup ? 'Creating Account...' : 'Signing in...'}
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  {showSignup ? 'Create Account' : `Sign in as ${loginType}`}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Switch between Login and Signup */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {showSignup ? 'Already have an account? ' : "Don't have an account? "}
            {loginType === 'attendee' ? (
              <button
                type="button"
                onClick={() => setShowSignup(!showSignup)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {showSignup ? 'Sign in here' : 'Sign up here'}
              </button>
            ) : (
              <span className="text-gray-500">
                Contact admin for organizer account
              </span>
            )}
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Current Mode:</strong> {showSignup ? 'Attendee Signup' : `${loginType} Login`}
            {loginType === 'organizer' && (
              <span className="block mt-1 text-xs">
                Organizers must use email/password login. Contact support for organizer access.
              </span>
            )}
            {loginType === 'attendee' && !showSignup && (
              <span className="block mt-1 text-xs">
                Attendees can sign up or login with Google or email/password.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;