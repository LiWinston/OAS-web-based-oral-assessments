'use client';

import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { adminService } from '../../../services/adminService';

export default function AdminManagementPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', department: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminData, setAdminData] = useState({
    pendingInvitations: [],
    activeAdmins: []
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit admin state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', department: '', status: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [revokingAdminId, setRevokingAdminId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Load admin data from API
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAdminList();
      if (response && response.success && response.data && 
          (response.data.pendingInvitations || response.data.activeAdmins)) {
        setAdminData(response.data);
      } else {
        // API failed, set empty data
        setAdminData({
          pendingInvitations: [],
          activeAdmins: []
        });
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      // API error, set empty data
      setAdminData({
        pendingInvitations: [],
        activeAdmins: []
      });
    } finally {
      setIsLoading(false);
    }
  };



  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const universityDomains = ['unimelb.edu.au', 'student.unimelb.edu.au'];
    
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1];
    return universityDomains.includes(domain);
  };

  const checkDuplicateEmail = (email) => {
    const allEmails = [
          ...(adminData?.pendingInvitations?.map(inv => inv.email) || []),
          ...(adminData?.activeAdmins?.map(admin => admin.email) || [])
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
      try {
        setRevokingAdminId(adminId);
        
        // Call the actual API to revoke access
        const response = await adminService.revokeAccess(adminId);
        
        if (response.success) {
          // Show success notification
          const successMessage = document.createElement('div');
          successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
          successMessage.innerHTML = `
            <div class="flex items-center">
              <i class="fas fa-check-circle mr-2"></i>
              Administrator access revoked successfully
            </div>
          `;
          document.body.appendChild(successMessage);
          
          setTimeout(() => {
            successMessage.remove();
          }, 5000);

          // Reload admin data to reflect changes
          await loadAdminData();
        } else {
          alert('Failed to revoke access. Please try again.');
        }
      } catch (error) {
        console.error('Error revoking access:', error);
        alert('Error revoking access. Please try again.');
      } finally {
        setRevokingAdminId(null);
      }
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setEditData({
      name: admin.name || '',
      email: admin.email || '',
      department: admin.department || '',
      status: admin.status || 'active'
    });
    setShowEditForm(true);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    
    if (!editingAdmin || !editingAdmin.id) {
      alert('Invalid admin data');
      return;
    }

    setIsEditing(true);
    
    try {
      // Update admin status using the API
      const response = await adminService.updateAdminStatus(editingAdmin.id, editData.status);
      
      if (response.success) {
        // Show success notification
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMessage.innerHTML = `
          <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            Admin status updated successfully
          </div>
        `;
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          successMessage.remove();
        }, 5000);

        // Close edit form and refresh data
        setShowEditForm(false);
        setEditingAdmin(null);
        setEditData({ name: '', email: '', department: '', status: '' });
        
        // Reload admin data to reflect changes
        await loadAdminData();
      } else {
        alert('Failed to update admin status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Error updating admin status. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingAdmin(null);
    setEditData({ name: '', email: '', department: '', status: '' });
  };

  const handleViewDetails = (admin) => {
    setSelectedAdmin(admin);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAdmin(null);
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
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'setup':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Debug: Log the actual data structure to understand filtering
  console.log('=== FILTER DEBUG ===');
  console.log('adminData:', adminData);
  console.log('searchTerm:', searchTerm);
  console.log('statusFilter:', statusFilter);
  if (adminData?.activeAdmins?.length > 0) {
    console.log('First admin item:', adminData.activeAdmins[0]);
    console.log('Admin status values:', adminData.activeAdmins.map(a => a.status));
  }
  console.log('=== END FILTER DEBUG ===');

  const filteredInvitations = adminData?.pendingInvitations?.filter(inv => {
    // Handle search with null safety
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
                         (inv.name && inv.name.toLowerCase().includes(searchLower)) ||
                         (inv.email && inv.email.toLowerCase().includes(searchLower)) ||
                         (inv.department && inv.department.toLowerCase().includes(searchLower));
    
    // Handle status filtering with null safety and case insensitivity
    const matchesStatus = statusFilter === 'all' || 
                         (inv.status && (
                           inv.status === statusFilter ||
                           inv.status.toLowerCase() === statusFilter.toLowerCase()
                         ));
    
    return matchesSearch && matchesStatus;
  }) || [];

  const filteredAdmins = adminData?.activeAdmins?.filter(admin => {
    // Handle search with null safety
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
                         (admin.name && admin.name.toLowerCase().includes(searchLower)) ||
                         (admin.email && admin.email.toLowerCase().includes(searchLower)) ||
                         (admin.department && admin.department.toLowerCase().includes(searchLower));
    
    // Handle status filtering with null safety and case insensitivity
    const matchesStatus = statusFilter === 'all' || 
                         (admin.status && (
                           admin.status === statusFilter ||
                           admin.status.toLowerCase() === statusFilter.toLowerCase()
                         ));
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
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
                Loading administrator data...
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-orange-500 mb-4"></i>
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading administrator data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no data
  if (!adminData || !adminData.pendingInvitations || !adminData.activeAdmins || 
      (adminData.pendingInvitations.length === 0 && adminData.activeAdmins.length === 0)) {
    return (
      <div className="space-y-6">
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
                No administrator data available
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Unable to load administrator data</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Please check your connection and try again</p>
            <Button 
              onClick={loadAdminData}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <i className="fas fa-redo mr-2"></i>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                 {adminData?.activeAdmins?.filter(a => a.status === 'active')?.length || 0}
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
                 {adminData?.pendingInvitations?.filter(i => i.status === 'invited')?.length || 0}
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
                 {adminData?.activeAdmins?.reduce((sum, admin) => sum + (admin.coursesCount || 0), 0) || 0}
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
                 {adminData?.pendingInvitations?.filter(i => i.status === 'expired')?.length || 0}
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
            <option value="pending">Pending</option>
            <option value="invited">Invited</option>
            <option value="registered">Registered</option>
            <option value="expired">Expired</option>
            <option value="setup">Setup</option>
          </select>
          
          {/* Clear filters button */}
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              <i className="fas fa-times mr-2"></i>
              Clear Filters
            </Button>
          )}
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

               {/* Edit Admin Form */}
        {showEditForm && editingAdmin && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 rounded-lg">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
               <i className="fas fa-edit text-blue-500 mr-3"></i>
               Edit Course Administrator
             </h3>
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={closeEditForm}
               className="text-gray-500 hover:text-gray-700"
             >
               <i className="fas fa-times"></i>
             </Button>
           </div>
           
           <form onSubmit={handleUpdateAdmin} className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div>
                 <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Full Name
                 </Label>
                 <Input
                   id="edit-name"
                   value={editData.name}
                   onChange={(e) => setEditData({...editData, name: e.target.value})}
                   placeholder="Dr. Jane Smith"
                   className="mt-1"
                   disabled
                 />
                 <p className="mt-1 text-xs text-gray-500">Name cannot be changed</p>
               </div>
               <div>
                 <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Email Address
                 </Label>
                 <Input
                   id="edit-email"
                   value={editData.email}
                   placeholder="jane.smith@student.unimelb.edu.au"
                   className="mt-1"
                   disabled
                 />
                 <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
               </div>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div>
                 <Label htmlFor="edit-department" className="text-sm font-medium text-gray-700 dark:text-gray-700 dark:text-gray-300">
                   Department
                 </Label>
                 <Input
                   id="edit-department"
                   value={editData.department}
                   placeholder="Computer Science"
                   className="mt-1"
                   disabled
                 />
                 <p className="mt-1 text-xs text-gray-500">Department cannot be changed</p>
               </div>
               <div>
                 <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Status *
                 </Label>
                 <select
                   id="edit-status"
                   value={editData.status}
                   onChange={(e) => setEditData({...editData, status: e.target.value})}
                   className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                   required
                 >
                   <option value="active">Active</option>
                   <option value="inactive">Inactive</option>
                   <option value="pending">Pending</option>
                   <option value="setup">Setup</option>
                 </select>
                 <p className="mt-1 text-xs text-gray-500">Select the administrator's current status</p>
               </div>
             </div>
             
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
               <div className="flex items-start space-x-3">
                 <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                 <div className="text-sm text-blue-700 dark:text-blue-300">
                   <p className="font-medium mb-1">Status Management:</p>
                   <ul className="space-y-1 text-xs">
                     <li>• <strong>Active:</strong> Administrator has full access to the system</li>
                     <li>• <strong>Inactive:</strong> Administrator's access is temporarily suspended</li>
                     <li>• <strong>Pending:</strong> Administrator is in setup process</li>
                     <li>• <strong>Setup:</strong> Administrator is completing initial configuration</li>
                   </ul>
                 </div>
               </div>
             </div>
             
             <div className="flex justify-end space-x-3">
               <Button 
                 type="button" 
                 variant="outline" 
                 onClick={closeEditForm}
               >
                 Cancel
               </Button>
               <Button 
                 type="submit" 
                 disabled={isEditing}
                 className="bg-blue-500 hover:bg-blue-600"
               >
                 {isEditing ? (
                   <>
                     <i className="fas fa-spinner fa-spin mr-2"></i>
                     Updating...
                   </>
                 ) : (
                   <>
                     <i className="fas fa-save mr-2"></i>
                     Update Status
                   </>
                 )}
               </Button>
             </div>
           </form>
              </div>
            </div>
          </div>
      )}

      {/* Pending Invitations */}
      {filteredInvitations.length > 0 && (
        <Card className="p-6">
          {/* Filter Results Summary for Pending Invitations */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Filter Results:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      <i className="fas fa-search mr-1"></i>
                      "{searchTerm}"
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <i className="fas fa-filter mr-1"></i>
                      Status: {statusFilter}
                    </span>
                  )}
                  <span className="text-blue-600 dark:text-blue-400">
                    Showing {filteredInvitations.length} of {adminData?.pendingInvitations?.length || 0} invitations
                  </span>
                </div>
              </div>
            </div>
          )}
          
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
        {/* Filter Results Summary */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
                <span className="font-medium">Filter Results:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    <i className="fas fa-search mr-1"></i>
                    "{searchTerm}"
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <i className="fas fa-filter mr-1"></i>
                    Status: {statusFilter}
                  </span>
                )}
                <span className="text-blue-600 dark:text-blue-400">
                  Showing {filteredAdmins.length} of {adminData?.activeAdmins?.length || 0} administrators
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Active Course Administrators ({filteredAdmins.length})
          </h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {adminData?.activeAdmins?.filter(a => a.status === 'active')?.length || 0} Active
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">{(admin.studentsManaged ?? 0).toLocaleString()}</span>
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{admin.lastActive}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(admin.status)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                         admin.status === 'active' ? 'bg-green-500' : 
                         admin.status === 'inactive' ? 'bg-red-500' :
                         admin.status === 'pending' ? 'bg-yellow-500' :
                         admin.status === 'setup' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></div>
                       {admin.status ? admin.status.charAt(0).toUpperCase() + admin.status.slice(1) : 'Unknown'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex space-x-2">
                                             <Button 
                         size="sm" 
                         variant="ghost" 
                         className="text-gray-600 hover:text-gray-900"
                         onClick={() => handleViewDetails(admin)}
                       >
                        <i className="fas fa-eye" title="View Details"></i>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleEditAdmin(admin)}
                      >
                        <i className="fas fa-edit" title="Edit Admin"></i>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleRevokeAccess(admin.id)}
                        disabled={revokingAdminId === admin.id}
                      >
                        {revokingAdminId === admin.id ? (
                          <i className="fas fa-spinner fa-spin" title="Revoking Access..."></i>
                        ) : (
                        <i className="fas fa-user-slash" title="Revoke Access"></i>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

               {/* Admin Details Modal */}
        {showDetailsModal && selectedAdmin && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                   <i className="fas fa-user text-blue-500 mr-3"></i>
                   Administrator Details
                 </h3>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={closeDetailsModal}
                   className="text-gray-500 hover:text-gray-700"
                 >
                   <i className="fas fa-times"></i>
                 </Button>
               </div>
               
               <div className="space-y-6">
                 {/* Basic Information */}
                 <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                   <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Basic Information</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                       <p className="text-gray-900 dark:text-gray-100">{selectedAdmin.name}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email Address</label>
                       <p className="text-gray-900 dark:text-gray-100">{selectedAdmin.email}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Department</label>
                       <p className="text-gray-900 dark:text-gray-100">{selectedAdmin.department}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAdmin.status)}`}>
                         <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                           selectedAdmin.status === 'active' ? 'bg-green-500' : 
                           selectedAdmin.status === 'inactive' ? 'bg-red-500' :
                           selectedAdmin.status === 'pending' ? 'bg-yellow-500' :
                           selectedAdmin.status === 'setup' ? 'bg-blue-500' : 'bg-gray-500'
                         }`}></div>
                         {selectedAdmin.status ? selectedAdmin.status.charAt(0).toUpperCase() + selectedAdmin.status.slice(1) : 'Unknown'}
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Course Management */}
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                   <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Course Management</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses Managed</label>
                       <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                         {selectedAdmin.coursesCount || 0}
                       </p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Students Managed</label>
                       <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                         {(selectedAdmin.studentsManaged ?? 0).toLocaleString()}
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Activity Information */}
                 <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                   <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Activity Information</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Active</label>
                       <p className="text-gray-900 dark:text-gray-100">{selectedAdmin.lastActive || 'No activity recorded'}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Created</label>
                       <p className="text-gray-900 dark:text-gray-100">{selectedAdmin.createdAt || 'Date not available'}</p>
                     </div>
                   </div>
                 </div>

                 {/* Additional Details */}
                 {selectedAdmin.phone && (
                   <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                     <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Contact Information</h4>
                     <div>
                       <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
                       <p className="text-gray-900 dark:text-gray-100">{selectedAdmin.phone}</p>
                     </div>
                   </div>
                 )}

                 {/* Notes or Comments */}
                 {selectedAdmin.notes && (
                   <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                     <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Notes</h4>
                     <p className="text-gray-700 dark:text-gray-300 text-sm">{selectedAdmin.notes}</p>
                   </div>
                 )}
               </div>

               <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                 <Button 
                   variant="outline" 
                   onClick={closeDetailsModal}
                 >
                   Close
                 </Button>
                 <Button 
                   className="bg-blue-500 hover:bg-blue-600"
                   onClick={() => {
                     closeDetailsModal();
                     handleEditAdmin(selectedAdmin);
                   }}
                 >
                   <i className="fas fa-edit mr-2"></i>
                   Edit Administrator
                 </Button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}