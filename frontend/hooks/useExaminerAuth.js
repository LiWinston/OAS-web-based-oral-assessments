import { useAuthStore } from '../store/authStore';
import { useNotification } from './useNotification';

/**
 * Custom hook for examiner authentication
 * Provides standardized access to examiner user data with proper error handling
 * Eliminates the need for hard-coded fallback users
 */
export function useExaminerAuth() {
  const { user } = useAuthStore();
  const { showNotification } = useNotification();

  // Check if user exists and has examiner role
  const isAuthenticated = !!user;
  const isExaminer = user?.role === 'EXAMINER';
  const isValidExaminer = isAuthenticated && isExaminer;

  // Get examiner ID consistently
  const examinerId = user?.id || user?.userId;

  // Error handling for authentication issues
  const handleAuthError = (operation = 'perform this action') => {
    if (!isAuthenticated) {
      showNotification('error', 'Please log in to continue');
      return false;
    }
    
    if (!isExaminer) {
      showNotification('error', 'Access denied: Examiner role required');
      return false;
    }

    if (!examinerId) {
      showNotification('error', 'User ID not available');
      return false;
    }

    return true;
  };

  // Require valid examiner authentication
  const requireAuth = (operation) => {
    const isValid = handleAuthError(operation);
    if (!isValid) {
      throw new Error('Authentication required');
    }
    return true;
  };

  return {
    user,
    examinerId,
    isAuthenticated,
    isExaminer,
    isValidExaminer,
    handleAuthError,
    requireAuth,
  };
}