import { registerSearchSources } from '../registry';
import { courseService } from '@/services/courseService';
import { assignmentService } from '@/services/assignmentService';

const MAX_ASSIGNMENT_COURSES = Infinity;

const QUICK_LINKS = [
  {
    id: 'quick-dashboard',
    title: 'Dashboard',
    subtitle: 'Overview of courses and assignments',
    href: '/admin',
    keywords: 'dashboard overview home',
  },
  {
    id: 'quick-courses',
    title: 'Courses',
    subtitle: 'Manage course configurations',
    href: '/admin/courses',
    keywords: 'courses list management',
  },
  {
    id: 'quick-users',
    title: 'Users',
    subtitle: 'Manage examiners and students',
    href: '/admin/users',
    keywords: 'users admin examiners students',
  },
  {
    id: 'quick-results',
    title: 'Results',
    subtitle: 'Moderate and release scores',
    href: '/admin/results',
    keywords: 'results moderation release scores',
  },
  {
    id: 'quick-support',
    title: 'Support Centre',
    subtitle: 'Get help and contact support',
    href: '/admin/support',
    keywords: 'support help assistance contact',
  },
  {
    id: 'quick-docs',
    title: 'Documentation',
    subtitle: 'Guides, flows, and release notes',
    href: '/admin/documentation',
    keywords: 'documentation guides handbook knowledge',
  },
];

const resolveCourseId = (course) =>
  course?.id ?? course?.courseId ?? course?.subjectId ?? course?.courseID;

const toCourseItem = (course) => {
  const courseId = resolveCourseId(course);
  return {
    id: `course-${courseId ?? 'unknown'}`,
    title: course.courseName || 'Untitled Course',
    subtitle: course.courseCode || 'Course',
    href: courseId ? `/admin/courses/${courseId}/assignments` : '/admin/courses',
    keywords: [
      course.courseName,
      course.courseCode,
      course.semester ? `semester ${course.semester}` : '',
      course.academicYear ? String(course.academicYear) : '',
    ]
      .filter(Boolean)
      .join(' '),
  };
};

const buildAssignmentItems = (assignment, course) => {
  const courseId = resolveCourseId(course);
  const assignmentId = assignment?.id ?? assignment?.assignmentId;
  if (!courseId || !assignmentId) {
    return {
      results: null,
      rubrics: null,
      schedules: null,
    };
  }

  const baseKeywords = [
    assignment.name,
    assignment.description,
    assignment.type,
    course.courseName,
    course.courseCode,
    assignmentId,
  ]
    .filter(Boolean)
    .join(' ');

  const resultsItem = {
    id: `assignment-results-${assignmentId}`,
    title: assignment.name || 'Untitled Assignment',
    subtitle: course.courseCode
      ? `${course.courseCode} • Results`
      : 'Assessment Results',
    href: `/admin/courses/${courseId}/assignments/${assignmentId}/results`,
    keywords: `${baseKeywords} results moderation release`,
  };

  const rubricStatus = assignment.hasRubric
    ? 'rubric configured'
    : 'set up rubric';
  const rubricItem = {
    id: `assignment-rubric-${assignmentId}`,
    title: assignment.name || 'Untitled Assignment',
    subtitle: course.courseCode
      ? `${course.courseCode} • Rubric`
      : 'Rubric configuration',
    href: `/admin/courses/${courseId}/assignments/${assignmentId}/rubric`,
    keywords: `${baseKeywords} rubric criteria feedback ${rubricStatus}`,
  };

  const scheduleStatus = assignment.hasTimeSlots
    ? 'sessions configured'
    : 'set up sessions';
  const scheduleItem = {
    id: `assignment-schedule-${assignmentId}`,
    title: assignment.name || 'Untitled Assignment',
    subtitle: course.courseCode
      ? `${course.courseCode} • Sessions`
      : 'Session scheduling',
    href: `/admin/courses/${courseId}/assignments/${assignmentId}/timeslots`,
    keywords: `${baseKeywords} timeslots schedule sessions availability ${scheduleStatus}`,
  };

  return {
    results: resultsItem,
    rubrics: rubricItem,
    schedules: scheduleItem,
  };
};

const loadCourses = async (ctx) => {
  if (ctx.cache.courses) {
    return ctx.cache.courses;
  }

  const adminId = ctx.user?.id;
  if (!adminId) {
    ctx.cache.courses = [];
    return [];
  }

  const response = await courseService.getAllCourses({
    adminUserId: adminId,
  });

  const courseList = Array.isArray(response?.data?.data)
    ? response.data.data
    : [];
  ctx.cache.courses = courseList;
  return courseList;
};

const loadAssignments = async (ctx) => {
  if (ctx.cache.assignments) {
    return ctx.cache.assignments;
  }

  const courses = await loadCourses(ctx);
  const courseAssignments = [];

  const targetCourses =
    courses.length > MAX_ASSIGNMENT_COURSES
      ? courses.slice(0, MAX_ASSIGNMENT_COURSES)
      : courses;

  await Promise.all(
    targetCourses.map(async (course) => {
      const courseId = resolveCourseId(course);
      if (!courseId) return;
      try {
        const response = await assignmentService.getAssignments(courseId);
        if (response?.success && Array.isArray(response.data)) {
          response.data.forEach((assignment) => {
            courseAssignments.push({ course, assignment });
          });
        }
      } catch (error) {
        // Swallow per-course fetch errors to keep results partially loaded
      }
    })
  );

  ctx.cache.assignments = courseAssignments;
  return courseAssignments;
};

const courseAdminSources = [
  {
    id: 'course-admin.quick-links',
    label: 'Quick Links',
    priority: 100,
    defaultLimit: 6,
    queryLimit: 6,
    alwaysVisible: true,
    loader: async () => QUICK_LINKS,
  },
  {
    id: 'course-admin.courses',
    label: 'Courses',
    priority: 90,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => {
      const courses = await loadCourses(ctx);
      return courses.map(toCourseItem);
    },
  },
  {
    id: 'course-admin.assignment-results',
    label: 'Assignments — Results',
    priority: 80,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => {
      const assignmentPairs = await loadAssignments(ctx);
      return assignmentPairs
        .map(({ course, assignment }) => buildAssignmentItems(assignment, course).results)
        .filter(Boolean);
    },
  },
  {
    id: 'course-admin.assignment-rubrics',
    label: 'Assignments — Rubrics',
    priority: 70,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => {
      const assignmentPairs = await loadAssignments(ctx);
      return assignmentPairs
        .map(({ course, assignment }) => buildAssignmentItems(assignment, course).rubrics)
        .filter(Boolean);
    },
  },
  {
    id: 'course-admin.assignment-schedules',
    label: 'Assignments — Sessions',
    priority: 60,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => {
      const assignmentPairs = await loadAssignments(ctx);
      return assignmentPairs
        .map(({ course, assignment }) => buildAssignmentItems(assignment, course).schedules)
        .filter(Boolean);
    },
  },
];

registerSearchSources('COURSE_ADMIN', courseAdminSources);
registerSearchSources('SUPER_ADMIN', courseAdminSources);

export default courseAdminSources;
