"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Moon, Shield, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] =
    useState(false);
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

  // Quick fill for development (only show in development mode)
  const fillTestAccount = () => {
    setValue("email", "superadmin@example.com");
    setValue("password", "Super123!");
    setError("");
  };

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

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login(data.email, data.password);

      // Ensure successful response with expected data shape
      if (!(response.success && response.data)) {
        throw new Error(
          response.message || "Login failed. Please check your credentials."
        );
      }

      // Map backend roles (ROLE_*) to frontend roles
      const roleMapping = {
        ROLE_ADMIN: "COURSE_ADMIN",
        ROLE_STUDENT: "STUDENT",
        ROLE_EXAMINER: "EXAMINER",
        ROLE_SUPER_ADMIN: "SUPER_ADMIN",
      };

      const frontendRole =
        roleMapping[response.data.role] || response.data.role;

      // Strictly require SUPER_ADMIN for this portal
      if (frontendRole !== "SUPER_ADMIN") {
        throw new Error(
          "Access denied. This portal is restricted to Super Administrators only."
        );
      }

      // Persist auth using the same store contract as main login
      // The store handles cookie setting and role normalization
      login(response.data);

      // Redirect to super admin dashboard
      router.push("/superadmin");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordDialog(true);
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: isDarkMode
          ? "linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 75%, #94a3b8 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fed7aa 25%, #fdba74 50%, #fb923c 75%, #f97316 100%)",
      }}
    >
      {/* Desktop Header */}
      <header className="flex items-center justify-between px-12 py-6">
        <div className="flex items-center">
          <span
            className="font-extrabold text-4xl text-orange-700 dark:text-orange-300 tracking-wide"
            style={{
              letterSpacing: "0.1em",
              fontFamily: "'Inter', 'Helvetica Neue', Arial, 'sans-serif'",
              fontWeight: 700,
            }}
          >
            OAS
          </span>
          <span className="ml-4 text-lg text-orange-600 dark:text-orange-400 font-medium">
            Super Admin Portal
          </span>
        </div>
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="text-gray-500 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 text-2xl focus:outline-none transition-colors"
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
            {/* Left Side - Security Information */}
            <div className="flex flex-col justify-center space-y-8 flex-1">
              <div className="flex items-center mb-8">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-xl">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="ml-6">
                  <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                    System
                    <br />
                    <span className="text-orange-600 dark:text-orange-400">
                      Administration
                    </span>
                  </h1>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                  Secure access portal for OAS system administrators. This
                  portal provides elevated privileges for managing the platform
                  infrastructure.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-4"></div>
                    <span className="text-lg">
                      Course administrator management
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-4"></div>
                    <span className="text-lg">
                      System-wide oversight and monitoring
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-4"></div>
                    <span className="text-lg">
                      Access control and user permissions
                    </span>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-orange-100 dark:bg-orange-900/30 rounded-xl border-l-4 border-orange-500">
                  <div className="flex items-start">
                    <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-orange-800 dark:text-orange-300 text-lg">
                        Security Notice
                      </h3>
                      <p className="text-orange-700 dark:text-orange-400 mt-1">
                        This portal is restricted to authorized system
                        administrators only. All access attempts are logged and
                        monitored for security purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center flex-1">
              <div
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 w-full max-w-lg border border-orange-200 dark:border-orange-700"
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', Arial, 'sans-serif'",
                  fontWeight: 400,
                }}
              >
                <div className="text-center mb-10">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-6 shadow-lg mx-auto">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Admin Access
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Secure system administration portal
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-base font-medium">
                      Administrator Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your admin email address"
                      {...register("email")}
                      disabled={isLoading}
                      className="h-12 text-base border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-500"
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
                        placeholder="Enter your secure password"
                        {...register("password")}
                        disabled={isLoading}
                        className="h-12 text-base pr-10 border-orange-200 dark:border-orange-700 focus:border-orange-500 focus:ring-orange-500"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                        disabled={isLoading}
                        tabIndex={0}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
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
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-none"
                    disabled={isLoading}
                  >
                    {isLoading ? "Authenticating..." : "Access System"}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-base text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 underline font-medium"
                  >
                    Forgot Password?
                  </button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                    Password resets require development team assistance
                  </p>
                </div>

                {/* Development Mode Test Account */}
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-4 text-center">
                      🧪 Development Test Account
                    </p>
                    <button
                      type="button"
                      onClick={fillTestAccount}
                      className="w-full p-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-lg text-center transition-colors border border-orange-200 dark:border-orange-700"
                    >
                      <div className="font-medium text-base">
                        Super Administrator
                      </div>
                      <div className="text-sm opacity-75 mt-1">
                        superadmin@example.com
                      </div>
                      <div className="text-xs opacity-60 mt-1">
                        Click to auto-fill credentials
                      </div>
                    </button>
                  </div>
                )}

                <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">
                      Authorized Personnel Only
                    </span>
                  </div>
                  <p className="text-xs">
                    All access attempts are logged and monitored
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Desktop Footer */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
        &copy; 2025 Oral Assessment System. All rights reserved.
      </footer>

      {/* Forgot Password Dialog */}
      <Dialog
        open={showForgotPasswordDialog}
        onOpenChange={setShowForgotPasswordDialog}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              Password Reset Request
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left space-y-4 text-base">
                <p>
                  Super Administrator accounts are managed by the development
                  team for security purposes.
                </p>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                  <p className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                    To reset your password:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-orange-700 dark:text-orange-400">
                    <li>Contact the OAS Development Team</li>
                    <li>Provide your admin email and verification details</li>
                    <li>Wait for manual password reset confirmation</li>
                  </ol>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                  <p>
                    <strong>Contact:</strong> dev-team@oas-system.edu
                  </p>
                  <p>
                    <strong>Response Time:</strong> 24-48 hours
                  </p>
                  <p>
                    <strong>Include:</strong> Admin email, reason for reset,
                    verification details
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowForgotPasswordDialog(false)}
              className="px-6"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.open(
                  "mailto:dev-team@oas-system.edu?subject=Super Admin Password Reset Request&body=Please include your admin email and reason for password reset.",
                  "_blank"
                );
                setShowForgotPasswordDialog(false);
              }}
              className="bg-orange-500 hover:bg-orange-600 px-6"
            >
              Contact Support
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
