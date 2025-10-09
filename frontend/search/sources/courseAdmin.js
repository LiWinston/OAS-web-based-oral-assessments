import { registerSearchSources } from '../registry';
import { courseService } from '@/services/courseService';
import { assignmentService } from '@/services/assignmentService';
import {
  getRecents,
  getFavourites,
  getFavouritesSet,
} from '@/search/persistence';

const MAX_ASSIGNMENT_COURSES = Infinity;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const formatCountdown = (iso) => {
  if (!iso) return '';
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return '';
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return '';
  if (diff < HOUR) {
    const minutes = Math.max(1, Math.round(diff / MINUTE));
    return `Due in ${minutes} min`;
  }
  const hours = diff / HOUR;
  if (hours < 24) {
    return `Due in ${hours.toFixed(1)} h`;
  }
  const days = Math.round(hours / 24);
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
};

const describeReleaseStatus = (assignment) => {
  if (assignment.resultsReleased === true) return 'Results released';
  if (assignment.resultsReleased === false) return 'Release pending';
  const status = assignment.releaseStatus || assignment.resultsStatus;
  if (!status) return null;
  return status.replace(/_/g, ' ');
};

const describeMarkingProgress = (assignment) => {
  const completed = assignment.completedSessions ?? assignment.markedSessions;
  const total = assignment.totalSessions ?? assignment.sessionCount;
  if (typeof completed === 'number' && typeof total === 'number' && total > 0) {
    const pct = Math.round((completed / total) * 100);
    return `Marking ${completed}/${total} (${pct}%)`;
  }
  const status = assignment.markingStatus || assignment.status;
  if (!status) return null;
  return status.replace(/_/g, ' ');
};

const describeRubricStatus = (assignment) => {
  if (assignment.hasRubric) return 'Rubric ready';
  const status = assignment.rubricStatus;
  if (status) return status.replace(/_/g, ' ');
  return 'Rubric not configured';
};

const describeScheduleStatus = (assignment) => {
  if (assignment.hasTimeSlots) {
    const total = assignment.totalSessions ?? assignment.scheduledSessions;
    const completed = assignment.completedSessions;
    if (typeof completed === 'number' && typeof total === 'number' && total > 0) {
      const pct = Math.round((completed / total) * 100);
      return `Sessions ${completed}/${total} (${pct}%)`;
    }
    return 'Sessions configured';
  }
  return 'Sessions not configured';
};

const describeStudentLoad = (assignment) => {
  const students = assignment.students ?? assignment.studentCount;
  if (typeof students === 'number' && students > 0) {
    return `${students} students`; // simple summary
  }
  return null;
};

const describeWeight = (assignment) => {
  const weight = assignment.weight ?? assignment.weighting;
  if (typeof weight === 'number' && weight > 0) {
    return `${weight}% weight`;
  }
  return null;
};

const describeUrgency = (assignment) => {
  const value = assignment.urgency || assignment.priority;
  if (!value) return null;
  const upper = value.toString().toUpperCase();
  if (upper.includes('HIGH')) return 'High urgency';
  if (upper.includes('MEDIUM')) return 'Medium urgency';
  if (upper.includes('LOW')) return 'Low urgency';
  return upper.charAt(0) + upper.slice(1).toLowerCase();
};
const FAVOURITES_SECTION_ID = 'course-admin.favourites';
const RECENTS_SECTION_ID = 'course-admin.recents';

const resolveUserId = (user) => user?.id ?? user?.userId ?? user?.adminId;

const ensureFavouritesCache = async (ctx) => {
  if (ctx.cache.favourites) {
    return ctx.cache.favourites;
  }
  const userId = resolveUserId(ctx.user);
  const favourites = getFavourites(ctx.role, userId);
  ctx.cache.favourites = favourites;
  ctx.cache.favouritesSet = new Set(favourites.map((item) => item.id));
  return favourites;
};

const getFavouriteSet = async (ctx) => {
  if (ctx.cache.favouritesSet) {
    return ctx.cache.favouritesSet;
  }
  await ensureFavouritesCache(ctx);
  return ctx.cache.favouritesSet ?? new Set();
};

const markFavouriteMeta = (items, favouritesSet) =>
  items.map((item) => ({
    ...item,
    allowFavourite: true,
    isFavourite: favouritesSet.has(item.id),
  }));

const loadRecentsSectionItems = (ctx) => {
  const userId = resolveUserId(ctx.user);
  const recents = getRecents(ctx.role, userId);
  const favouritesSet = ctx.cache.favouritesSet
    ? ctx.cache.favouritesSet
    : (() => {
        const set = getFavouritesSet(ctx.role, userId);
        ctx.cache.favouritesSet = set;
        return set;
      })();
  return recents.map((item) => ({
    ...item,
    allowFavourite: true,
    isFavourite: favouritesSet.has(item.id),
  }));
};

