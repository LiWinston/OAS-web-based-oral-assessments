"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Moon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { Spinner } from "@/components/ui/spinner";

// Validation schema for login form
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Login Page Component
 *
 * Main login interface for students, examiners, and course administrators.
 * Provides form validation, error handling, and role-based redirection.
 * Includes dark mode toggle and test account quick-fill functionality.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newMode;
    });
  };

  // Quick fill function for test accounts
  const fillTestAccount = (email, password) => {
    setValue("email", email);
    setValue("password", password);
    setError(""); // Clear any previous errors
  };


  const onSubmit = async (data) => {
    if (isLoading) return; // Prevent double submit during slow networks
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login(data.email, data.password);

      // Check if login was successful
      if (response.success && response.data) {
        // Store auth data with backend response structure
        login(response.data);

        // Map backend roles to frontend roles
        const roleMapping = {
          ROLE_ADMIN: "COURSE_ADMIN", // Backend ROLE_ADMIN = Frontend COURSE_ADMIN
          ROLE_STUDENT: "STUDENT",
          ROLE_EXAMINER: "EXAMINER",
          ROLE_SUPER_ADMIN: "SUPER_ADMIN",
          // Add more mappings as needed
        };

        const frontendRole =
          roleMapping[response.data.role] || response.data.role;

        // Redirect based on user role
        const roleRoutes = {
          STUDENT: "/student",
          EXAMINER: "/examiner",
          COURSE_ADMIN: "/admin",
          SUPER_ADMIN: "/superadmin",
        };

        const redirectPath = roleRoutes[frontendRole] || "/student";
        router.push(redirectPath);
      } else {
        setError(
          response.message || "Login failed. Please check your credentials."
        );
      }
    } catch (err) {
      // Handle backend error response format
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.code ||
        err.message ||
        "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: isDarkMode
          ? "linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 75%, #94a3b8 100%)"
          : "linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 25%, #81d4fa 50%, #4fc3f7 75%, #29b6f6 100%)",
      }}
    >
      {/* Desktop Header */}
      <header className="flex items-center justify-between px-12 py-6">
        <div className="flex items-center">
          <span
            className="font-extrabold text-4xl text-blue-700 dark:text-blue-300 tracking-wide"
            style={{
              letterSpacing: "0.1em",
              fontFamily: "'Inter', 'Helvetica Neue', Arial, 'sans-serif'",
              fontWeight: 700,
            }}
          >
            OAS
          </span>
          <span className="ml-4 text-lg text-blue-600 dark:text-blue-400 font-medium">
            Oral Assessment System
          </span>
        </div>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-2xl focus:outline-none transition-colors"
        >
          <Moon className="w-7 h-7" />
        </button>
      </header>

      {/* Desktop Main Content - Force Desktop Layout */}
      <main className="flex items-center justify-center px-4 lg:px-12 py-8 min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-7xl">
          <div
            className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-between"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "4rem",
              minHeight: "600px",
            }}
          >
            {/* Left Side - Welcome Content */}
            <div className="flex flex-col justify-center space-y-8 flex-1">
              <div>
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  Welcome to
                  <br />
                  <span className="text-blue-600 dark:text-blue-400">
                    OAS Platform
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                  A comprehensive platform for conducting and managing oral
                  assessments in educational institutions.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                    <span className="text-lg">
                      Streamlined assessment workflows
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                    <span className="text-lg">
                      Real-time collaboration tools
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                    <span className="text-lg">
                      Comprehensive reporting system
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center flex-1">
              <div
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 w-full max-w-lg"
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', Arial, 'sans-serif'",
                  fontWeight: 400,
                }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Sign In
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Access your OAS account
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      {...register("email")}
                      disabled={isLoading}
                      className="h-12 text-base"
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-base font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...register("password")}
                        disabled={isLoading}
                        className="h-12 text-base pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                        disabled={isLoading}
                        tabIndex={0}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium"
                    disabled={isLoading}
                    aria-busy={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="sm" className="mr-1" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="mt-8 text-center text-gray-600 dark:text-gray-400">
                  <Link
                    href="/forgot-password"
                    className="text-base text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                  <p className="text-sm mt-2">
                    Need help? Contact your administrator for assistance.
                  </p>
                </div>

                {/* Test Accounts for Development */}
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4 text-center">
                      🧪 Development Test Accounts
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          fillTestAccount(
                            "alice@student.unimelb.edu.au",
                            "password1"
                          )
                        }
                        className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-center transition-colors"
                      >
                        <div className="font-medium">Course Admin</div>
                        <div className="text-xs opacity-75">alice</div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          fillTestAccount(
                            "bob@student.unimelb.edu.au",
                            "password2"
                          )
                        }
                        className="p-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-center transition-colors"
                      >
                        <div className="font-medium">Student</div>
                        <div className="text-xs opacity-75">bob</div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          fillTestAccount(
                            "dave@unimelb.edu.au",
                            "password1"
                          )
                        }
                        className="p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-center transition-colors"
                      >
                        <div className="font-medium">Examiner</div>
                        <div className="text-xs opacity-75">dave</div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          fillTestAccount(
                            "eve@student.unimelb.edu.au",
                            "password5"
                          )
                        }
                        className="p-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-lg text-center transition-colors"
                      >
                        <div className="font-medium">Super Admin</div>
                        <div className="text-xs opacity-75">eve</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Desktop Footer */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
        &copy; 2025 Oral Assessment System. All rights reserved.
      </footer>

    </div>
  );
}
