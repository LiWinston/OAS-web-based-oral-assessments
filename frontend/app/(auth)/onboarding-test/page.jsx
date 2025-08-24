"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import {
  UserCheck,
  Users,
  GraduationCap,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";

export default function OnboardingTestPage() {
  const [copiedToken, setCopiedToken] = useState(null);

  const testScenarios = [
    {
      role: "Course Admin",
      description: "Super Admin invites Course Admin",
      token: "admin-token-123",
      icon: <UserCheck className="w-6 h-6" />,
      color: "blue",
      details: [
        "Email: alice@student.unimelb.edu.au",
        "Name: Alice Lee",
        "Department: Engineering (selectable)",
        "Full onboarding flow with department selection",
      ],
    },
    {
      role: "Student",
      description: "Course Admin invites Student to assessment",
      token: "student-token-456",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "green",
      details: [
        "Email: john.doe@student.unimelb.edu.au",
        "Name: John Doe",
        "Course: COMP90082 - Software Project",
        "Assignment: Mid-Semester Oral Assessment",
        "Coordinator: Dr. Alice Lee",
      ],
    },
    {
      role: "Examiner",
      description: "Course Admin invites Examiner to assessment",
      token: "examiner-token-789",
      icon: <Users className="w-6 h-6" />,
      color: "purple",
      details: [
        "Email: sarah.smith@unimelb.edu.au",
        "Name: Dr. Sarah Smith",
        "Course: COMP90082 - Software Project",
        "Assignment: Mid-Semester Oral Assessment",
        "Coordinator: Dr. Alice Lee",
      ],
    },
    {
      role: "Already Registered",
      description: "User who already has an account",
      token: "registered-token-111",
      icon: <AlertCircle className="w-6 h-6" />,
      color: "gray",
      details: [
        "Email: existing@student.unimelb.edu.au",
        'Shows "already registered" message',
        "Redirects to login with prefilled email",
      ],
    },
    {
      role: "Expired Token",
      description: "Token that has expired",
      token: "expired-token-222",
      icon: <AlertCircle className="w-6 h-6" />,
      color: "red",
      details: [
        "Shows expired token error",
        "Provides guidance to contact admin",
        "Option to go to login page",
      ],
    },
    {
      role: "Student (Math)",
      description: "Student invited to Math assessment",
      token: "student-math-token",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "green",
      details: [
        "Email: jane.smith@student.unimelb.edu.au",
        "Name: Jane Smith",
        "Course: MAST10006 - Calculus 2",
        "Assignment: Final Oral Presentation",
        "Coordinator: Prof. Michael Brown",
      ],
    },
    {
      role: "Examiner (Biology)",
      description: "Examiner invited to Biology assessment",
      token: "examiner-biology-token",
      icon: <Users className="w-6 h-6" />,
      color: "purple",
      details: [
        "Email: peter.jones@unimelb.edu.au",
        "Name: Dr. Peter Jones",
        "Course: BIOL10001 - Biology of Cells",
        "Assignment: Lab Viva Examination",
        "Coordinator: Prof. Lisa Anderson",
      ],
    },
  ];

  const copyToClipboard = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      green:
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
      purple:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            OAS Onboarding Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Test different onboarding scenarios for Course Admins, Students, and
            Examiners. Click on any scenario to simulate the onboarding flow
            with mock data.
          </p>
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Ensure NEXT_PUBLIC_USE_MOCK_API=true in
              your .env.local file for mock data to work.
            </p>
          </div>
        </div>

        {/* Test Scenarios Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testScenarios.map((scenario) => (
            <Card
              key={scenario.token}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`p-3 rounded-lg ${getColorClasses(
                    scenario.color
                  )}`}
                >
                  {scenario.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {scenario.role}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {scenario.description}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="mb-4">
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {scenario.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Token Display */}
              <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <code className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {scenario.token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(scenario.token)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Copy token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copiedToken === scenario.token && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Copied!
                  </p>
                )}
              </div>

              {/* Action Button */}
              <Link href={`/onboarding?token=${scenario.token}`}>
                <Button className="w-full flex items-center justify-center gap-2">
                  Test This Scenario
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            How to Test Onboarding
          </h2>
          <ol className="space-y-3 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <div>
                <strong>Choose a scenario:</strong> Select one of the test
                scenarios above based on the role you want to test.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <div>
                <strong>Click "Test This Scenario":</strong> This will navigate
                to the onboarding page with the mock token.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <div>
                <strong>Complete the flow:</strong> Follow the onboarding steps
                specific to that role. Use any password (minimum 8 characters
                with complexity).
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </span>
              <div>
                <strong>Auto-redirect:</strong> After completion, you'll be
                automatically redirected to the appropriate dashboard based on
                the role.
              </div>
            </li>
          </ol>
        </div>

        {/* Manual Token Entry */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Manual Token Entry
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You can also manually construct an onboarding URL with a custom
            token:
          </p>
          <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <code className="text-sm text-gray-700 dark:text-gray-300">
              http://localhost:3000/onboarding?token=YOUR_TOKEN_HERE
            </code>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Replace YOUR_TOKEN_HERE with any of the mock tokens above or a real
            token from the backend.
          </p>
        </div>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link href="/login">
            <Button variant="outline">Back to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
