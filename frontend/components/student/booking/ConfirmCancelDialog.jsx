"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ConfirmCancelDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  booking,
  isProcessing = false 
}) {
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset checkbox when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmChecked(false);
    }
  }, [isOpen]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const formatDateTime = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleString("en-AU", { 
      weekday: "long",
      month: "long", 
      day: "numeric", 
      year: "numeric",
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    })} - ${e.toLocaleTimeString("en-AU", { 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    })}`;
  };

  const handleConfirm = () => {
    if (confirmChecked) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  // Don't render until mounted and open
  if (!mounted || !isOpen || !booking) return null;

  // Calculate time until timeslot
  const now = new Date();
  const sessionStart = new Date(booking.session?.start);
  const hoursUntilSession = Math.floor((sessionStart - now) / (1000 * 60 * 60));
  const daysUntilSession = Math.floor(hoursUntilSession / 24);

  // Determine warning level based on time remaining
  const getWarningInfo = () => {
    if (daysUntilSession <= 1) {
      return {
        icon: "fa-exclamation-triangle",
        iconColor: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900",
        title: "Critical Cancellation Warning",
        message: "Your assessment is scheduled very soon. Cancelling now may significantly impact your ability to reschedule and complete this assessment on time."
      };
    } else if (daysUntilSession <= 3) {
      return {
        icon: "fa-exclamation-circle",
        iconColor: "text-orange-600 dark:text-orange-400",
        bgColor: "bg-orange-100 dark:bg-orange-900",
        title: "Important Cancellation Notice",
        message: "Your assessment is approaching. Limited alternative timeslots may be available if you cancel now."
      };
    } else {
      return {
        icon: "fa-info-circle",
        iconColor: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900",
        title: "Cancel Booking Confirmation",
        message: "You are about to cancel your booking. You will need to book a new timeslot if you wish to complete this assessment."
      };
    }
  };

  const warningInfo = getWarningInfo();

  const dialogContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />
      
      {/* Dialog */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className={`w-10 h-10 ${warningInfo.bgColor} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                <i className={`fas ${warningInfo.icon} ${warningInfo.iconColor}`}></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {warningInfo.title}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-2"
              disabled={isProcessing}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Warning Message */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {warningInfo.message}
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Booking Details
            </h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Assignment:</span> {booking.assignmentName}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Course:</span> {booking.courseCode}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">Date & Time:</span><br />
                {formatDateTime(booking.session.start, booking.session.end)}
              </p>
              {booking.session.venue && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Location:</span> {
                    booking.session.venue.room ? 
                    `Room ${booking.session.venue.room}` : 
                    booking.session.venue.name
                  }
                </p>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0"></i>
              <div>
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Important Information
                </h4>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                  <li>• Once cancelled, this timeslot will become available to other students</li>
                  <li>• You will need to book a new timeslot to complete this assessment</li>
                  {booking.lockoutEnabled && (
                    <li>• New bookings cannot be made within {booking.lockoutWindowHours || 24} hours of a timeslot start time</li>
                  )}
                  {booking.bookingDeadline && (
                    <li>• All bookings must be completed before the deadline: {new Date(booking.bookingDeadline).toLocaleString("en-AU", { 
                      month: "short", 
                      day: "numeric", 
                      hour: "numeric", 
                      minute: "2-digit", 
                      hour12: true 
                    })}</li>
                  )}
                  {booking.entity?.type === "GROUP" && (
                    <li className="font-semibold">• This cancellation will affect all members of your group</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start mb-4">
            <input
              type="checkbox"
              id="confirm-cancel"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="mt-1 mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
              disabled={isProcessing}
            />
            <label 
              htmlFor="confirm-cancel" 
              className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
            >
              I understand the implications of cancelling this booking and wish to proceed with the cancellation
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Keep Booking
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmChecked || isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Cancelling...
              </>
            ) : (
              'Cancel Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render outside of parent component hierarchy
  return mounted ? createPortal(dialogContent, document.body) : null;
}

// Add styles to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(10px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}