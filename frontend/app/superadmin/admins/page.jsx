'use client';

import { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

export default function AdminManagementPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', department: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data with 7-day expiry logic
  const pendingInvitations = [
    { 
      id: 1, 
      name: 'Dr. Sarah Chen', 
      email: 'sarah.chen@student.unimelb.edu.au', 
      department: 'Computer Science', 
      invitedDate: '2025-01-08',
      expiryDate: '2025-01-15',
      status: 'invited',
      daysRemaining: 7
    },
    { 
      id: 2, 
      name: 'Prof. James Wilson', 
      email: 'j.wilson@student.unimelb.edu.au', 
      department: 'Mathematics', 
      invitedDate: '2025-01-07',
      expiryDate: '2025-01-14',
      status: 'invited',
      daysRemaining: 6
    },
    { 
      id: 3, 
      name: 'Dr. Maria Rodriguez', 
      email: 'm.rodriguez@student.unimelb.edu.au', 
      department: 'Engineering', 
      invitedDate: '2025-01-06',
      expiryDate: '2025-01-13',
      status: 'registered',
      registeredDate: '2025-01-08'
    },
    {
      id: 4,
      name: 'Prof. David Kim',
      email: 'd.kim@student.unimelb.edu.au',
      department: 'Physics',
      invitedDate: '2025-01-01',
      expiryDate: '2025-01-08',
      status: 'expired',
      daysRemaining: 0
    }
  ];

  const activeAdmins = [
    { 
      id: 1, 
      name: 'Dr. John Smith', 
      email: 'j.smith@student.unimelb.edu.au', 
      department: 'Computer Science', 
      coursesCount: 3, 
      lastActive: '2025-01-08', 
      status: 'active', 
      registeredDate: '2024-12-15',
      totalAssignments: 8,
      studentsManaged: 245
    },
    { 
      id: 2, 
      name: 'Prof. Emily Davis', 
      email: 'e.davis@student.unimelb.edu.au', 
      department: 'Physics', 
      coursesCount: 2, 
      lastActive: '2025-01-07', 
      status: 'active', 
      registeredDate: '2024-12-10',
      totalAssignments: 5,
      studentsManaged: 180
    },
    { 
      id: 3, 
      name: 'Dr. Michael Brown', 
      email: 'm.brown@student.unimelb.edu.au', 
      department: 'Chemistry', 
      coursesCount: 1, 
      lastActive: '2025-01-05', 
      status: 'inactive', 
      registeredDate: '2024-11-20',
      totalAssignments: 2,
      studentsManaged: 95
    }
  ];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const universityDomains = ['unimelb.edu.au', 'student.unimelb.edu.au'];
    
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1];
    return universityDomains.includes(domain);
  };

  const checkDuplicateEmail = (email) => {
    const allEmails = [
      ...pendingInvitations.map(inv => inv.email),
      ...activeAdmins.map(admin => admin.email)
    ];
    return allEmails.includes(email);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!validateEmail(inviteData.email)) {
      alert('Please use a valid University of Melbourne email address');
      return;
    }
    
    if (checkDuplicateEmail(inviteData.email)) {
      alert('This email address has already been invited or is an existing admin');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call to send invitation email
    setTimeout(() => {
      setIsSubmitting(false);
      setShowInviteForm(false);
      setInviteData({ name: '', email: '', department: '' });
      
      // Show success notification
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.innerHTML = `
        <div class="flex items-center">
          <i class="fas fa-check-circle mr-2"></i>
          Invitation sent successfully to ${inviteData.email}
        </div>
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.remove();
      }, 5000);
    }, 1000);
  };

  const handleResendInvitation = async (adminId) => {
    const targetRow = document.querySelector(`[data-admin-id="${adminId}"]`);
    if (targetRow) {
      targetRow.style.transform = 'scale(0.98)';
      targetRow.style.opacity = '0.7';
      
      setTimeout(() => {
        targetRow.style.transform = 'scale(1)';
        targetRow.style.opacity = '1';
      }, 300);
    }
  };

  const handleRevokeAccess = async (adminId) => {
    if (confirm('Are you sure you want to revoke access for this administrator?')) {
      // Simulate API call
      console.log('Revoking access for admin:', adminId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'invited':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'registered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredInvitations = pendingInvitations.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAdmins = activeAdmins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header - Synced with Courses Overview Design */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-user-shield text-orange-500 text-2xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Course Administrator Management
            </h1>
            <p className="text-lg text-orange-100 mt-1">
              Invite new course administrators and manage existing accounts
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activeAdmins.filter(a => a.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-user-check text-white"></i>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Invites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {pendingInvitations.filter(i => i.status === 'invited').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-envelope text-white"></i>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activeAdmins.reduce((sum, admin) => sum + admin.coursesCount, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-university text-white"></i>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired Invites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {pendingInvitations.filter(i => i.status === 'expired').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-white"></i>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <Input
              placeholder="Search admins, emails, or departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="invited">Invited</option>
            <option value="registered">Registered</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        
        <Button
          onClick={() => setShowInviteForm(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <i className="fas fa-user-plus mr-2"></i>
          Invite Course Admin
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              <i className="fas fa-user-plus text-orange-500 mr-3"></i>
              Invite Course Administrator
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowInviteForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          
          <form onSubmit={handleInvite} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                  placeholder="Dr. Jane Smith"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  University Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  placeholder="jane.smith@student.unimelb.edu.au"
                  className="mt-1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Must be a @student.unimelb.edu.au email address</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Department *
              </Label>
              <Input
                id="department"
                value={inviteData.department}
                onChange={(e) => setInviteData({...inviteData, department: e.target.value})}
                placeholder="Computer Science"
                className="mt-1"
                required
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Invitation Process:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• The administrator will receive an invitation email with a registration link</li>
                    <li>• They must complete the 5-step onboarding process within 7 days</li>
                    <li>• The invitation will automatically expire after 7 days if not used</li>
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
                    Sending Invitation...
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
      {filteredInvitations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Pending Invitations ({filteredInvitations.length})
            </h3>
            <div className="text-xs text-gray-500">
              <i className="fas fa-clock mr-1"></i>
              Invitations expire after 7 days
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3">Administrator</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Invited Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Days Remaining</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInvitations.map((invitation) => (
                  <tr 
                    key={invitation.id} 
                    data-admin-id={invitation.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          invitation.status === 'invited' ? 'bg-gradient-to-br from-blue-400 to-purple-400' :
                          invitation.status === 'registered' ? 'bg-gradient-to-br from-green-400 to-emerald-400' :
                          'bg-gradient-to-br from-red-400 to-red-600'
                        }`}>
                          <i className={`fas ${
                            invitation.status === 'invited' ? 'fa-envelope' :
                            invitation.status === 'registered' ? 'fa-check' :
                            'fa-times'
                          } text-white`}></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{invitation.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{invitation.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{invitation.department}</td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{invitation.invitedDate}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {invitation.status === 'invited' && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-pulse"></div>}
                        {invitation.status === 'registered' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>}
                        {invitation.status === 'expired' && <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>}
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      {invitation.status === 'invited' && (
                        <span className={`text-sm font-medium ${
                          invitation.daysRemaining <= 2 ? 'text-red-600' : 
                          invitation.daysRemaining <= 4 ? 'text-orange-600' : 
                          'text-green-600'
                        }`}>
                          {invitation.daysRemaining} days
                        </span>
                      )}
                      {invitation.status === 'registered' && (
                        <span className="text-sm text-gray-500">Completed</span>
                      )}
                      {invitation.status === 'expired' && (
                        <span className="text-sm text-red-600">Expired</span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        {(invitation.status === 'invited' || invitation.status === 'expired') && (
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
                        <Button
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Active Administrators */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Active Course Administrators ({filteredAdmins.length})
          </h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {activeAdmins.filter(a => a.status === 'active').length} Active
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3">Administrator</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Courses</th>
                <th className="pb-3">Students</th>
                <th className="pb-3">Last Active</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        admin.status === 'active' 
                          ? 'bg-gradient-to-br from-green-400 to-blue-400' 
                          : 'bg-gray-400'
                      }`}>
                        <i className="fas fa-user text-white"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{admin.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{admin.department}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {admin.coursesCount} courses
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{admin.studentsManaged.toLocaleString()}</span>
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{admin.lastActive}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(admin.status)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                        admin.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      {admin.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-900">
                        <i className="fas fa-eye" title="View Details"></i>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-900">
                        <i className="fas fa-edit" title="Edit Admin"></i>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleRevokeAccess(admin.id)}
                      >
                        <i className="fas fa-user-slash" title="Revoke Access"></i>
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