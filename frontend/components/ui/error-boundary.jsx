'use client';

import React from 'react';
import { Button } from './button';
import { Card } from './card';

// Error Boundary Component for graceful error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We apologize for the inconvenience. An unexpected error occurred.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                  Error Details (Development Mode):
                </h3>
                <pre className="text-xs text-red-700 dark:text-red-400 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-xs text-red-700 dark:text-red-400 overflow-auto max-h-32 mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={this.handleRetry}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <i className="fas fa-redo mr-2"></i>
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <i className="fas fa-refresh mr-2"></i>
                Reload Page
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary(Component, fallback) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Simple error fallback component
export function ErrorFallback({ error, resetError }) {
  return (
    <Card className="p-6 m-4 border-red-200 dark:border-red-800">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Component Error
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          This section encountered an error and couldn't load properly.
        </p>
        {resetError && (
          <Button onClick={resetError} size="sm" variant="outline">
            <i className="fas fa-redo mr-2"></i>
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

export default ErrorBoundary;