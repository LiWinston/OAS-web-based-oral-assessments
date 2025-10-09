'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

// Examiner playbook mapped from Docs/Design examiner flows and assessment journey
export default function ExaminerDocumentation() {
  const heroActions = useMemo(() => ([
    {
      href: '/examiner/schedule',
      label: 'Assign Timeslots',
      icon: 'fas fa-calendar-plus',
      variant: 'solid'
    },
    {
      href: '/examiner/assessment',
      label: 'Open Marking Workspace',
      icon: 'fas fa-marker',
      variant: 'ghost'
    },
    {
      href: '/examiner/results',
      label: 'Review Submitted Assessments',
      icon: 'fas fa-clipboard-list',
      variant: 'ghost'
    }
  ]), []);

  const heroStats = useMemo(() => ([
    { value: '0', label: 'Overlaps allowed' },
    { value: '30s', label: 'Schedule refresh cadence' },
    { value: '100%', label: 'Rubric alignment' }
  ]), []);

  const quickLinks = useMemo(() => ([
    {
      href: '/examiner/schedule',
      icon: 'fas fa-calendar-alt',
      title: 'Timeslot Self-Assignment',
      description: 'View availability, avoid clashes, and submit coverage in one action.'
    },
    {
      href: '/examiner/assessment',
      icon: 'fas fa-clipboard-check',
      title: 'Live Marking Interface',
      description: 'Capture rubric scores, comments, and save drafts during assessments.'
    },
    {
      href: '/examiner/results',
      icon: 'fas fa-chart-bar',
      title: 'Assessment Archive',
      description: 'Track submission states, download history, and respond to reopen requests.'
    },
    {
      href: '/examiner/profile',
      icon: 'fas fa-id-badge',
      title: 'Examiner Profile',
      description: 'Update institutions, contact details, and workload preferences.'
    },
    {
      href: '/examiner/documentation',
      icon: 'fas fa-book-open',
      title: 'Playbook & Policies',
      description: 'Return to this companion whenever you need best-practice guidance.'
    }
  ]), []);

  const phases = useMemo(() => ([
    {
      id: 'prepare',
      title: 'Before the Assessment',
      icon: 'fas fa-calendar-alt',
      summary: 'Claim the timeslots you can cover, confirm rubric context, and warm up your comment library.',
      checklist: [
        'Use Schedule → Assign Timeslots to self-assign fully staffed timeslots. Conflicting or full timeslots are disabled with reasons.',
        'Respect max timeslot limits per assignment—progress bar shows how many 15-minute timeslots you have committed (updates every 30s).',
        'Preview the rubric, weighting, and predefined comments set by the Course Admin so you mark consistently from day one.'
      ]
    },
    {
      id: 'conduct',
      title: 'During the Assessment',
      icon: 'fas fa-stopwatch',
      summary: 'Run the live marking interface with draft saving, performance level validation, and group toggles.',
      checklist: [
        'Mark criterion by criterion—levels automatically calculate points and highlight min/max ranges.',
        'Switch between group and individual tabs for mixed assignments; progress indicators ensure nothing is missed.',
        'Save Draft anytime; Submit locks the record until a Course Admin reopens it for corrections.'
      ]
    },
    {
      id: 'wrap',
      title: 'After the Assessment',
      icon: 'fas fa-clipboard-check',
      summary: 'Track submission status, collaborate on reopen requests, and review historical feedback.',
      checklist: [
        'Assessment list shows Draft, Submitted, or Reopened states so you can finish pending work quickly.',
        'Download your marking history per assignment to cross-check moderation decisions.',
        'Comments you add become part of the assignment-wide library, boosting quality for future cohorts.'
      ]
    }
  ]), []);

  const focusAreas = useMemo(() => ([
    {
      id: 'schedule',
      title: 'Schedule Ownership',
      description: 'Pick timeslots confidently with overlap detection, coverage indicators, and atomic submissions.',
      bullets: [
        'Calendar view surfaces days with available timeslots; list view details venue, staffing, capacity, and conflicts.',
        'Bulk submit performs a single API call validating eligibility → overlap → max timeslots → coverage.',
        'Withdrawal remains available until a student books the timeslot—inline reasons explain when it is blocked.'
      ]
    },
    {
      id: 'marking',
      title: 'Marking Excellence',
      description: 'Deliver consistent outcomes using rubrics, predefined comments, and analytics baked into the UI.',
      bullets: [
        'Performance levels display descriptions and point ranges side by side, preventing overlap and ambiguity.',
        'Add reusable comments tagged by criterion and level; Course Admins can later curate them for the cohort.',
        'Real-time total score updates ensure the final grade matches assignment weighting before submission.'
      ]
    },
    {
      id: 'quality',
      title: 'Quality & Collaboration',
      description: 'Stay aligned with Course Admins and co-examiners while keeping students’ data secure.',
      bullets: [
        'Submitted assessments are read-only to peers, but Course Admins can reopen them when moderation is needed.',
        'Audit trails capture draft → submit → reopen events for compliance and future reviews.',
        'Students never see internal notes; only released feedback with curated rubric comments is shared.'
      ]
    }
  ]), []);

  const faqItems = useMemo(() => ([
    {
      question: 'How does timeslot selection respect my existing commitments?',
      answer: 'The system compares requested timeslots against your confirmed schedule before submission. If a conflict is detected, the slot is highlighted with the overlapping time range and cannot be saved. Server validation repeats this check to keep data authoritative.'
    },
    {
      question: 'What happens if I need to adjust a submitted assessment?',
      answer: 'Request a reopen from the Course Admin. Once reopened, the record returns to Draft status with clear badges so you can edit and resubmit. Students do not see the assessment until the Course Admin releases results.'
    },
    {
      question: 'Can I mark offline or during network hiccups?',
      answer: 'Draft saving stores work-in-progress to the server frequently. If connectivity drops during a live timeslot, the UI warns you and retains unsent changes locally until the connection resumes.'
    }
  ]), []);

  const [activePhase, setActivePhase] = useState(phases[0].id);
  const [activeFocus, setActiveFocus] = useState(focusAreas[0].id);
  const [expandedFaq, setExpandedFaq] = useState({});

  const currentPhase = phases.find((phase) => phase.id === activePhase);
  const currentFocus = focusAreas.find((area) => area.id === activeFocus);

  const toggleFaq = (index) => {
    setExpandedFaq((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold">Examiner Playbook</h1>
            <p className="mt-2 text-sm text-indigo-100">
              Everything you need to self-assign timeslots, deliver high quality marking, and collaborate with Course Admins.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {heroActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action.variant === 'solid'
                      ? 'bg-white text-indigo-700 hover:bg-indigo-100'
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
                <p className="text-xs text-indigo-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Launch</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-3 p-5 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 text-white shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center text-sm font-semibold">
                <i className={`${link.icon} mr-3 text-base`}></i>
                {link.title}
              </div>
              <p className="text-sm text-indigo-100 group-hover:text-white/90">
                {link.description}
              </p>
              <span className="text-xs font-medium text-white/80">Open →</span>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-route text-indigo-500 mr-3"></i>
            Assessment Lifecycle
          </CardTitle>
          <CardDescription>
            Switch between phases to see the exact steps examiners take as defined in the official user flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="flex flex-wrap gap-2 bg-indigo-50 dark:bg-gray-800/60">
              {phases.map((phase) => (
                <TabsTrigger key={phase.id} value={phase.id} className="px-3 py-2">
                  <i className={`${phase.icon} mr-2 text-indigo-600`}></i>
                  {phase.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {phases.map((phase) => (
              <TabsContent key={phase.id} value={phase.id}>
                <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                  <div className="bg-indigo-50 dark:bg-gray-800/60 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                      {phase.summary}
                    </h3>
                  </div>
                  <div className="rounded-xl border border-indigo-100 dark:border-gray-700 p-5">
                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      {phase.checklist.map((item) => (
                        <li key={item} className="flex">
                          <i className="fas fa-check text-indigo-500 mr-2 mt-1"></i>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-compass text-indigo-500 mr-3"></i>
            Focus Areas
          </CardTitle>
          <CardDescription>
            Choose a focus to explore how OAS supports your day-to-day workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => setActiveFocus(area.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFocus === area.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {area.title}
              </button>
            ))}
          </div>

          {currentFocus && (
            <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl p-5">
                <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-200">{currentFocus.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{currentFocus.description}</p>
              </div>
              <div className="rounded-xl border border-indigo-100 dark:border-gray-700 p-5 bg-indigo-50 dark:bg-gray-800/60">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {currentFocus.bullets.map((bullet) => (
                    <li key={bullet} className="flex">
                      <i className="fas fa-chevron-right text-indigo-500 mr-2 mt-1 text-xs"></i>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-book text-indigo-500 mr-3"></i>
            FAQs & Edge Cases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {faqItems.map((faq, index) => (
            <div key={faq.question} className="border border-indigo-100 dark:border-gray-700 rounded-xl">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-gray-800/60 transition-colors rounded-xl"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{faq.question}</span>
                <i className={`fas fa-chevron-${expandedFaq[index] ? 'up' : 'down'} text-indigo-400`}></i>
              </button>
              {expandedFaq[index] && (
                <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-life-ring text-indigo-500 mr-3"></i>
            Need More Help?
          </CardTitle>
          <CardDescription>
            Reach the right team in one click.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="border border-indigo-100 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Technical Support</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Platform access, browser, or data sync issues.</p>
            <a href="mailto:support@oas.edu.au" className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              <i className="fas fa-paper-plane mr-2"></i>
              support@oas.edu.au
            </a>
          </div>
          <div className="border border-indigo-100 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Assessment Moderation</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Discuss rubrics, reopen requests, and marking standards.</p>
            <a href="mailto:course-admin@oas.edu.au" className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              <i className="fas fa-envelope mr-2"></i>
              course-admin@oas.edu.au
            </a>
          </div>
          <div className="border border-indigo-100 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Share Improvements</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Suggest enhancements to the marking tools or workflows.</p>
            <a href="mailto:feedback@oas.edu.au" className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              <i className="fas fa-comments mr-2"></i>
              Send Feedback Email
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
