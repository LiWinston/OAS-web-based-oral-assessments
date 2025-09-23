const seedTickets = [
  {
    ticketId: 'SUP-ADM001',
    status: 'in_progress',
    role: 'COURSE_ADMIN',
    priority: 'urgent',
    name: 'Dr. Alice Tan',
    email: 'alice.tan@unimelb.edu.au',
    subject: 'Timeslot roster not updating for Assignment 2',
    message:
      'After importing the new examiner roster (CSV) the Assignment 2 timeslot grid still shows the old availability. Need this before tomorrow\'s bookings open.',
    submittedAt: '2025-04-07T01:45:00.000Z',
    updatedAt: '2025-04-07T02:10:00.000Z',
    context: {
      pathname: '/admin/courses/SWEN90017/assignments/assignment-2/timeslots',
      hero: 'Keep your oral assessments running smoothly',
      quickLinks: ['Assignment launch checklist', 'Canvas export guide'],
    },
    attachment: null,
    internalNotes: 'Assigned to DevOps. Waiting on cron re-index verification.',
  },
  {
    ticketId: 'SUP-EXM104',
    status: 'resolved',
    role: 'EXAMINER',
    priority: 'urgent',
    name: 'Jasdeep Kaur',
    email: 'jasdeep.kaur@unimelb.edu.au',
    subject: 'Rubric freeze during live session 10:30am',
    message:
      'Marking interface locked when submitting criterion 3 for student 812345. Browser Chrome 123. Please unlock so I can finish results.',
    submittedAt: '2025-04-06T00:15:00.000Z',
    updatedAt: '2025-04-06T00:42:00.000Z',
    context: {
      pathname: '/examiner/assessment',
      hero: 'Stay focused on assessing — we handle the rest',
      quickLinks: ['Self-assign to timeslots', 'Assessment workspace'],
    },
    attachment: {
      name: 'rubric-error.png',
      size: 284512,
      type: 'image/png',
    },
    internalNotes: 'Identified autosave race condition; hotfix deployed. Ticket closed with confirmation.',
  },
  {
    ticketId: 'SUP-STU889',
    status: 'open',
    role: 'STUDENT',
    priority: 'normal',
    name: 'Liam Chen',
    email: 'liam.chen@student.unimelb.edu.au',
    subject: 'No sessions available for SWEN90017 Assignment 1',
    message:
      'I logged in at 9:05am and the booking page says sessions unavailable. Friends can still see them. Could someone check if my group is configured?',
    submittedAt: '2025-04-07T00:05:00.000Z',
    updatedAt: '2025-04-07T00:05:00.000Z',
    context: {
      pathname: '/student/booking',
      hero: 'Need a hand with your oral assessment?',
      quickLinks: ['Manage my bookings', 'Understand group roles'],
    },
    attachment: null,
    internalNotes: 'Awaiting roster sync confirmation from course admin.',
  },
];

const mockTicketStore = seedTickets.map((ticket) => ({ ...ticket }));

const cloneTicket = (ticket) => JSON.parse(JSON.stringify(ticket));

const createMockTicket = (payload = {}) => {
  const timestamp = new Date().toISOString();
  const ticketId = `SUP-${Date.now().toString(36).slice(-6).toUpperCase()}`;

  return {
    ticketId,
    status: 'open',
    role: payload.role || 'UNKNOWN',
    priority: payload.priority || 'normal',
    name: payload.name || 'Anonymous user',
    email: payload.email || 'unknown@oas.edu.au',
    subject: payload.subject || 'Support request',
    message: payload.message || '',
    submittedAt: timestamp,
    updatedAt: timestamp,
    context: payload.context ? cloneTicket(payload.context) : null,
    attachment: payload.attachment ? cloneTicket(payload.attachment) : null,
    internalNotes: 'Mock ticket created locally. Update status as you test flows.',
  };
};

const mockSubmitSupportRequest = async (payload) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const ticket = createMockTicket(payload);
  mockTicketStore.unshift(ticket);
  return {
    success: true,
    data: cloneTicket(ticket),
  };
};

const filterTickets = (tickets, filters = {}) => {
  const { role, status, email, limit } = filters;
  let result = tickets;

  if (role) {
    const normalizedRole = Array.isArray(role) ? role : [role];
    result = result.filter((ticket) => normalizedRole.includes(ticket.role));
  }

  if (status) {
    const normalizedStatus = Array.isArray(status) ? status : [status];
    result = result.filter((ticket) => normalizedStatus.includes(ticket.status));
  }

  if (email) {
    result = result.filter((ticket) => ticket.email === email);
  }

  if (typeof limit === 'number') {
    result = result.slice(0, Math.max(limit, 0));
  }

  return result.map(cloneTicket);
};

export const supportService = {
  async submitSupportRequest(payload) {
    return mockSubmitSupportRequest(payload);
  },
  async listSupportRequests(filters) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return filterTickets(mockTicketStore, filters);
  },
  async getSupportRequestById(ticketId) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const ticket = mockTicketStore.find((item) => item.ticketId === ticketId);
    return ticket ? cloneTicket(ticket) : null;
  },
  async resetSupportRequests() {
    mockTicketStore.splice(0, mockTicketStore.length, ...seedTickets.map((ticket) => ({ ...ticket })));
    await new Promise((resolve) => setTimeout(resolve, 100));
    return filterTickets(mockTicketStore);
  },
};

export default supportService;
