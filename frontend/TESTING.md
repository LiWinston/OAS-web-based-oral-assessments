# Testing the OAS Frontend

## Mock Authentication System

The frontend includes a mock authentication service that allows you to test the entire login flow without a backend server.

### Available Test Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Course Admin | `admin@example.com` | `Admin123!` | Full admin dashboard access |
| Student | `student@example.com` | `Student123!` | Student interface |
| Examiner | `examiner@example.com` | `Examiner123!` | Examiner dashboard |
| Super Admin | `superadmin@example.com` | `Super123!` | System administration |

### How to Test

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the login page:**
   Open http://localhost:3000/login

3. **Quick Fill Test Accounts:**
   - Click any "Fill" button next to the test accounts
   - Or manually enter the credentials above

4. **Test the Login Flow:**
   - Click "Sign in" to authenticate
   - You'll be redirected to the appropriate dashboard based on your role
   - The mock API simulates realistic network delays (800ms)

5. **Test Role-based Routing:**
   - Course Admin → `/admin` dashboard
   - Student → `/student` dashboard  
   - Examiner → `/examiner` dashboard
   - Super Admin → `/superadmin` dashboard

6. **Test the Onboarding Flow:**
   - Visit `/admin/onboarding` directly
   - Or click "Try Admin Onboarding Flow" from the login page
   - Experience the enhanced 5-step onboarding wizard

### Mock API Features

- **Realistic Delays:** Simulates network latency
- **Proper Error Handling:** Invalid credentials show appropriate errors
- **JWT-like Tokens:** Generates mock tokens for testing
- **Role-based Data:** Each user has appropriate role-specific data
- **Logout Functionality:** Complete session management

### Switching to Real Backend

To use the real backend instead of mock data:

1. Set environment variable:
   ```bash
   NEXT_PUBLIC_DISABLE_MOCK=true
   ```

2. Ensure your backend is running on `http://localhost:8081`

3. The app will automatically switch to real API calls

### Features to Test

✅ **Login Flow**
- Form validation
- Error handling
- Loading states
- Role-based redirects

✅ **Admin Onboarding**
- Multi-step wizard
- Progress tracking
- Form validation
- Animated completion

✅ **Navigation**
- Role-specific dashboards
- Logout functionality
- Responsive design

✅ **UX Enhancements**
- Loading animations
- Success feedback
- Error messages
- Dark mode support

### Console Output

Check the browser console for:
- Available test account details
- Mock API request logs
- Authentication flow debugging

---

**Happy Testing!** 🚀
