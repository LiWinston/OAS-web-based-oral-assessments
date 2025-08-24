"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/authService";

// Error Boundary Component to catch any React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Reset Password Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="mt-2">
                An unexpected error occurred. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/forgot-password">
                <Button className="w-full">
                  Request New Code
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

function ResetPasswordPageContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email stored, redirect to forgot-password
      router.push("/forgot-password");
    }
  }, [router]);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("At least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("One uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("One lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("One number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("One special character");
    }
    return errors;
  };

  useEffect(() => {
    if (newPassword) {
      setPasswordErrors(validatePassword(newPassword));
    }
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate code
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      setError("Please ensure your password meets all requirements");
      return;
    }

    setIsLoading(true);
    setAttempts(attempts + 1);

    try {
      const result = await authService.confirmPasswordReset(email, code, newPassword);
      
      // Handle successful response
      if (result.success !== false) {
        setIsSuccess(true);
        // Clear session storage
        sessionStorage.removeItem("resetEmail");
      } else {
        // Handle case where backend returns success: false in 200 response
        setError(result.message || "Password reset failed. Please try again.");
      }
    } catch (err) {
      // Handle different error scenarios with careful null checking
      try {
        const errorCode = err.response?.data?.code;
        const errorMessage = err.response?.data?.message;
        const errorData = err.response?.data?.data;

        if (errorCode === "4006") {
          setError("New password cannot be the same as your current password. Please choose a different password.");
        } else if (errorCode === "INVALID_CODE") {
          setError("The verification code is invalid or expired. Please request a new code.");
        } else if (errorCode === "TOO_MANY_ATTEMPTS") {
          setError("Too many failed attempts. Please request a new verification code.");
        } else if (errorCode === "WEAK_PASSWORD") {
          setError("Password does not meet security requirements. Please choose a stronger password.");
        } else if (
          (errorMessage && errorMessage.includes("same as")) ||
          (errorData && errorData.includes("differ from the current password"))
        ) {
          setError("New password cannot be the same as your current password. Please choose a different password.");
        } else {
          // Use the most descriptive error message available
          const displayError = errorData || errorMessage || err.message || "An error occurred. Please try again or request a new code.";
          setError(displayError);
        }

        // Check if too many attempts
        if (attempts >= 4) {
          setError("Too many failed attempts. Please request a new verification code.");
          setTimeout(() => {
            router.push("/forgot-password");
          }, 3000);
        }
      } catch (nestedError) {
        // Fallback error handling if error parsing fails
        console.error("Error parsing response:", nestedError);
        setError("An unexpected error occurred. Please try again or request a new code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">
              Password Reset Successful!
            </CardTitle>
            <CardDescription className="mt-2">
              Your password has been successfully reset. You can now log in with
              your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                All your previous sessions have been logged out for security.
                Please log in again with your new password.
              </AlertDescription>
            </Alert>

            <Link href="/login">
              <Button className="w-full" size="lg">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <Lock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription className="mt-2">
            Enter the verification code sent to {email || "your email"} and
            choose a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(value);
                }}
                maxLength={6}
                required
                autoComplete="one-time-code"
                className="text-center text-lg font-mono tracking-widest"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter the 6-digit code from your email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            {newPassword && (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password Requirements:
                </p>
                <ul className="space-y-1 text-xs">
                  {[
                    {
                      text: "At least 8 characters long",
                      check: newPassword.length >= 8,
                    },
                    {
                      text: "One uppercase letter",
                      check: /[A-Z]/.test(newPassword),
                    },
                    {
                      text: "One lowercase letter",
                      check: /[a-z]/.test(newPassword),
                    },
                    { text: "One number", check: /[0-9]/.test(newPassword) },
                    {
                      text: "One special character",
                      check: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
                    },
                  ].map((req, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      {req.check ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-400 dark:text-gray-600" />
                      )}
                      <span
                        className={
                          req.check
                            ? "text-green-700 dark:text-green-400"
                            : "text-gray-600 dark:text-gray-400"
                        }
                      >
                        {req.text}
                      </span>
                    </li>
                  ))}
                  {confirmPassword && (
                    <li className="flex items-center space-x-2">
                      {newPassword === confirmPassword ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                      )}
                      <span
                        className={
                          newPassword === confirmPassword
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        Passwords match
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {attempts > 2 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have {5 - attempts} attempt(s) remaining. After 5 failed
                  attempts, you'll need to request a new code.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                isLoading ||
                !code ||
                !newPassword ||
                !confirmPassword ||
                passwordErrors.length > 0
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Link href="/forgot-password">
                <Button variant="outline" className="w-full">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Request New Code
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Export the component wrapped in ErrorBoundary
export default function ResetPasswordPage() {
  return (
    <ErrorBoundary>
      <ResetPasswordPageContent />
    </ErrorBoundary>
  );
}
