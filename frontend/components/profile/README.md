# Profile Implementation Documentation

## Overview

The profile system has been completely redesigned and implemented according to the specifications in the design documents. It provides a unified, role-aware profile experience across all user types in the OAS system.

## Architecture

### Backend Integration
- **Endpoints**: Integrates with `/api/profile/me`, `/api/profile`, `/api/profile/preferences`, and `/api/auth/change-password`
- **Data Structure**: Follows the `ProfileResponse` schema with `user`, `preferences`, and `widgets` fields
- **Role Widgets**: Supports role-specific widgets through the `ProfileWidgetService`

### Frontend Components

#### Core Components
1. **UnifiedProfilePage** - Main profile page component used across all roles
2. **ProfileHeader** - User avatar, role badge, completeness meter, and primary action
3. **ProfileInfoCard** - Personal information management with edit/save functionality
4. **NotificationPreferencesCard** - Role-aware notification settings
5. **SecurityCard** - Password management and security information
6. **RoleWidgetGrid** - Dynamic role-specific widgets

#### Widget System
The widget system maps backend widget keys to specific frontend components:

- **Student Widgets**:
  - `student.nextSession` → Next booking display
  - `student.recentSessions` → Recent session history

- **Examiner Widgets**:
  - `examiner.nextSession` → Upcoming examination with countdown
  - `examiner.recentSessions` → Recent examinations with feedback links

- **Admin Widgets**:
  - `admin.managedCourses` → Course overview with progress indicators
  - `admin.pendingTasks` → KPI tiles for unstaffed sessions, open bookings, etc.

- **Super Admin Widgets**:
  - `superadmin.pendingApprovals` → Approval queue count
  - `superadmin.systemMetrics` → System statistics and metrics

## Implementation Details

### Profile Service Updates
```javascript
// Updated to match backend API structure
profileService.getProfile()        // Returns full ProfileResponse
profileService.updateProfile(data) // Updates profile fields
profileService.updatePreferences(prefs) // Updates notification preferences
profileService.changePassword(current, new) // Changes password
```

### Page Structure
All role-specific profile pages now use the same unified component:

```javascript
import UnifiedProfilePage from '../../../components/profile/UnifiedProfilePage';

export default function RoleProfile() {
  return <UnifiedProfilePage />;
}
```

### Features Implemented

#### 1. Profile Header
- Gradient avatar with user initials
- Role-specific badge colors
- Profile completeness meter (0-100%)
- Contextual primary action button

#### 2. Personal Information Management
- Inline editing with validation
- Role-specific fields (e.g., Student ID for students)
- Timezone and language selection
- Real-time form validation

#### 3. Notification Preferences
- Role-aware notification categories
- Channel-specific toggles (Email/Desktop)
- Domain-specific preferences (Bookings, Results, etc.)
- Unsaved changes detection

#### 4. Security Management
- Password strength meter
- Show/hide password toggles
- Policy enforcement (8+ characters, mixed case, etc.)
- Security activity placeholder

#### 5. Role-Specific Widgets
- Dynamic widget rendering based on backend data
- Empty state handling
- Contextual actions linking to relevant pages
- Progressive loading with skeleton states

## Design Compliance

### Visual Design
- **Color Palette**: Uses design system tokens (indigo primary, role-specific badge colors)
- **Typography**: Inter font family with consistent hierarchy
- **Spacing**: 24px outer gutters, 16px internal spacing
- **Cards**: `rounded-xl` corners with `shadow-lg` elevation
- **Dark Mode**: Full parity with automatic theme transitions

### Responsive Layout
- **Desktop**: Two-column layout (8/4 split)
- **Tablet**: Maintains two-column with adjusted proportions
- **Mobile**: Single column stack with condensed header

### Accessibility
- WCAG 2.1 AA compliant color contrast
- Keyboard navigation support
- Screen reader labels for all interactive elements
- Focus management and visual indicators

## API Integration

### Profile Loading
```javascript
// Backend returns ProfileResponse
{
  user: {
    userId: number,
    email: string,
    name: string,
    role: string,
    department?: string,
    phone?: string,
    timezone: string,
    language: string,
    completeness: number,
    lastUpdatedAt: string
  },
  preferences: {
    email: boolean,
    desktop: boolean,
    bookingUpdates: boolean,
    examinerUpdates: boolean,
    assignmentUpdates: boolean,
    resultUpdates: boolean,
    groupUpdates: boolean,
    systemAlerts: boolean
  },
  widgets: [
    {
      key: string,
      title: string,
      description: string,
      payload: object
    }
  ],
  generatedAt: string
}
```

### State Management
- Uses Zustand auth store for user session data
- Local component state for form management
- Optimistic updates with error rollback
- Real-time profile completeness calculation

## Error Handling

### Form Validation
- Real-time field validation
- Clear error messaging
- Prevents submission with validation errors

### API Error Handling
- Network error recovery
- Graceful degradation for missing data
- User-friendly error messages
- Retry mechanisms

### Loading States
- Skeleton placeholders during initial load
- Progressive loading for widgets
- Button loading states during mutations

## Testing Considerations

### Manual Testing Scenarios
1. **Profile Loading**: Verify data loads correctly for each role
2. **Field Updates**: Test personal information editing and saving
3. **Preferences**: Verify notification preference changes persist
4. **Password Change**: Test password validation and change flow
5. **Widget Interactions**: Verify widget actions navigate correctly
6. **Error Handling**: Test network failures and invalid data
7. **Responsive Design**: Test across different screen sizes
8. **Dark Mode**: Verify theme consistency

### Browser Support
- Modern browsers (Chrome 88+, Firefox 85+, Safari 14+)
- Responsive design across viewport sizes
- Touch-friendly mobile interactions

## Deployment Notes

### Environment Configuration
- Ensure backend profile endpoints are deployed
- Verify role-based access controls
- Configure proper CORS settings

### Feature Flags
- Can be rolled out behind `profile_page_v2` feature flag
- Maintains backward compatibility with existing pages
- Gradual rollout capability

## Future Enhancements

### Planned Features
- Avatar upload functionality
- Device management and session tracking
- Audit timeline for profile changes
- Enhanced security settings
- Bulk preference management for admins

### Performance Optimizations
- Widget data caching
- Lazy loading for complex widgets
- Image optimization for avatars
- Bundle size optimization

## Troubleshooting

### Common Issues
1. **Widget not displaying**: Check widget key mapping in RoleWidgetGrid
2. **Form not saving**: Verify API endpoint connectivity and payload structure
3. **Validation errors**: Check field requirements and validation rules
4. **Theme issues**: Verify CSS class names and dark mode compatibility

### Debug Tools
- Console logging for API responses
- React DevTools for component state
- Network tab for API monitoring
- Development mode shows debug info

## Support

For implementation questions or issues:
1. Check the design documents in `/Docs/Design/`
2. Review backend ProfileController and ProfileService
3. Test with mock data using development tools
4. Verify API responses match expected schema