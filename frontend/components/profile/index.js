// Profile Components - Main Exports

// Main profile page component
export { default as UnifiedProfilePage } from './UnifiedProfilePage';

// Core profile components
export { default as ProfileHeader } from './ProfileHeader';
export { default as ProfileInfoCard } from './ProfileInfoCard';
export { default as NotificationPreferencesCard } from './NotificationPreferencesCard';
export { default as SecurityCard } from './SecurityCard';
export { default as RoleWidgetGrid } from './RoleWidgetGrid';

// These components are designed to work together as a unified profile experience
// across all user roles (Student, Examiner, Course Admin, Super Admin).
//
// Usage:
// import { UnifiedProfilePage } from '@/components/profile';
//
// Or for individual components:
// import { ProfileHeader, ProfileInfoCard } from '@/components/profile';