const loadFavouritesSectionItems = async (ctx) => {
  const favourites = await ensureFavouritesCache(ctx);
  return favourites.map((item) => ({
    ...item,
    allowFavourite: true,
    isFavourite: true,
  }));
};

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

  const releaseStatus = describeReleaseStatus(assignment);
  const markingProgress = describeMarkingProgress(assignment);
  const rubricSummary = describeRubricStatus(assignment);
  const scheduleSummary = describeScheduleStatus(assignment);
  const studentLoad = describeStudentLoad(assignment);
  const weightLabel = describeWeight(assignment);
  const dueDateLabel = assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : null;
  const dueCountdown = formatCountdown(assignment.dueDate || assignment.endDate || assignment.startDate);
  const urgencyLabel = describeUrgency(assignment);

  const baseKeywords = [
    assignment.name,
    assignment.description,
    assignment.type,
    course.courseName,
    course.courseCode,
    assignmentId,
    releaseStatus,
    markingProgress,
    rubricSummary,
    scheduleSummary,
    studentLoad,
    weightLabel,
    dueDateLabel,
    dueCountdown,
    urgencyLabel,
  ]
    .filter(Boolean)
    .join(' ');

  const resultsItem = {
    id: `assignment-results-${assignmentId}`,
    title: assignment.name || 'Untitled Assignment',
    subtitle:
      [
        course.courseCode,
        releaseStatus,
        markingProgress,
        urgencyLabel,
        dueDateLabel || dueCountdown,
      ]
        .filter(Boolean)
        .join(' • ') || 'Assessment Results',
    href: `/admin/courses/${courseId}/assignments/${assignmentId}/results`,
    keywords: `${baseKeywords} results result moderation release 成绩 分数 mark marks ${releaseStatus || ''} ${markingProgress || ''}`,
  };

  const rubricItem = {
    id: `assignment-rubric-${assignmentId}`,
    title: assignment.name || 'Untitled Assignment',
    subtitle:
      [course.courseCode, rubricSummary, weightLabel, urgencyLabel]
        .filter(Boolean)
        .join(' • ') || 'Rubric configuration',
    href: `/admin/courses/${courseId}/assignments/${assignmentId}/rubric`,
    keywords: `${baseKeywords} rubric criteria 评分标准 feedback ${rubricSummary || ''}`,
  };

  const scheduleItem = {
    id: `assignment-schedule-${assignmentId}`,
    title: assignment.name || 'Untitled Assignment',
    subtitle:
      [course.courseCode, scheduleSummary, studentLoad, urgencyLabel, dueCountdown]
        .filter(Boolean)
        .join(' • ') || 'Session scheduling',
    href: `/admin/courses/${courseId}/assignments/${assignmentId}/timeslots`,
    keywords: `${baseKeywords} timeslot timeslots session sessions schedule booking 排期 时段 availability ${scheduleSummary || ''}`,
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
    id: FAVOURITES_SECTION_ID,
    label: 'Favourites',
    priority: 120,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => loadFavouritesSectionItems(ctx),
  },
  {
    id: RECENTS_SECTION_ID,
    label: 'Recent Searches',
    priority: 110,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => loadRecentsSectionItems(ctx),
  },
  {
    id: 'course-admin.quick-links',
    label: 'Quick Links',
    priority: 100,
    defaultLimit: 6,
    queryLimit: 6,
    alwaysVisible: true,
    loader: async (ctx) => {
      const favouritesSet = await getFavouriteSet(ctx);
      return markFavouriteMeta(QUICK_LINKS, favouritesSet);
    },
  },
  {
    id: 'course-admin.courses',
    label: 'Courses',
    priority: 90,
    defaultLimit: 6,
    queryLimit: Infinity,
    loader: async (ctx) => {
      const courses = await loadCourses(ctx);
      const favouritesSet = await getFavouriteSet(ctx);
      return markFavouriteMeta(courses.map(toCourseItem), favouritesSet);
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
      const favouritesSet = await getFavouriteSet(ctx);
      return markFavouriteMeta(
        assignmentPairs
          .map(({ course, assignment }) => buildAssignmentItems(assignment, course).results)
          .filter(Boolean),
        favouritesSet
      );
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
      const favouritesSet = await getFavouriteSet(ctx);
      return markFavouriteMeta(
        assignmentPairs
          .map(({ course, assignment }) => buildAssignmentItems(assignment, course).rubrics)
          .filter(Boolean),
        favouritesSet
      );
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
      const favouritesSet = await getFavouriteSet(ctx);
      return markFavouriteMeta(
        assignmentPairs
          .map(({ course, assignment }) => buildAssignmentItems(assignment, course).schedules)
          .filter(Boolean),
        favouritesSet
      );
    },
  },
];

registerSearchSources('COURSE_ADMIN', courseAdminSources);
registerSearchSources('SUPER_ADMIN', courseAdminSources);

export default courseAdminSources;
