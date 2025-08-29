/**
 * Notification utilities to replace browser alerts and confirms
 * Provides a consistent notification system across the application
 */

// Global notification state
let notificationContainer = null;
let confirmDialog = null;

/**
 * Initialize notification system
 */
export function initializeNotifications() {
  // Create notification container if it doesn't exist
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(notificationContainer);
  }

  // Create confirm dialog container if it doesn't exist
  if (!confirmDialog) {
    confirmDialog = document.createElement('div');
    confirmDialog.id = 'confirm-dialog-container';
    confirmDialog.className = 'fixed inset-0 z-50 hidden';
    document.body.appendChild(confirmDialog);
  }
}

/**
 * Show a toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (0 for persistent)
 */
export function showToast(message, type = 'info', duration = 4000) {
  initializeNotifications();

  const toast = document.createElement('div');
  toast.className = getToastClasses(type);
  
  const icon = getToastIcon(type);
  
  toast.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <i class="fas ${icon}"></i>
      </div>
      <div class="ml-3 flex-1">
        <p class="text-sm font-medium">${message}</p>
      </div>
      <div class="ml-4 flex-shrink-0 flex">
        <button class="toast-close-btn text-gray-400 hover:text-gray-600" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;

  // Add close button functionality
  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn.addEventListener('click', () => removeToast(toast));

  // Add to container with animation
  notificationContainer.appendChild(toast);
  
  // Trigger enter animation
  setTimeout(() => {
    toast.classList.add('notification-enter');
  }, 10);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }

  return toast;
}

/**
 * Remove a toast notification
 * @param {HTMLElement} toast - Toast element to remove
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  
  toast.classList.add('notification-exit');
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Get CSS classes for toast based on type
 * @param {string} type - Toast type
 * @returns {string} CSS classes
 */
function getToastClasses(type) {
  const baseClasses = 'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 notification-toast';
  
  const typeClasses = {
    success: 'bg-green-50 text-green-800 ring-green-200 dark:bg-green-900 dark:text-green-200 dark:ring-green-800',
    error: 'bg-red-50 text-red-800 ring-red-200 dark:bg-red-900 dark:text-red-200 dark:ring-red-800',
    warning: 'bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:ring-yellow-800',
    info: 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:ring-blue-800'
  };
  
  return `${baseClasses} ${typeClasses[type] || typeClasses.info} p-4`;
}

/**
 * Get icon for toast based on type
 * @param {string} type - Toast type
 * @returns {string} Font Awesome icon class
 */
function getToastIcon(type) {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  return icons[type] || icons.info;
}

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {number} duration - Duration in milliseconds
 */
export function showSuccess(message, duration = 4000) {
  return showToast(message, 'success', duration);
}

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {number} duration - Duration in milliseconds (0 for persistent)
 */
export function showError(message, duration = 6000) {
  return showToast(message, 'error', duration);
}

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {number} duration - Duration in milliseconds
 */
export function showWarning(message, duration = 5000) {
  return showToast(message, 'warning', duration);
}

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {number} duration - Duration in milliseconds
 */
export function showInfo(message, duration = 4000) {
  return showToast(message, 'info', duration);
}

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Object} options - Dialog options
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {string} options.confirmStyle - Confirm button style class
 * @returns {Promise<boolean>} Promise that resolves to true if confirmed
 */
export function showConfirm(title, message, options = {}) {
  return new Promise((resolve) => {
    initializeNotifications();

    const {
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmStyle = 'bg-red-600 hover:bg-red-700'
    } = options;

    confirmDialog.className = 'fixed inset-0 z-50 flex items-center justify-center';
    confirmDialog.innerHTML = `
      <div class="absolute inset-0 bg-black bg-opacity-50" id="confirm-backdrop"></div>
      <div class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200">${title}</h3>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">${message}</p>
        </div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button id="confirm-cancel" class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            ${cancelText}
          </button>
          <button id="confirm-ok" class="px-4 py-2 ${confirmStyle} text-white rounded-lg">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const backdrop = confirmDialog.querySelector('#confirm-backdrop');
    const cancelBtn = confirmDialog.querySelector('#confirm-cancel');
    const confirmBtn = confirmDialog.querySelector('#confirm-ok');

    const cleanup = () => {
      confirmDialog.className = 'fixed inset-0 z-50 hidden';
      confirmDialog.innerHTML = '';
    };

    backdrop.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    confirmBtn.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

/**
 * Clear all notifications
 */
export function clearAllNotifications() {
  if (notificationContainer) {
    notificationContainer.innerHTML = '';
  }
}

/**
 * Replacement for alert() function
 * @param {string} message - Alert message
 */
export function alert(message) {
  return showInfo(message);
}

/**
 * Replacement for confirm() function
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} Promise that resolves to confirmation result
 */
export function confirm(message) {
  return showConfirm('Confirm', message);
}