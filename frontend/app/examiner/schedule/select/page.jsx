"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { examinerTimeslotService } from "../../../../services/examinerTimeslotService";
import { useAuthStore } from "../../../../store/authStore";

/**
 * TimeslotSelection Component
 *
 * Two-step wizard for examiner timeslot self-assignment:
 * Step 1: Assessment Selection
 * Step 2: Timeslot Selection
 */
export default function TimeslotSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [allocatedSlots, setAllocatedSlots] = useState([]);
  const [currentAllocation, setCurrentAllocation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Mock configuration - will come from API
  const minAllocation = 3;
  const maxAllocation = 8;

  // Pre-fill if coming from assignment link
  useEffect(() => {
    const assignmentId = searchParams.get("assignmentId");
    if (assignmentId) {
      setSelectedSubject("COMP90082");
      setSelectedAssessment("final");
      setCurrentStep(2);
    }
  }, [searchParams]);

  const dateHasSlots = (date) => {
    return [
      "2025-04-15",
      "2025-04-16",
      "2025-04-18",
      "2025-04-22",
      "2025-04-23",
    ].includes(date);
  };

  const selectSlot = (slot) => {
    const slotIndex = allocatedSlots.findIndex((s) => s.id === slot.id);
    if (slotIndex >= 0) {
      const removedSessions = allocatedSlots[slotIndex].sessions;
      const newSlots = allocatedSlots.filter((s) => s.id !== slot.id);
      setAllocatedSlots(newSlots);
      setCurrentAllocation(currentAllocation - removedSessions);
    } else {
      if (currentAllocation + slot.sessions <= maxAllocation) {
        setAllocatedSlots([...allocatedSlots, slot]);
        setCurrentAllocation(currentAllocation + slot.sessions);
      } else {
        alert("You have reached the maximum allocation limit.");
      }
    }
  };

  const isSlotSelected = (slotId) => {
    return allocatedSlots.some((slot) => slot.id === slotId);
  };

  const removeSlot = (slotId) => {
    const slotIndex = allocatedSlots.findIndex((s) => s.id === slotId);
    if (slotIndex >= 0) {
      const removedSessions = allocatedSlots[slotIndex].sessions;
      const newSlots = allocatedSlots.filter((s) => s.id !== slotId);
      setAllocatedSlots(newSlots);
      setCurrentAllocation(currentAllocation - removedSessions);
    }
  };

  const canSubmit = () => {
    return (
      currentAllocation >= minAllocation && currentAllocation <= maxAllocation
    );
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (selectedSubject && selectedAssessment) {
        setCurrentStep(2);
      } else {
        alert("Please select a subject and an assessment.");
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep--;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsLoading(true);
    try {
      // Mock submission - will use real API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert("Your time slot selections have been submitted successfully!");
      router.push("/examiner/schedule");
    } catch (error) {
      alert("Failed to submit selections. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const currentMonth = new Date(2025, 3); // April 2025
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonth.getDate() - i),
        dateString: new Date(year, month - 1, prevMonth.getDate() - i)
          .toISOString()
          .split("T")[0],
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: new Date(year, month, day),
        dateString: new Date(year, month, day).toISOString().split("T")[0],
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, day),
        dateString: new Date(year, month + 1, day).toISOString().split("T")[0],
      });
    }

    return days;
  };

  const days = getDaysInMonth();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <button
                onClick={() => router.push("/examiner")}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">
                  OAS
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Examiner
                </span>
              </button>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <button
                onClick={() => router.push("/examiner/schedule")}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Schedule
              </button>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Time Slot Selection
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Time Slot Selection
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Browse and select time slots for upcoming assessments within your
          allocation limits.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="dashboard-card p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
            <i className="fas fa-tasks text-blue-600 dark:text-blue-400 mr-2"></i>
            Selection Process
          </h2>
          <div className="flex space-x-2">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full ${
                  currentStep >= step
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              ></div>
            ))}
          </div>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span
                className={`text-xs font-semibold inline-block py-1 px-2 rounded-full ${
                  currentStep >= 1
                    ? "text-blue-600 bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50"
                    : "text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700"
                }`}
              >
                Step 1
              </span>
            </div>
            <div>
              <span
                className={`text-xs font-semibold inline-block py-1 px-2 rounded-full ${
                  currentStep >= 2
                    ? "text-blue-600 bg-blue-200 dark:text-blue-300 dark:bg-blue-900/50"
                    : "text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700"
                }`}
              >
                Step 2
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 dark:bg-blue-600 transition-all duration-500"
              style={{ width: `${currentStep === 1 ? 50 : 100}%` }}
            ></div>
          </div>
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-gray-700 dark:text-gray-300">
                Select Assessment
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold inline-block text-gray-700 dark:text-gray-300">
                Choose Time Slots
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Assessment Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                <i className="fas fa-book text-blue-600 dark:text-blue-400 mr-2"></i>
                Select Assessment
              </h2>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200 mb-6">
              <i className="fas fa-info-circle mr-2"></i>
              Select a subject and assessment to view available time slots.
              You'll need to select between 3-8 sessions based on administrator
              requirements.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <select
                  className="form-control"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">Select a subject</option>
                  <option value="COMP90082">
                    COMP90082 - Software Project Management
                  </option>
                  <option value="INFO30005">
                    INFO30005 - Web Information Technologies
                  </option>
                  <option value="COMP90018">
                    COMP90018 - Mobile Computing Systems
                  </option>
                  <option value="INFO20003">
                    INFO20003 - Database Systems
                  </option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-filter mr-1"></i>
                  Showing subjects you are eligible to assess
                </p>
              </div>

              {/* Assessment Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assessment
                </label>
                <select
                  className="form-control"
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  disabled={!selectedSubject}
                >
                  <option value="">Select an assessment</option>
                  {selectedSubject === "COMP90082" && (
                    <>
                      <option value="final">
                        Final Project Defense (Group)
                      </option>
                      <option value="midterm">
                        Mid-semester Project Update (Group)
                      </option>
                    </>
                  )}
                  {selectedSubject === "INFO30005" && (
                    <>
                      <option value="usability">
                        Usability Testing Presentation (Group)
                      </option>
                      <option value="final">
                        Final Project Demonstration (Group)
                      </option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <i className="fas fa-calendar-alt mr-1"></i>
                  Showing assessments currently open for scheduling
                </p>
              </div>
            </div>

            {/* Assessment Details */}
            {selectedSubject && selectedAssessment && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mr-2"></i>
                  Assessment Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Subject
                      </span>
                      <span className="text-sm font-medium">
                        Software Project Management (COMP90082)
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Assessment
                      </span>
                      <span className="text-sm font-medium">
                        Final Project Defense
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Type
                      </span>
                      <span className="text-sm font-medium">Group</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Session Length
                      </span>
                      <span className="text-sm font-medium">30 minutes</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Required Examiners
                      </span>
                      <span className="text-sm font-medium">2 per session</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={nextStep}
                disabled={!selectedSubject || !selectedAssessment}
                className="flex items-center"
              >
                Continue to Time Slot Selection
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Timeslot Selection */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Assessment Summary */}
          <div className="dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                <i className="fas fa-clipboard-list text-blue-600 dark:text-blue-400 mr-2"></i>
                Assessment Summary
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                <i className="fas fa-book text-gray-400 mr-2"></i>
                <span className="text-sm font-medium">COMP90082</span>
              </div>
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                <i className="fas fa-clipboard-check text-gray-400 mr-2"></i>
                <span className="text-sm font-medium">
                  Final Project Defense
                </span>
              </div>
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                <i className="fas fa-users text-gray-400 mr-2"></i>
                <span className="text-sm font-medium">Group Assessment</span>
              </div>
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                <i className="fas fa-clock text-gray-400 mr-2"></i>
                <span className="text-sm font-medium">30 min per session</span>
              </div>
            </div>
          </div>

          {/* Timeslot Selection Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="dashboard-card p-5 lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  <i className="fas fa-calendar-alt text-blue-600 dark:text-blue-400 mr-2"></i>
                  April 2025
                </h2>
              </div>

              {/* Calendar header */}
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-xs text-center font-medium text-gray-500 dark:text-gray-400 p-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const hasSlots = dateHasSlots(day.dateString);
                  const isSelected = selectedDate === day.dateString;
                  const isToday = day.dateString === "2025-04-23";

                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded cursor-pointer text-xs
                        ${
                          !day.isCurrentMonth
                            ? "text-gray-400 dark:text-gray-600"
                            : ""
                        }
                        ${
                          hasSlots
                            ? "border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            : ""
                        }
                        ${
                          isSelected
                            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                            : ""
                        }
                        ${
                          isToday
                            ? "font-bold text-blue-600 dark:text-blue-400"
                            : ""
                        }
                      `}
                      onClick={() =>
                        hasSlots && setSelectedDate(day.dateString)
                      }
                    >
                      <span>{day.date}</span>
                      {hasSlots && (
                        <div className="w-1 h-1 bg-blue-500 rounded-full mt-1"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Available slots</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 border border-blue-500 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-2"></div>
                  <span>Selected date</span>
                </div>
              </div>
            </div>

            {/* Available Time Slots */}
            <div className="dashboard-card p-5 lg:col-span-2">
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      <i className="fas fa-clock text-blue-600 dark:text-blue-400 mr-2"></i>
                      Available Slots -{" "}
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h2>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <i className="fas fa-info-circle text-gray-500 mr-2"></i>
                      Click on time slots to select them. Your selections will
                      be shown in the summary below.
                    </p>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {/* Mock time slots */}
                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSlotSelected("slot-1")
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() =>
                        selectSlot({
                          id: "slot-1",
                          date: selectedDate,
                          startTime: "9:00 AM",
                          endTime: "9:30 AM",
                          venue: "Engineering Building, Room 405",
                          sessions: 1,
                        })
                      }
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-sm">
                            9:00 AM - 9:30 AM
                          </span>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            Engineering Building, Room 405
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mr-2">
                            1 session
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSlotSelected("slot-1")
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {isSlotSelected("slot-1") && (
                              <i className="fas fa-check text-white text-xs"></i>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSlotSelected("slot-2")
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() =>
                        selectSlot({
                          id: "slot-2",
                          date: selectedDate,
                          startTime: "10:00 AM",
                          endTime: "11:00 AM",
                          venue: "Engineering Building, Room 405",
                          sessions: 2,
                        })
                      }
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-sm">
                            10:00 AM - 11:00 AM
                          </span>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            Engineering Building, Room 405
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mr-2">
                            2 sessions
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSlotSelected("slot-2")
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {isSlotSelected("slot-2") && (
                              <i className="fas fa-check text-white text-xs"></i>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-calendar-day text-gray-400 dark:text-gray-500 text-2xl"></i>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a date from the calendar to view available time slots
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Selection Summary */}
          {allocatedSlots.length > 0 && (
            <div className="dashboard-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  <i className="fas fa-list-check text-blue-600 dark:text-blue-400 mr-2"></i>
                  Selection Summary
                </h2>
                <button
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  onClick={() => {
                    setAllocatedSlots([]);
                    setCurrentAllocation(0);
                  }}
                >
                  <i className="fas fa-trash-alt mr-1"></i>
                  Clear All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                      <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocatedSlots.map((slot) => (
                      <tr
                        key={slot.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-3 py-2 text-sm">
                          {new Date(slot.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="px-3 py-2 text-sm">{slot.venue}</td>
                        <td className="px-3 py-2 text-sm">{slot.sessions}</td>
                        <td className="px-3 py-2 text-sm">
                          <button
                            onClick={() => removeSlot(slot.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <td
                        colSpan="3"
                        className="px-3 py-2 text-sm font-medium text-right"
                      >
                        Total Sessions
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">
                        {currentAllocation}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Assessment Selection
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isLoading}
              className="flex items-center"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Confirm Selections
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
