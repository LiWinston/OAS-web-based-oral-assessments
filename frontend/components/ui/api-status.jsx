'use client';

import { useState, useEffect } from 'react';
import { Card } from './card';

// API Status Indicator Component
// Shows backend connectivity status in development
export function ApiStatusIndicator({ className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    backendReachable: false,
    lastChecked: null
  });

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
      checkApiStatus();
    }
  }, []);

  const checkApiStatus = async () => {
    let backendReachable = false;

    try {
      // Try to reach the backend health endpoint
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/init`, { 
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      backendReachable = response.ok;
    } catch (error) {
      backendReachable = false;
    }

    setApiStatus({
      backendReachable,
      lastChecked: new Date()
    });
  };

  const getStatusColor = () => {
    return apiStatus.backendReachable ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    return apiStatus.backendReachable ? 'Backend Connected' : 'Backend Unavailable';
  };

  const getStatusDescription = () => {
    return apiStatus.backendReachable 
      ? 'Connected to Next.js API backend with MySQL database'
      : 'Cannot reach backend. Check if the Next.js server is running.';
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-40 max-w-sm ${className}`}>
      <Card className="p-3 shadow-lg border-l-4 border-l-blue-500 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95">
        <div className="flex items-center space-x-3">
          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {getStatusText()}
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={checkApiStatus}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Refresh API status"
          >
            <i className="fas fa-sync-alt text-xs"></i>
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
          {getStatusDescription()}
        </p>

        {/* Environment info */}
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Environment: {process.env.NODE_ENV}</span>
            {apiStatus.lastChecked && (
              <span>
                Checked: {apiStatus.lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Backend integration info */}
        {!apiStatus.backendReachable && (
          <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs">
            <div className="flex items-start space-x-2">
              <i className="fas fa-exclamation-triangle text-orange-500 mt-0.5"></i>
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-300 mb-1">
                  Backend Unavailable
                </p>
                <p className="text-orange-700 dark:text-orange-400">
                  Check if MySQL is running and Next.js server is started.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Enhanced API client with status tracking
export class ApiStatusTracker {
  constructor() {
    this.status = {
      isOnline: navigator.onLine,
      lastRequestTime: null,
      failedRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0
    };
    
    this.listeners = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => this.updateStatus({ isOnline: true }));
    window.addEventListener('offline', () => this.updateStatus({ isOnline: false }));
  }

  trackRequest(startTime, success, responseTime) {
    const updates = {
      lastRequestTime: new Date(),
      [success ? 'successfulRequests' : 'failedRequests']: 
        this.status[success ? 'successfulRequests' : 'failedRequests'] + 1
    };

    if (responseTime) {
      const totalRequests = this.status.successfulRequests + this.status.failedRequests + 1;
      updates.averageResponseTime = 
        (this.status.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    }

    this.updateStatus(updates);
  }

  updateStatus(updates) {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  getStatus() {
    return { ...this.status };
  }
}

// Global API status tracker instance
export const apiStatusTracker = new ApiStatusTracker();

export default ApiStatusIndicator;