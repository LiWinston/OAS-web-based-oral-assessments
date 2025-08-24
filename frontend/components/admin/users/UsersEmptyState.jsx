"use client";

import { Button } from "@/components/ui/button";

export default function UsersEmptyState({ role = "STUDENT", onAdd }) {
  const isStudent = role === "STUDENT";
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
        <i className={`fas ${isStudent ? "fa-user-graduate" : "fa-user-tie"} text-blue-600 dark:text-blue-300 text-2xl`}></i>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {isStudent ? "No students yet" : "No examiners yet"}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {isStudent
          ? "Add students manually by email to this assignment."
          : "Add examiners manually by email to this assignment."}
      </p>
      <Button onClick={onAdd}>
        <i className="fas fa-user-plus mr-2" /> Add {isStudent ? "Student" : "Examiner"}
      </Button>
    </div>
  );
}

