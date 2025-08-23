import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

export function useNotification() {
  const showNotification = useCallback((type, message, options = {}) => {
    const defaultOptions = {
      duration: 4000,
      position: 'top-right',
      style: {
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };

    switch (type) {
      case 'success':
        toast.success(message, {
          ...mergedOptions,
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
          style: {
            ...mergedOptions.style,
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
          },
        });
        break;

      case 'error':
        toast.error(message, {
          ...mergedOptions,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
          style: {
            ...mergedOptions.style,
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          },
        });
        break;

      case 'info':
        toast(message, {
          ...mergedOptions,
          icon: '💡',
          style: {
            ...mergedOptions.style,
            background: '#eff6ff',
            color: '#1e40af',
            border: '1px solid #bfdbfe',
          },
        });
        break;

      case 'warning':
        toast(message, {
          ...mergedOptions,
          icon: '⚠️',
          style: {
            ...mergedOptions.style,
            background: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a',
          },
        });
        break;

      case 'loading':
        return toast.loading(message, {
          ...mergedOptions,
          style: {
            ...mergedOptions.style,
            background: '#f3f4f6',
            color: '#374151',
          },
        });

      default:
        toast(message, mergedOptions);
    }
  }, []);

  const dismissNotification = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  const dismissAllNotifications = useCallback(() => {
    toast.dismiss();
  }, []);

  return {
    showNotification,
    dismissNotification,
    dismissAllNotifications,
  };
}