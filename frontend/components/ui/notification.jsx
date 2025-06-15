'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Notification component
export function Notification({ 
  id,
  type = NOTIFICATION_TYPES.INFO, 
  title, 
  message, 
  duration = 5000,
  onClose,
  actions = []
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  };

  const getNotificationStyles = () => {
    const baseStyles = "relative flex items-start p-4 rounded-lg shadow-lg border max-w-sm transition-all duration-300 transform";
    
    const typeStyles = {
      [NOTIFICATION_TYPES.SUCCESS]: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
      [NOTIFICATION_TYPES.ERROR]: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
      [NOTIFICATION_TYPES.WARNING]: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
      [NOTIFICATION_TYPES.INFO]: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
    };

    const animationStyles = isExiting 
      ? "opacity-0 translate-x-full scale-95" 
      : isVisible 
        ? "opacity-100 translate-x-0 scale-100" 
        : "opacity-0 translate-x-full scale-95";

    return `${baseStyles} ${typeStyles[type]} ${animationStyles}`;
  };

  const getIcon = () => {
    const iconMap = {
      [NOTIFICATION_TYPES.SUCCESS]: "fas fa-check-circle text-green-500",
      [NOTIFICATION_TYPES.ERROR]: "fas fa-exclamation-circle text-red-500", 
      [NOTIFICATION_TYPES.WARNING]: "fas fa-exclamation-triangle text-yellow-500",
      [NOTIFICATION_TYPES.INFO]: "fas fa-info-circle text-blue-500"
    };
    return iconMap[type];
  };

  return (
    <div className={getNotificationStyles()}>
      {/* Icon */}
      <div className="flex-shrink-0 mr-3 mt-0.5">
        <i className={getIcon()}></i>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-semibold mb-1">{title}</h4>
        )}
        <p className="text-sm opacity-90">{message}</p>
        
        {/* Actions */}
        {actions.length > 0 && (
          <div className="mt-3 flex space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="text-xs font-medium underline hover:no-underline opacity-75 hover:opacity-100 transition-opacity"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 ml-2 opacity-50 hover:opacity-100 transition-opacity"
      >
        <i className="fas fa-times text-sm"></i>
      </button>
    </div>
  );
}

// Notification container
export function NotificationContainer({ notifications, onRemove }) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            {...notification}
            onClose={onRemove}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

// Notification manager hook
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (message, options = {}) => 
    addNotification({ type: NOTIFICATION_TYPES.SUCCESS, message, ...options });

  const showError = (message, options = {}) => 
    addNotification({ type: NOTIFICATION_TYPES.ERROR, message, duration: 7000, ...options });

  const showWarning = (message, options = {}) => 
    addNotification({ type: NOTIFICATION_TYPES.WARNING, message, ...options });

  const showInfo = (message, options = {}) => 
    addNotification({ type: NOTIFICATION_TYPES.INFO, message, ...options });

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}

// Global notification provider (optional)
import { createContext, useContext } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const notificationManager = useNotifications();

  return (
    <NotificationContext.Provider value={notificationManager}>
      {children}
      <NotificationContainer 
        notifications={notificationManager.notifications}
        onRemove={notificationManager.removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useGlobalNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useGlobalNotifications must be used within a NotificationProvider');
  }
  return context;
}