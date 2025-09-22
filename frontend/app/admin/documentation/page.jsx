'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocumentationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  const heroStats = [
    { value: '12', label: 'Active courses this term' },
    { value: '48', label: 'Assessments in configuration' },
    { value: '24h', label: 'Default booking lockout' }
  ];

  const heroActions = [
    {
      href: '/admin/onboarding',
      label: 'Open Onboarding Hub',
      icon: 'fas fa-rocket',
      variant: 'solid'
    },
    {
      href: '/admin/results',
      label: 'Review Results Console',
      icon: 'fas fa-chart-line',
      variant: 'ghost'
    }
  ];

  const quickLinks = [
    {
      href: '/admin/courses',
      icon: 'fas fa-layer-group',
      title: 'Courses & Assignments',
      description: 'Create courses, duplicate rubrics, and release schedules confidently.'
    },
    {
      href: '/admin/users',
      icon: 'fas fa-user-plus',
      title: 'Roster & Access',
      description: 'Invite examiners and students, track onboarding status, and manage permissions.'
    },
    {
      href: '/admin/onboarding',
      icon: 'fas fa-envelope-open-text',
      title: 'Invitation Pipeline',
      description: 'Monitor expiring invites and resend reminders with one click.'
    },
    {
      href: '/admin/results',
      icon: 'fas fa-chart-bar',
      title: 'Results Management',
      description: 'Aggregate marks, quality-check feedback, and control release windows.'
    },
    {
      href: '/admin/profile',
      icon: 'fas fa-id-badge',
      title: 'Team Profile',
      description: 'Update faculty details, notification preferences, and security options.'
    },
    {
      href: '/admin/documentation',
      icon: 'fas fa-book-open',
      title: 'Full Documentation',
      description: 'Bookmark this hub for policies, best practices, and troubleshooting tips.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: 'fas fa-th-large' },
    { id: 'getting-started', name: 'Getting Started', icon: 'fas fa-rocket' },
    { id: 'courses', name: 'Course Management', icon: 'fas fa-book' },
    { id: 'assignments', name: 'Assignments & Rubrics', icon: 'fas fa-tasks' },
    { id: 'scheduling', name: 'Scheduling & Booking', icon: 'fas fa-calendar-alt' },
    { id: 'assessment', name: 'Assessment & Marking', icon: 'fas fa-edit' },
    { id: 'results', name: 'Results & Reports', icon: 'fas fa-chart-bar' },
    { id: 'users', name: 'User & Access Control', icon: 'fas fa-user-shield' },
    { id: 'notifications', name: 'Notifications & Comms', icon: 'fas fa-envelope-open-text' },
    { id: 'integrations', name: 'Canvas & Data', icon: 'fas fa-file-csv' },
    { id: 'technical', name: 'Technical Support', icon: 'fas fa-cog' }
  ];

  const faqData = [
    {
      category: 'getting-started',
      question: 'How do I get started with OAS as a new Course Administrator?',
      answer: `Welcome to OAS! Here's your quick start guide:

**Step 1: Account Setup**
- You'll receive an invitation email from a Super Administrator
- Click the link to complete your 5-step onboarding process
- Set up your password and department information

**Step 2: Create Your First Course**
- Navigate to "Courses" in the sidebar
- Click "New Course" button
- Fill in course details (name, code, year, semester)
- Your course is now ready for assignment configuration!

**Next Steps:**
- Create assignments for your oral assessments
- Import student data via CSV
- Set up marking rubrics
- Configure time slots for assessments`
    },
    {
      category: 'getting-started',
      question: 'What are the different user roles in OAS?',
      answer: `OAS has four main user roles, each with specific permissions:

**Super Administrator**
- Manages Course Administrator accounts
- Views system-wide course overview
- Controls access to the platform

**Course Administrator (You)**
- Creates and manages courses
- Configures assignments and rubrics
- Imports student data and manages scheduling
- Controls result publication and exports to Canvas

**Examiner**
- Self-assigns to examination time slots
- Conducts assessments using the marking interface
- Provides scores and feedback to students

**Student**
- Books examination time slots
- Views results and feedback once published
- Manages their assessment schedule`
    },
    {
      category: 'users',
      question: 'How do I onboard examiners and students into an assignment?',
      answer: `Onboarding follows a role-aware invitation flow:

**Course Admin Invites**
- Create the course and assignment first so the roster has context
- Import students and examiners via CSV (Canvas export works out-of-the-box)
- The system emails personalised onboarding links that expire automatically

**Student/Examiner Journey**
- Clicking the link launches the unified onboarding page
- Users set their password, confirm profile details, and land directly on their dashboard
- Progress is tracked so you can see who has completed onboarding`
    },
    {
      category: 'users',
      question: 'Can I control who sees scheduling or marking features?',
      answer: `Yes—permissions are enforced per assignment and role:

- Only examiners assigned to an assignment can self-assign sessions or open its marking workspace
- Students only see schedules after you release them and once timeslots are fully staffed
- Admin-only settings (assignment configuration, rubrics, CSV import/export) are hidden from other roles
- Super Admins can temporarily revoke your course access if required for compliance`
    },
    {
      category: 'courses',
      question: 'How do I create a new course in OAS?',
      answer: `Creating a course is straightforward:

**Via Course Management Page:**
1. Go to "Courses" in the sidebar navigation
2. Click the "New Course" button (blue button in top-right)
3. Fill in the course creation form:
   - **Course Name**: e.g., "Software Project Management"
   - **Course Code**: e.g., "COMP90082" (University of Melbourne format)
   - **Academic Year**: Select current or future year
   - **Semester**: Choose Semester 1, 2, or Summer Term
   - **Description**: Optional course description
4. Click "Create Course"

**What Happens Next:**
- Your course appears in both table and card views
- You can immediately start creating assignments
- Course statistics are updated in your dashboard
- You'll be redirected to assignment configuration if desired

**Pro Tip:** Use consistent naming conventions for easy course management across semesters.`
    },
    {
      category: 'courses',
      question: 'Can I edit course details after creation?',
      answer: `Yes! You can edit course information at any time:

**How to Edit:**
- In Course Management, click the "Edit" button (pencil icon) in either table or card view
- The Edit Course modal will open with current information
- Modify any field except the course code (for data integrity)
- Changes are saved immediately

**What You Can Edit:**
- Course name and description
- Academic year and semester
- Course status (Active/Archived)

**What You Cannot Edit:**
- Course code (used as unique identifier)
- Historical assignment data

**Unsaved Changes Warning:**
- The system detects unsaved changes
- You'll see a warning if you try to close without saving
- A summary preview shows what will be changed`
    },
    {
      category: 'assignments',
      question: 'What types of assignments can I create in OAS?',
      answer: `OAS supports three types of oral assessments:

**Individual Assignments**
- Each student is assessed individually
- Personal time slot booking
- Individual rubric scoring
- Separate feedback for each student

**Group Assignments**
- Entire group assessed together
- One booking per group (any member can book)
- Shared group scoring and feedback
- All group members receive same marks

**Mixed Assignments (Individual + Group Components)**
- Combines both assessment types
- Group portions: shared activities, teamwork evaluation
- Individual portions: personal contribution, specific skills
- Separate scoring for group vs individual components
- Final grade combines both elements

**Choosing the Right Type:**
- **Individual**: Traditional oral exams, presentations, vivas
- **Group**: Team presentations, collaborative projects
- **Mixed**: Complex projects with both team and individual evaluation

**Configuration Impact:**
- Assignment type affects booking workflow
- Determines rubric structure options
- Influences result calculation methods`
    },
    {
      category: 'assignments',
      question: 'How do I create effective rubrics for oral assessments?',
      answer: `Creating clear, fair rubrics is crucial for consistent assessment:

**Rubric Builder Features:**
- **Hierarchical Structure**: Main criteria with optional sub-criteria
- **Flexible Performance Levels**: Define your own levels (e.g., Excellent, Good, Satisfactory, Needs Improvement)
- **Custom Point Values**: Assign specific points to each level
- **Predefined Comments**: Create comment libraries for efficient feedback

**Best Practices:**

**1. Clear Criteria Definition**
- Use specific, measurable criteria
- Focus on observable behaviors and skills
- Avoid vague terms like "good" or "adequate"

**2. Performance Level Design**
- 3-5 levels work best for oral assessments
- Use descriptive names that students understand
- Ensure point values reflect performance differences

**3. Comment Libraries**
- Create positive and constructive feedback options
- Include specific examples of good/poor performance
- Allow examiners to add new comments during marking

**4. Testing & Refinement**
- Test rubrics with a small group first
- Gather examiner feedback on clarity
- Refine based on actual usage experience

**Example Structure:**
- **Communication Skills** (20 points)
  - Excellent (18-20): Clear, confident delivery
  - Good (14-17): Generally clear with minor issues
  - Satisfactory (10-13): Understandable but needs improvement
  - Needs Work (0-9): Difficult to understand`
    },
    {
      category: 'assignments',
      question: 'How do I reuse rubrics or comment libraries across semesters?',
      answer: `Our reuse plan keeps high-quality assessment assets evergreen:

**Copy from Existing Assignment**
- Choose "Duplicate" when creating a new assignment to clone rubric structure and comment libraries
- Adjust weighting or criteria labels without losing historical versions

**Comment Library Governance**
- Predefined comments are scoped at the assignment level so you can curate wording for each cohort
- Examiners can propose new comments during marking; you approve or refine them afterwards

**Quality Tracking**
- Rubric change logs capture who updated criteria and why, supporting moderation discussions`
    },
    {
      category: 'scheduling',
      question: 'How do I set up time slots for oral examinations?',
      answer: `Time slot configuration is a multi-step process:

**Step 1: Define Session Parameters**
- **Session Length**: Typical oral exams are 15-30 minutes
- **Gap Time**: Buffer between sessions (usually 5-10 minutes)
- **Examiners Required**: Usually 1-2 examiners per session
- **Venue Information**: Room numbers, building locations

**Step 2: Create Time Slots**
- Navigate to Scheduling section in your assignment
- Click "Add Time Slot"
- Set date, start time, end time
- Specify venue and examiner requirements
- Define capacity (how many sessions per slot)

**Step 3: Examiner Assignment**
- Invite examiners to your course/assignment
- Set limits on sessions per examiner (e.g., max 5 sessions)
- Examiners self-assign to available slots
- Monitor slot coverage via Scheduling Overview

**Step 4: Validation & Opening**
- Ensure all slots have required examiners
- Check for scheduling conflicts
- Open booking for students once slots are ready

**Pro Tips:**
- Create parallel slots for high-enrollment courses
- Buffer extra time for complex assessments
- Consider examiner availability and fairness
- Plan for potential no-shows or technical issues`
    },
    {
      category: 'scheduling',
      question: 'What happens if a time slot doesn\'t have enough examiners?',
      answer: `Insufficient examiner coverage is automatically handled:

**System Behavior:**
- Slots without required examiners are marked "Invalid"
- Students cannot book invalid slots
- Scheduling Overview highlights problematic slots
- Warning indicators show examiner shortfall

**Resolution Options:**

**1. Recruit More Examiners**
- Add additional examiners to the course
- Send reminder emails to existing examiners
- Contact department for additional staff

**2. Adjust Slot Requirements**
- Reduce examiners required (if academically acceptable)
- Combine or consolidate time slots
- Modify assessment format if necessary

**3. Examiner Redistribution**
- Ask examiners to move between slots
- Use session limits to encourage spread
- Manual assignment by administrator if needed

**Prevention Strategies:**
- Plan examiner recruitment early
- Set realistic session limits per examiner
- Maintain buffer slots for unexpected issues
- Regular monitoring during sign-up period

**Monitoring Tools:**
- Scheduling Overview report shows real-time status
- Dashboard alerts for understaffed slots
- Email notifications for critical shortfalls`
    },
    {
      category: 'scheduling',
      question: 'When should I release the schedule to students?',
      answer: `Best practice is to release only when the schedule is healthy:

**Pre-Release Checks**
- All sessions under each timeslot have the minimum required examiners
- Lockout window and booking deadline reflect your course policy
- Notification copy for release email is reviewed (auto-generated from your settings)

**After Release**
- Students see only the fully staffed sessions
- Dashboards add "Book now" tasks with urgency indicators
- You can still adjust staffing; if coverage drops, affected sessions disappear for students until fixed`
    },
    {
      category: 'assessment',
      question: 'How do examiners use the marking interface during oral exams?',
      answer: `The marking interface is designed for real-time assessment:

**Access & Setup:**
- Examiners log in and view their schedule
- Click on active session to open marking interface
- Student/group information displays automatically
- Rubric criteria load with predefined options

**Marking Process:**

**1. Criterion-by-Criterion Scoring**
- Select performance level for each criterion
- Points auto-calculate based on selection
- Add comments from predefined library
- Write custom feedback as needed

**2. Comment Management**
- Choose from Course Admin's comment library
- Add new comments that benefit future marking
- Combine multiple comments for comprehensive feedback
- Use "Notes" field for internal observations

**3. Draft & Final Submission**
- Save drafts during or after assessment
- Return later to complete marking
- Final submission locks the assessment
- Clear indicators show completion status

**Group Assessment Features:**
- Toggle between group and individual components
- Separate scoring for each student in mixed assessments
- Shared group feedback with individual notes

**Quality Assurance:**
- Progress indicators show completion
- Validation ensures all criteria are scored
- Review screen before final submission
- Automatic backup of work in progress`
    },
    {
      category: 'assessment',
      question: 'What is the process for reopening a submitted assessment?',
      answer: `Occasionally you may need an examiner to make corrections:

- Locate the assessment in Results → Marking Review and choose "Reopen"
- The examiner is notified instantly and the record returns to Draft status
- All previous scores and comments remain intact—examiners simply adjust and resubmit
- Audit history records the reopen reason and who initiated it`
    },
    {
      category: 'results',
      question: 'How do I control when students can see their results?',
      answer: `Result publication is entirely under Course Administrator control:

**Default State:**
- All results are hidden from students initially
- Examiners can complete marking without student visibility
- Allows for review and quality control before release

**Review Process:**
1. **Mark Aggregation**: System calculates final scores
2. **Admin Review**: Check all results for consistency
3. **Manual Adjustments**: Make corrections if needed
4. **Quality Check**: Verify feedback quality and completeness

**Publication Options:**

**Individual Release:**
- Release results for specific students/groups
- Useful for rolling completion of assessments
- Allows for targeted feedback delivery

**Bulk Release:**
- Release all results simultaneously
- Typical for end-of-assessment-period
- Ensures fairness and consistency

**Release Process:**
1. Navigate to Results Management
2. Review aggregated scores and feedback
3. Select students/groups for release
4. Click "Release Results"
5. Students receive notification email
6. Results become visible in student portals

**Post-Release:**
- Students can view scores and detailed feedback
- Download or print their assessment results
- Access rubric breakdown and examiner comments
- Contact course staff for clarification if needed

**Best Practice:** Always review a sample of results before bulk release to ensure quality and accuracy.`
    },
    {
      category: 'results',
      question: 'How do I export results to Canvas LMS?',
      answer: `OAS provides seamless Canvas integration via CSV export:

**Export Process:**
1. **Complete All Assessments**: Ensure all marking is finished
2. **Release Results**: Publish results to students first
3. **Navigate to Export**: Go to Results → Canvas Export
4. **Generate CSV**: Click "Export to Canvas Format"
5. **Download File**: Save the Canvas-compatible CSV

**CSV File Contents:**
- Student ID (Canvas-compatible format)
- Student Name
- Final Grade (numerical score)
- Feedback Comments (aggregated)
- Assignment Identifier
- Submission Date

**Canvas Upload Steps:**
1. Log into your Canvas course
2. Navigate to Gradebook
3. Import → CSV File
4. Upload the exported file
5. Map columns to Canvas gradebook
6. Verify data and confirm import

**Data Validation:**
- System ensures Canvas column format compliance
- Validates student ID matching
- Checks grade value ranges
- Provides preview before export

**Troubleshooting:**
- Ensure student IDs match Canvas exactly
- Check for special characters in names
- Verify grade scaling (percentage vs points)
- Contact IT support for Canvas integration issues

**Best Practice:** Test with a small group first, then perform full export once process is verified.`
    },
    {
      category: 'notifications',
      question: 'Which notifications are sent automatically and can I customise them?',
      answer: `The notification system keeps stakeholders aligned:

**Out-of-the-box emails**
- Onboarding invitations for students and examiners
- Booking confirmations, reschedule updates, and cancellations
- Examiner reminders for upcoming sessions (configurable frequency)
- Result release announcements to students

**Customisation Options**
- Edit subject lines and intro paragraphs per assignment
- Include calendar attachments for booking emails
- Pause reminders temporarily during major timetable changes`
    },
    {
      category: 'notifications',
      question: 'How do I broadcast last-minute changes?',
      answer: `Use the Notifications hub:

- Create a targeted message filtered by role, course, or assignment
- Choose delivery: email only, in-app banner, or both
- Include schedule links so recipients can act immediately
- Track open rates and resend to anyone who missed the update`
    },
    {
      category: 'integrations',
      question: 'What data formats are supported for Canvas import/export?',
      answer: `CSV integration mirrors Canvas templates:

- Import: studentId, name, email, optional groupId columns—export directly from Canvas to avoid formatting issues
- Re-import: preview diff highlights additions, removals, and updates before committing
- Export: grade, score, examiner feedback, and Canvas assignment identifier—all UTF-8 encoded with quoted fields for safety`
    },
    {
      category: 'integrations',
      question: 'How can I reconcile Canvas and OAS after grades change?',
      answer: `If moderation changes grades post-export:

- Re-open the assignment in OAS, adjust final marks, and re-release if needed
- Generate a fresh Canvas CSV; modified rows include an "Updated" badge in the preview
- Canvas import recognises existing submissions and updates in-place—no need to delete prior attempts`
    },
    {
      category: 'technical',
      question: 'How do I import student data from CSV files?',
      answer: `CSV import is essential for populating your assignments with participants:

**Supported CSV Format:**
\`\`\`
Student ID,Name,Email,Group ID
s1234567,John Smith,john.smith@student.unimelb.edu.au,Group-A
s1234568,Jane Doe,jane.doe@student.unimelb.edu.au,Group-A
s1234569,Bob Wilson,bob.wilson@student.unimelb.edu.au,Group-B
\`\`\`

**Import Process:**
1. **Navigate to Assignment**: Go to specific assignment needing participants
2. **Access Import**: Click "Import Students" or "Manage Participants"
3. **Upload File**: Select CSV file from your computer
4. **Preview Data**: Review parsed information for accuracy
5. **Confirm Import**: Accept the import after verification

**Data Validation:**
- **Email Format**: Must be valid university email addresses
- **Student ID**: Unique identifiers (no duplicates)
- **Group Assignment**: Optional but must be consistent
- **Name Format**: Full names for proper identification

**Error Handling:**
- **Format Errors**: Clear messages for incorrect CSV structure
- **Duplicate Detection**: Warnings for existing students
- **Missing Data**: Flags for required fields

**Re-import Capability:**
- Update student lists during semester
- Preview changes before overwriting
- Maintain booking history during updates
- Handle withdrawals and additions gracefully

**Best Practices:**
- Export from Canvas for guaranteed compatibility
- Keep backup of original files
- Test with small files first
- Verify group assignments carefully

**Common Issues:**
- Encoding problems (use UTF-8)
- Excel date formatting interference
- Special characters in names
- Inconsistent group naming`
    },
    {
      category: 'technical',
      question: 'What browsers and devices are supported?',
      answer: `OAS is optimized for modern web browsers and devices:

**Recommended Browsers:**
- **Chrome 90+** (Primary recommendation)
- **Firefox 88+** (Excellent support)
- **Safari 14+** (macOS/iOS)
- **Edge 90+** (Windows)

**Device Support:**

**Desktop/Laptop (Primary):**
- **Windows 10/11**: Full functionality
- **macOS**: Complete feature support
- **Linux**: Core features supported
- **Screen Resolution**: 1024×768 minimum, 1920×1080 recommended

**Tablet Support:**
- **iPad (iOS 14+)**: Good for examiner marking interface
- **Android Tablets**: Basic functionality
- **Touch Interface**: Optimized for examiner workflow

**Mobile Limitations:**
- **Smartphones**: Basic viewing only
- **Administrative Functions**: Desktop recommended
- **Complex Forms**: Better on larger screens

**Technical Requirements:**
- **JavaScript**: Must be enabled
- **Cookies**: Required for authentication
- **Local Storage**: Used for draft saving
- **Internet Connection**: Stable connection recommended

**Performance Optimization:**
- Responsive design for various screen sizes
- Offline draft saving capability
- Optimized loading for slow connections
- Minimal bandwidth usage for mobile devices

**Accessibility:**
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode available

**Known Issues:**
- Internet Explorer: Not supported
- Very old browser versions: Limited functionality
- Slow connections: May experience delays in real-time features`
    },
    {
      category: 'technical',
      question: 'How do I troubleshoot common login and access issues?',
      answer: `Most access issues can be resolved with these steps:

**Login Problems:**

**1. Forgotten Password**
- Click "Forgot Password" on login page
- Enter your university email address
- Check email for reset link (including spam folder)
- Follow instructions to create new password

**2. Account Not Found**
- Verify you're using correct email address
- Check if you've been added to the system by Super Admin
- Contact your Course Coordinator for account creation
- Ensure you're using university email domain

**3. Browser Issues**
- Clear browser cache and cookies
- Disable browser extensions temporarily
- Try incognito/private browsing mode
- Switch to recommended browser (Chrome/Firefox)

**Permission Errors:**

**1. Course Access Denied**
- Verify you're assigned to the correct course
- Check your user role (Student/Examiner/Admin)
- Contact Course Administrator for access
- Ensure course is active and not archived

**2. Feature Unavailability**
- Some features are role-restricted
- Time-sensitive features may be disabled
- Check with Course Admin for feature access
- Verify assignment is in correct phase

**Network & Performance Issues:**

**1. Slow Loading**
- Check internet connection stability
- Close unnecessary browser tabs
- Disable bandwidth-heavy applications
- Try accessing during off-peak hours

**2. Session Timeouts**
- Save work frequently during long sessions
- Log out and back in to refresh session
- Check if multiple tabs are open
- Contact IT if timeouts persist

**Getting Help:**
- Document specific error messages
- Note browser and device information
- Contact Course Administrator first
- Escalate to IT support if needed
- Use built-in feedback system for bug reports`
    }
  ];

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatAnswer = (answer) => {
    return answer.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h4 key={index} className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">{line.slice(2, -2)}</h4>;
      } else if (line.startsWith('- **') && line.includes('**:')) {
        const [boldPart, regularPart] = line.split('**:');
        return (
          <li key={index} className="ml-4 mb-1">
            <span className="font-medium text-gray-800 dark:text-gray-200">{boldPart.slice(3)}:</span>
            <span className="text-gray-600 dark:text-gray-400">{regularPart}</span>
          </li>
        );
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1 text-gray-600 dark:text-gray-400">{line.slice(2)}</li>;
      } else if (line.trim().startsWith('```')) {
        return <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono my-2 overflow-x-auto">{line.slice(3)}</pre>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="mb-2 text-gray-600 dark:text-gray-400">{line}</p>;
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <nav className="text-sm bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <ol className="flex items-center space-x-2">
            <li className="flex items-center">
              <Link
                href="/admin"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center transition-colors"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">OAS</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">Dashboard</span>
              </Link>
            </li>
            <li className="flex items-center">
              <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Documentation
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold">Course Admin Companion</h1>
            <p className="mt-2 text-sm text-blue-50">
              Operational guidance for configuring courses, orchestrating schedules, and releasing results with confidence.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {heroActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action.variant === 'solid'
                      ? 'bg-white text-blue-700 hover:bg-blue-100'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <i className={`${action.icon} mr-2`}></i>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {heroStats.map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-lg font-semibold">{stat.value}</p>
                <p className="text-xs text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </span>
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <i className={`${category.icon} text-xs`}></i>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-gray-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or selecting a different category
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const categoryInfo = categories.find(cat => cat.id === faq.category);
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <i className={`${categoryInfo?.icon} text-blue-600 dark:text-blue-400 text-sm`}></i>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {categoryInfo?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <i className={`fas fa-chevron-${expandedSections[index] ? 'up' : 'down'} text-gray-400 transition-transform duration-200`}></i>
                  </div>
                </button>
                
                {expandedSections[index] && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400">
                        {formatAnswer(faq.answer)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Access Links */}
      <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-3 p-5 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-white shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center text-sm font-semibold">
                <i className={`${link.icon} mr-3 text-base`}></i>
                {link.title}
              </div>
              <p className="text-sm text-blue-100 group-hover:text-white/90">
                {link.description}
              </p>
              <span className="text-xs font-medium text-white/80">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-headset text-blue-600 dark:text-blue-400 text-lg"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Need More Help?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <i className="fas fa-envelope mr-2"></i>
            Contact Support
          </button>
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <i className="fas fa-bug mr-2"></i>
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
}
