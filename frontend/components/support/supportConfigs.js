export const supportConfigs = {
  admin: {
    roleKey: 'COURSE_ADMIN',
    hero: {
      badge: 'Course Admin Support',
      title: 'Keep your oral assessments running smoothly',
      subtitle:
        'We jump in when timelines are tight. Tell us what is blocking your course delivery and the development team will respond fast.',
      primaryAction: {
        label: 'View setup documentation',
        href: '/admin/documentation',
        icon: 'fas fa-book-open',
      },
      secondaryAction: {
        label: 'Email the development team',
        href: 'mailto:devteam@oas.edu.au',
        icon: 'fas fa-envelope',
      },
      stats: [
        { value: '< 4h', label: 'Average response time' },
        { value: '92%', label: 'First-touch resolution' },
        { value: '24/5', label: 'Support window' },
        { value: '1.2k', label: 'Issues resolved this semester' },
      ],
    },
    quickLinks: [
      {
        title: 'Assignment launch checklist',
        description: 'Step through data import, rubric setup, and examiner onboarding in one flow.',
        href: '/admin/courses',
        icon: 'fas fa-list-check',
      },
      {
        title: 'Canvas export guide',
        description: 'Export grades + feedback with verified CSV templates and common pitfalls to avoid.',
        href: '/admin/results',
        icon: 'fas fa-file-export',
      },
      {
        title: 'Timeslot health dashboard',
        description: 'Check examiner coverage, room utilisation, and lockout deadlines at a glance.',
        href: '/admin/courses',
        icon: 'fas fa-calendar-day',
      },
    ],
    categories: [
      { value: 'assignment_setup', label: 'Assignment setup & data', icon: 'fas fa-diagram-project' },
      { value: 'timeslot', label: 'Timeslot scheduling', icon: 'fas fa-calendar-check' },
      { value: 'results_release', label: 'Marks consolidation / release', icon: 'fas fa-chart-line' },
      { value: 'integration', label: 'Canvas integration', icon: 'fas fa-plug' },
      { value: 'technical', label: 'Technical issue / bug', icon: 'fas fa-bug' },
      { value: 'other', label: 'Something else', icon: 'fas fa-comments' },
    ],
    channels: [
      {
        title: 'Development team inbox',
        description: 'Best for configuration blockers or feature questions. Include assignment/course IDs for faster routing.',
        actionLabel: 'devteam@oas.edu.au',
        href: 'mailto:devteam@oas.edu.au',
        icon: 'fas fa-envelope-open-text',
      },
      {
        title: 'Status & maintenance updates',
        description: 'Check live platform health, deployment windows, and incident updates before escalating.',
        actionLabel: 'Open status page',
        href: 'https://status.oas.edu.au',
        icon: 'fas fa-signal',
      },
      {
        title: 'Coordinator Slack channel',
        description: 'Real-time chat with other coordinators and the dev squad during assessment weeks.',
        actionLabel: '#oas-course-admins',
        href: 'https://slack.com/app_redirect?channel=oas-course-admins',
        icon: 'fab fa-slack',
      },
    ],
    contextTips: [
      {
        title: 'Assignment + cohort',
        description: 'Share the course code, semester, and affected assignment names so we can inspect the right dataset.',
        icon: 'fas fa-hashtag',
      },
      {
        title: 'Critical deadlines',
        description: 'Flag upcoming booking lockouts or release targets—we will prioritise responses around those timelines.',
        icon: 'fas fa-hourglass-half',
      },
      {
        title: 'Recent changes',
        description: 'Let us know if CSV imports, rubric edits, or examiner assignments just happened—it helps us trace regressions quickly.',
        icon: 'fas fa-pen-to-square',
      },
    ],
    faqs: [
      {
        question: 'How fast can you unblock a broken CSV export?',
        answer:
          'Most CSV issues are resolved in under four hours. Attach the export file and note whether you edited the template so we can reproduce quickly.',
      },
      {
        question: 'Who else gets notified when I submit a ticket?',
        answer:
          'The OAS development team triages every ticket. We loop in your course’s assigned engineer if a code change is required and update you at each milestone.',
      },
      {
        question: 'Can I track the status of my request?',
        answer:
          'Yes. You will receive email updates when the ticket is accepted, in progress, and resolved. A “My support” dashboard is coming soon.',
      },
    ],
    form: {
      title: 'Contact the development team',
      description:
        'Provide enough context so we can dive straight in—course IDs, deadlines, and any steps already taken.',
      subjectPlaceholder: 'Example: Canvas export failing for SWEN90017 Assignment 2',
      messagePlaceholder:
        'Describe what you expected, what happened, and the impact on your students or examiners. Include timestamps where possible.',
      submitLabel: 'Send request',
      successTitle: 'All set — we have your request!',
      successDescription:
        'We will reach out via email with next steps. If anything changes meanwhile, just reply to the confirmation email with updates.',
      followUp:
        'Need immediate help during a live exam window? Post an @mention in #oas-course-admins after submitting so we can jump in instantly.',
      successToast: 'Support ticket submitted — check your inbox for confirmation.',
      errorToast: 'We could not submit the request. Try again in a moment or drop us an email.',
      defaultPriority: 'normal',
    },
    defaultPriority: 'normal',
  },
  examiner: {
    roleKey: 'EXAMINER',
    hero: {
      badge: 'Examiner Support',
      title: 'Stay focused on assessing — we handle the rest',
      subtitle:
        'Whether you are scheduling slots or finalising marks, this hub connects you with the team that keeps examiner tools humming.',
      primaryAction: {
        label: 'View marking guide',
        href: '/examiner/documentation',
        icon: 'fas fa-clipboard-check',
      },
      secondaryAction: {
        label: 'Timeslot troubleshooting',
        href: '/examiner/schedule',
        icon: 'fas fa-calendar-exclamation',
      },
      stats: [
        { value: '15 min', label: 'Average first reply' },
        { value: '98%', label: 'Issues resolved before next slot' },
        { value: 'Live', label: 'Exam-day hotline' },
      ],
    },
    quickLinks: [
      {
        title: 'Self-assign to timeslots',
        description: 'Pick up open sessions and confirm coverage with live availability indicators.',
        href: '/examiner/schedule',
        icon: 'fas fa-calendar-plus',
      },
      {
        title: 'Assessment workspace',
        description: 'Record rubric scores, attach comments, and sync marks without leaving the browser.',
        href: '/examiner/assessment',
        icon: 'fas fa-marker',
      },
      {
        title: 'Results overview',
        description: 'Review submitted scores, make edits before lockout, and monitor release readiness.',
        href: '/examiner/results',
        icon: 'fas fa-chart-bar',
      },
    ],
    categories: [
      { value: 'timeslot_access', label: 'Timeslot / booking access', icon: 'fas fa-calendar-minus' },
      { value: 'marking_interface', label: 'Marking interface', icon: 'fas fa-clipboard-list' },
      { value: 'feedback_sync', label: 'Feedback sync', icon: 'fas fa-comments' },
      { value: 'student_lookup', label: 'Student or group visibility', icon: 'fas fa-user-group' },
      { value: 'technical', label: 'Technical issue / bug', icon: 'fas fa-triangle-exclamation' },
      { value: 'other', label: 'Other request', icon: 'fas fa-circle-question' },
    ],
    channels: [
      {
        title: 'Live exam hotline',
        description: 'Urgent only. Call if a session is in progress and you cannot access the marking interface or recordings.',
        actionLabel: '+61 3 9000 1234',
        href: 'tel:+61390001234',
        icon: 'fas fa-phone-volume',
      },
      {
        title: 'Email support',
        description: 'For anything scheduled outside exam hours. Include student IDs or slot IDs when relevant.',
        actionLabel: 'support@oas.edu.au',
        href: 'mailto:support@oas.edu.au',
        icon: 'fas fa-envelope',
      },
      {
        title: 'Knowledge base',
        description: 'Search quick fixes for marking sync, audio uploads, and device setup before raising a ticket.',
        actionLabel: 'View guides',
        href: '/examiner/documentation',
        icon: 'fas fa-book',
      },
    ],
    contextTips: [
      {
        title: 'Slot + assignment details',
        description: 'Include the timeslot ID or start time, plus the assignment you were assessing, so we can trace logs.',
        icon: 'fas fa-location-arrow',
      },
      {
        title: 'Error messages or screenshots',
        description: 'Attach what you see on screen—browser, device, and network info help us reproduce quickly.',
        icon: 'fas fa-camera',
      },
      {
        title: 'Student impact',
        description: 'Let us know if students are waiting or if marks are due imminently so we can triage urgency.',
        icon: 'fas fa-user-clock',
      },
    ],
    faqs: [
      {
        question: 'What if I lose connection during a live exam?',
        answer:
          'Switch to the hotline immediately so we can preserve the session state. The form is a good follow-up for detailed notes once the student is rescheduled.',
      },
      {
        question: 'How do I reopen a submitted rubric?',
        answer:
          'Submit a ticket with the rubric ID or student ID and the reason for reopening. We will unlock it and ping you when editing is available again.',
      },
      {
        question: 'Do you support mobile devices?',
        answer:
          'Marking works best on desktop Chrome/Edge. Tablets are partially supported; report UI glitches with device + OS version so we can harden cross-device support.',
      },
    ],
    form: {
      title: 'Something interrupting your marking?',
      description:
        'Share the situation and we will help you resolve it before your next session starts.',
      subjectPlaceholder: 'Example: Cannot open rubric for 10:30 AM SWEN90017 session',
      messagePlaceholder:
        'Outline the flow you followed, what you expected, what happened instead, and any students affected. Mention browser/device if relevant.',
      submitLabel: 'Send to support',
      successTitle: 'We are on it — hang tight',
      successDescription:
        'Our team will review your notes and respond by email. If a session is live, call the hotline so we can bridge while you wait.',
      followUp:
        'Add any follow-up screenshots or logs by replying to the confirmation email — everything stays threaded to the same ticket.',
      successToast: 'Thanks! Support has your examiner ticket.',
      errorToast: 'We could not send that right now. Refresh or call the hotline if this is urgent.',
      defaultPriority: 'urgent',
    },
    defaultPriority: 'urgent',
  },
  student: {
    roleKey: 'STUDENT',
    hero: {
      badge: 'Student Support',
      title: 'Need a hand with your oral assessment?',
      subtitle:
        'We keep booking and assessment tools friendly. If you run into trouble, reach out and we will walk you through it.',
      primaryAction: {
        label: 'View booking guide',
        href: '/student/help',
        icon: 'fas fa-calendar-check',
      },
      secondaryAction: {
        label: 'Assessment day checklist',
        href: '/student/results',
        icon: 'fas fa-clipboard-list',
      },
      stats: [
        { value: '24h', label: 'Typical response time' },
        { value: '4.8★', label: 'Support satisfaction' },
      ],
    },
    quickLinks: [
      {
        title: 'Manage my bookings',
        description: 'Reschedule safely, view upcoming slots, and check lockout times.',
        href: '/student/booking',
        icon: 'fas fa-clock-rotate-left',
      },
      {
        title: 'Understand group roles',
        description: 'See who is in your group and who is booking on behalf of the team.',
        href: '/student/groups',
        icon: 'fas fa-user-friends',
      },
      {
        title: 'Review released results',
        description: 'Download rubric feedback, read examiner comments, and track progress.',
        href: '/student/results',
        icon: 'fas fa-chart-line',
      },
    ],
    categories: [
      { value: 'booking_issue', label: 'Booking or rescheduling issue', icon: 'fas fa-calendar-xmark' },
      { value: 'group_question', label: 'Group / team question', icon: 'fas fa-people-group' },
      { value: 'assessment_day', label: 'Assessment day support', icon: 'fas fa-microphone-lines' },
      { value: 'results_access', label: 'Results or feedback', icon: 'fas fa-graduation-cap' },
      { value: 'technical', label: 'Technical problem', icon: 'fas fa-laptop' },
      { value: 'other', label: 'Something else', icon: 'fas fa-comment-dots' },
    ],
    channels: [
      {
        title: 'Course admin email',
        description: 'Policy questions or special arrangements go straight to your course team. Check your assignment card for the official address.',
        actionLabel: 'Contact course admin',
        href: 'mailto:course-team@oas.edu.au',
        icon: 'fas fa-user-tie',
      },
      {
        title: 'Student help centre',
        description: 'Browse FAQs, troubleshooting tips, and short videos on booking and assessment preparation.',
        actionLabel: 'Open help centre',
        href: '/student/help',
        icon: 'fas fa-compass',
      },
      {
        title: 'Tech support email',
        description: 'Report login issues, page errors, or accessibility needs. Attach screenshots when possible.',
        actionLabel: 'helpdesk@oas.edu.au',
        href: 'mailto:helpdesk@oas.edu.au',
        icon: 'fas fa-life-ring',
      },
    ],
    contextTips: [
      {
        title: 'Assignment & slot info',
        description: 'Tell us which course and assignment you are working on, plus the date/time you are trying to book.',
        icon: 'fas fa-calendar',
      },
      {
        title: 'What you already tried',
        description: 'Let us know the steps you followed or buttons clicked so we do not ask you to repeat them.',
        icon: 'fas fa-shoe-prints',
      },
      {
        title: 'Screenshots or browser',
        description: 'Attach a screenshot or mention your browser/device if something looks broken. It helps us fix it fast.',
        icon: 'fas fa-image',
      },
    ],
    faqs: [
      {
        question: 'Can I reschedule after the lockout time?',
        answer:
          'Lockout times are set by your course admin. Once the window closes, submit a ticket with your reason—someone will review and advise the next step.',
      },
      {
        question: 'How do I join the correct meeting link?',
        answer:
          'Your booking confirmation email and dashboard card display the correct venue or video link. If it is missing, include your slot time when contacting support.',
      },
      {
        question: 'When will I see my results?',
        answer:
          'Results appear once the course admin releases them for everyone. You will receive an email notification and see them in “My Results”.',
      },
    ],
    form: {
      title: 'Send a message to support',
      description:
        'We are here to help with bookings, technology, or anything that feels unclear about your assessment.',
      subjectPlaceholder: 'Example: Booking page says no sessions, but others can still book',
      messagePlaceholder:
        'Explain what you were trying to do, what happened, and any error messages you saw. Add dates or times if it helps.',
      submitLabel: 'Send message',
      successTitle: 'Thanks for reaching out!',
      successDescription:
        'We received your message and will email you with next steps. Check your spam folder just in case.',
      followUp:
        'If your assessment is within 24 hours, reply to the confirmation email with “URGENT” in the subject so we can prioritise it.',
      successToast: 'Message sent — watch your inbox for a reply from support.',
      errorToast: 'We could not send your message. Try again or contact helpdesk@oas.edu.au.',
      defaultPriority: 'normal',
    },
    defaultPriority: 'normal',
  },
};

export default supportConfigs;
