"use client";

import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { adminService, adminUtils } from "../../../services/adminService";

export function AdminManagementHub() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    department: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [adminData, setAdminData] = useState({
    pendingInvitations: [],
    activeAdmins: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load admin data on component mount
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAdminList();
      if (response.success) {
        setAdminData(response.data);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = async () => {
    const errors = {};

    // Name validation
    if (!inviteData.name.trim()) {
      errors.name = "Full name is required";
    }

    // Email validation
    if (!inviteData.email.trim()) {
      errors.email = "Email address is required";
    } else {
      const emailValidation = adminService.validateUniversityEmail(
        inviteData.email
      );
      if (!emailValidation.valid) {
        errors.email = emailValidation.message;
      } else {
        // Check for duplicates
        try {
          const duplicateCheck = await adminService.checkDuplicateEmail(
            inviteData.email
          );
          if (duplicateCheck.data.isDuplicate) {
            errors.email =
              "This email address is already registered or invited";
          }
        } catch (error) {
          console.error("Duplicate check failed:", error);
        }
      }
    }

    // Department validation
    if (!inviteData.department.trim()) {
      errors.department = "Department is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResendInvitation = async (adminId) => {
    try {
      const response = await adminService.resendInvitation(adminId);
      if (response.success) {
        // Update UI to show success
        const targetCard = document.querySelector(
          `[data-admin-id="${adminId}"]`
        );
        if (targetCard) {
          targetCard.style.transform = "scale(0.98)";
          targetCard.style.opacity = "0.7";

          setTimeout(() => {
            targetCard.style.transform = "scale(1)";
            targetCard.style.opacity = "1";
          }, 300);
        }

        // Show success notification
        showNotification("Invitation resent successfully", "success");

        // Reload data to reflect changes
        loadAdminData();
      }
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      showNotification("Failed to resend invitation", "error");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setValidationErrors({});

    // Validate form
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await adminService.inviteAdmin(inviteData);
      if (response.success) {
        setShowInviteForm(false);
        setInviteData({ name: "", email: "", department: "" });
        setValidationErrors({});

        // Show success notification
        showNotification(
          `Invitation sent successfully to ${inviteData.email}`,
          "success"
        );

        // Reload data to show new invitation
        loadAdminData();
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      showNotification("Failed to send invitation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (message, type = "success") => {
    const notification = document.createElement("div");
    const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
    const icon =
      type === "success" ? "fa-check-circle" : "fa-exclamation-circle";

    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${icon} mr-2"></i>
        ${message}
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header with invite button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Course Administrator Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Invite new course administrators and track registration status
          </p>
        </div>
        <Button
          onClick={() => setShowInviteForm(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <i className="fas fa-user-plus mr-2"></i>
          Invite Admin
        </Button>
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              <i className="fas fa-user-plus text-orange-500 mr-2"></i>
              Invite Course Administrator
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInviteForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={inviteData.name}
                  onChange={(e) => {
                    setInviteData({ ...inviteData, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: "" });
                    }
                  }}
                  placeholder="Dr. Jane Smith"
                  className={`mt-1 ${
                    validationErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  required
                />
                {validationErrors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.name}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  University Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => {
                    setInviteData({ ...inviteData, email: e.target.value });
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: "" });
                    }
                  }}
                  placeholder="jane.smith@student.unimelb.edu.au"
                  className={`mt-1 ${
                    validationErrors.email
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  required
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.email}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be a @student.unimelb.edu.au email address
                </p>
              </div>
            </div>

            <div>
              <Label
                htmlFor="department"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Department *
              </Label>
              <Input
                id="department"
                value={inviteData.department}
                onChange={(e) => {
                  setInviteData({ ...inviteData, department: e.target.value });
                  if (validationErrors.department) {
                    setValidationErrors({
                      ...validationErrors,
                      department: "",
                    });
                  }
                }}
                placeholder="Computer Science"
                className={`mt-1 ${
                  validationErrors.department
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                required
              />
              {validationErrors.department && (
                <p className="mt-1 text-xs text-red-600">
                  {validationErrors.department}
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Invitation Process:</p>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • The administrator will receive an invitation email with
                      a registration link
                    </li>
                    <li>
                      • They must complete the 5-step onboarding process within
                      7 days
                    </li>
                    <li>
                      • The invitation will automatically expire after 7 days if
                      not used
                    </li>
                    <li>• You can resend expired invitations at any time</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Pending Invitations */}
      {adminData.pendingInvitations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-3"></div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Pending Invitations (
              {
                adminData.pendingInvitations.filter(
                  (inv) => inv.status === "invited"
                ).length
              }
              )
            </h4>
          </div>

          <div className="space-y-3">
            {adminData.pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                data-admin-id={invitation.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  invitation.status === "invited"
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      invitation.status === "invited"
                        ? "bg-gradient-to-br from-blue-400 to-purple-400"
                        : "bg-gradient-to-br from-green-400 to-emerald-400"
                    }`}
                  >
                    <i
                      className={`fas ${
                        invitation.status === "invited"
                          ? "fa-envelope"
                          : "fa-check"
                      } text-white`}
                    ></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {invitation.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {invitation.department} • Invited {invitation.invitedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      invitation.status === "invited"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    }`}
                  >
                    {invitation.status === "invited"
                      ? "Invitation Sent"
                      : "Registered"}
                  </span>

                  {invitation.status === "invited" && (
                    <Button
                      onClick={() => handleResendInvitation(invitation.id)}
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                    >
                      <i className="fas fa-redo mr-1"></i>
                      Resend
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Admins */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Active Course Administrators ({adminData.activeAdmins.length})
          </h4>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {
              adminData.activeAdmins.filter((a) => a.status === "active").length
            }{" "}
            Active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3">Administrator</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Courses</th>
                <th className="pb-3">Last Active</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {adminData.activeAdmins.map((admin) => (
                <tr
                  key={admin.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          admin.status === "active"
                            ? "bg-gradient-to-br from-green-400 to-blue-400"
                            : "bg-gray-400"
                        }`}
                      >
                        <i className="fas fa-user text-white text-sm"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {admin.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {admin.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    {admin.department}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {admin.coursesCount} courses
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                    {admin.lastActive}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        admin.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          admin.status === "active"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      ></div>
                      {admin.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-900"
                      >
                        <i className="fas fa-user-slash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
