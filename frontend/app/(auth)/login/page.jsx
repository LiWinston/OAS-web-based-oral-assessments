'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Moon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  // Quick fill function for test accounts
  const fillTestAccount = (email, password) => {
    setValue('email', email);
    setValue('password', password);
    setError(''); // Clear any previous errors
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordDialog(true);
  };

  const onSubmit = async (data) => {
    console.log('📝 Form submitted with data:', data);
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Calling authService.login...');
      const response = await authService.login(data.email, data.password);
      console.log('✅ Login response received:', response);
      console.log('🔍 Response structure:', {
        success: response.success, // This might be undefined if backend doesn't send it
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'N/A',
        hasToken: response.data?.accessToken ? 'Yes' : 'No', // Changed from 'token' to 'accessToken'
        hasUser: response.data?.role ? 'Yes' : 'No', // Check for 'role' as part of user data
        userKeys: response.data ? Object.keys(response.data) : 'N/A' // Backend sends user data directly
      });

      // Check if login was successful - backend returns user data directly on success
      if (response.data && response.data.accessToken) {
        // Backend returned user data directly
        const userData = response.data;
        console.log('🔍 User data received:', userData);

        // Check if we have the required fields
        if (userData.accessToken && userData.role) {
          // Store auth data - adapt to backend format
          const user = {
            id: userData.userId,
            email: userData.email,
            role: userData.role,
            name: userData.username
          };

          login(userData.accessToken, user);

          // Redirect based on user role - support both frontend and backend role formats
          const roleRoutes = {
            // Frontend format
            STUDENT: '/student',
            EXAMINER: '/examiner', 
            COURSE_ADMIN: '/admin',
            SUPER_ADMIN: '/superadmin',
            // Backend format (with ROLE_ prefix)
            ROLE_STUDENT: '/student',
            ROLE_EXAMINER: '/examiner',
            ROLE_COURSE_ADMIN: '/admin',
            ROLE_SUPER_ADMIN: '/superadmin'
          };

          const userRole = userData.role;
          console.log('🔍 Role mapping debug:', {
            userRole: userRole,
            userRoleType: typeof userRole,
            availableRoles: Object.keys(roleRoutes),
            roleRoutes: roleRoutes,
            exactMatch: roleRoutes[userRole],
            fallback: '/student'
          });

          const redirectPath = roleRoutes[userRole] || '/student';
          console.log('🔄 Redirecting to:', redirectPath, 'for role:', userRole);
          router.push(redirectPath);
        } else {
          // Missing required fields
          console.log('❌ Missing required fields in response:', userData);
          setError('Invalid response format from server');
        }
      } else {
        // Login failed - show error message
        console.log('❌ Login failed:', response);
        const errorMessage = response.data || response.message || 'Login failed. Please try again.';
        // Ensure errorMessage is a string
        setError(typeof errorMessage === 'string' ? errorMessage : 'Login failed. Please try again.');
      }

    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 75%, #94a3b8 100%)' 
          : 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 25%, #81d4fa 50%, #4fc3f7 75%, #29b6f6 100%)'
      }}
    >
      {/* Desktop Header */}
      <header className="flex items-center justify-between px-12 py-6">
        <div className="flex items-center">
          <span 
            className="font-extrabold text-4xl text-blue-700 dark:text-blue-300 tracking-wide"
            style={{
              letterSpacing: '0.1em',
              fontFamily: "'Inter', 'Helvetica Neue', Arial, 'sans-serif'",
              fontWeight: 700
            }}
          >
            OAS
          </span>
          <span className="ml-4 text-lg text-blue-600 dark:text-blue-400 font-medium">
            Oral Assessment System
          </span>
        </div>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-2xl focus:outline-none transition-colors"
        >
          <Moon className="w-7 h-7" />
        </button>
      </header>

      {/* Desktop Main Content - Force Desktop Layout */}
      <main className="flex items-center justify-center px-4 lg:px-12 py-8 min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-7xl">
          <div 
            className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-between"
            style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center',
              gap: '4rem',
              minHeight: '600px'
            }}
          >
          {/* Left Side - Welcome Content */}
          <div className="flex flex-col justify-center space-y-8 flex-1">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Welcome to<br/>
                <span className="text-blue-600 dark:text-blue-400">OAS Platform</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                A comprehensive platform for conducting and managing oral assessments in educational institutions.
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                  <span className="text-lg">Streamlined assessment workflows</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                  <span className="text-lg">Real-time collaboration tools</span>
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                  <span className="text-lg">Comprehensive reporting system</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex items-center justify-center flex-1">
            <div 
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 w-full max-w-lg"
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', Arial, 'sans-serif'",
                fontWeight: 400
              }}
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Sign In</h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Access your OAS account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register('email')}
                    disabled={isLoading}
                    className="h-12 text-base"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-base font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register('password')}
                    disabled={isLoading}
                    className="h-12 text-base"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-base text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                >
                  Forgot Password?
                </button>
                <p className="text-sm mt-2">Need help? Contact your administrator for assistance.</p>
              </div>

              {/* Test Accounts for Development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4 text-center">
                    🧪 Development Test Accounts
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => fillTestAccount('admin@example.com', 'Admin123!')}
                      className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-center transition-colors"
                    >
                      <div className="font-medium">Course Admin</div>
                      <div className="text-xs opacity-75">admin@example.com</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillTestAccount('student@example.com', 'Student123!')}
                      className="p-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-center transition-colors"
                    >
                      <div className="font-medium">Student</div>
                      <div className="text-xs opacity-75">student@example.com</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillTestAccount('examiner@example.com', 'Examiner123!')}
                      className="p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-center transition-colors"
                    >
                      <div className="font-medium">Examiner</div>
                      <div className="text-xs opacity-75">examiner@example.com</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillTestAccount('superadmin@example.com', 'Super123!')}
                      className="p-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-lg text-center transition-colors"
                    >
                      <div className="font-medium">Super Admin</div>
                      <div className="text-xs opacity-75">superadmin@example.com</div>
                    </button>
                  </div>
                  <div className="mt-4 text-center">
                    <Link href="/admin/onboarding" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline text-sm">
                      Try Admin Onboarding Flow →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </main>

      {/* Desktop Footer */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
        &copy; 2025 Oral Assessment System. All rights reserved.
      </footer>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <AlertTriangle className="w-6 h-6 text-blue-500" />
              Password Reset Request
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left space-y-4 text-base">
                <p>
                  To reset your password, please contact your course administrator or IT support team.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Password Reset Process:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <li>Contact your course administrator or IT support</li>
                    <li>Provide your student/staff ID and email address</li>
                    <li>Follow the verification process as required</li>
                    <li>Receive your new temporary password via secure channel</li>
                  </ol>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                  <p><strong>For Students:</strong> Contact your course coordinator</p>
                  <p><strong>For Staff:</strong> Contact IT Support or Course Administrator</p>
                  <p><strong>Response Time:</strong> Usually within 24 hours</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowForgotPasswordDialog(false)}
              className="px-6"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.open('mailto:support@oas-system.edu?subject=Password Reset Request&body=Please include your full name, student/staff ID, and email address for password reset.', '_blank');
                setShowForgotPasswordDialog(false);
              }}
              className="bg-blue-500 hover:bg-blue-600 px-6"
            >
              Contact Support
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}