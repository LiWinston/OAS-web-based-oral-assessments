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

// Student Help Center informed by Docs/Design student flows and booking policies
export default function StudentHelp() {
  const heroActions = useMemo(() => ([
    {
      href: '/student/booking',
      label: 'Go to My Bookings',
      icon: 'fas fa-calendar-plus',
      variant: 'solid'
    },
    {
      href: '/student/results',
      label: 'View Released Results',
      icon: 'fas fa-trophy',
      variant: 'ghost'
    }
  ]), []);

  const heroStats = useMemo(() => ([
    { value: '30s', label: 'Live schedule refresh' },
    { value: '100%', label: 'Rubric transparency' },
    { value: '24h', label: 'Default lockout notice' }
  ]), []);

  const quickLinks = useMemo(() => ([
    {
      href: '/student/booking',
      icon: 'fas fa-calendar-check',
      title: 'Manage Bookings',
      description: 'Browse staffed timeslots, book or reschedule with atomic swaps.'
    },
    {
      href: '/student/groups',
      icon: 'fas fa-users',
      title: 'View My Groups',
      description: 'See active group members, emails, and booking context per assignment.'
    },
    {
      href: '/student/results',
      icon: 'fas fa-chart-bar',
      title: 'Check My Results',
      description: 'Explore rubric breakdowns, examiner feedback, and download records.'
    },
    {
      href: '/student/profile',
      icon: 'fas fa-id-badge',
      title: 'Update Profile',
      description: 'Refresh contact details, notification preferences, and security settings.'
    },
    {
      href: '/student/settings',
      icon: 'fas fa-sliders-h',
      title: 'Assessment Settings',
      description: 'Control reminders, calendar sync, and accessibility preferences.'
    },
    {
      href: '/student/help',
      icon: 'fas fa-book-open',
      title: 'Help Center',
      description: 'Return to this companion for policies, best practices, and FAQs.'
    }
  ]), []);

  const journeySteps = useMemo(() => ([
    {
      id: 'plan',
      title: 'Plan Your Assessment',
      icon: 'fas fa-seedling',
      summary: 'Complete onboarding, understand your course requirements, and check booking policies before the schedule opens.',
      highlights: [
        'Use the invitation email or dashboard banner to finish onboarding in minutes.',
        'Each assignment card shows booking status, lockout window, and rescheduling availability.',
        'Group and mixed assessments clearly display who you are booking for so the whole team stays aligned.'
      ]
    },
    {
      id: 'book',
      title: 'Book & Manage Timeslots',
      icon: 'fas fa-calendar-check',
      summary: 'Browse fully staffed timeslots, secure a slot, and reschedule with confidence thanks to atomic bookings.',
      highlights: [
        'Calendar + list view updates every 30 seconds so you never see unstaffed timeslots.',
        'Booking confirmation summarises timezone, venue, and lockout/deadline policies before you commit.',
        'Rescheduling swaps old and new timeslots atomically—if the new slot fails, you keep your original booking.'
      ]
    },
    {
      id: 'collaborate',
      title: 'Coordinate With Your Group',
      icon: 'fas fa-users-line',
      summary: 'Stay aligned with group members using assignment-scoped rosters and shared booking context.',
      highlights: [
        'My Groups shows one active group per assignment with course code, semester, and member count.',
        'Details view lists members with emails so you can coordinate preparation quickly.',
        'Group banner appears on booking and results pages to remind you actions apply to the entire team.'
      ]
    },
    {
      id: 'reflect',
      title: 'Review Results & Feedback',
      icon: 'fas fa-chart-line',
      summary: 'Understand your performance with rubric breakdowns, examiner comments, and downloadable records.',
      highlights: [
        'Results tab lists every released assessment—current and archived—with grade, percentage, and release timestamp.',
        'Rubric breakdown mirrors the examiner view, showing points per criterion and aggregated weighting.',
        'Download results or copy overall feedback to prepare for follow-up discussions and improvement plans.'
      ]
    }
  ]), []);

  const featureTiles = useMemo(() => ([
    {
      icon: 'fas fa-bolt',
      title: 'Live Availability',
      description: 'Timeslot list refreshes automatically and disables slots that just filled, preventing double bookings.'
    },
    {
      icon: 'fas fa-clock',
      title: 'Lockout & Deadlines',
      description: 'Policies defined by Course Admin are surfaced everywhere so you know when changes close.'
    },
    {
      icon: 'fas fa-user-shield',
      title: 'Eligibility Aware',
      description: 'Only assignments you are rostered into appear, protecting privacy and reducing noise.'
    },
    {
      icon: 'fas fa-envelope-open-text',
      title: 'Smart Notifications',
      description: 'Email confirmations, calendar invites, and reminders keep you and your group aligned.'
    },
    {
      icon: 'fas fa-clipboard-list',
      title: 'Assessment Checklist',
      description: 'Dashboard tasks highlight next steps—book, upload prep, join your timeslot, review feedback.'
    },
    {
      icon: 'fas fa-universal-access',
      title: 'Accessible Everywhere',
      description: 'Keyboard-friendly components, timezone badges, and mobile-ready layouts work on any device.'
    }
  ]), []);

  const policyHighlights = useMemo(() => ([
    {
      title: 'Booking Policies',
      points: [
        'One active booking per assignment and entity (student or group).',
        'Within lockout hours bookings and reschedules are blocked while you keep visibility.',
        'Deadline indicators turn amber as the close date approaches to prompt timely action.'
      ]
    },
    {
      title: 'Rescheduling Guarantees',
      points: [
        'Reschedule performs an atomic swap—your original slot is only released after the new booking is confirmed.',
        'If a slot changes while you are selecting it, inline messaging explains the reason and offers a quick refresh.',
        'Cancelled timeslots notify group members and free capacity immediately for classmates.'
      ]
    },
    {
      title: 'Results Visibility',
      points: [
        'Results appear only after Course Admin releases them, ensuring fairness across cohorts.',
        'Rubric tables display examiner-by-examiner scores plus the aggregated grade to promote transparency.',
        'Historical results remain available for future reference and academic advising conversations.'
      ]
    }
  ]), []);

  const supportChannels = useMemo(() => ([
    {
      icon: 'fas fa-headset',
      title: 'Course Support Team',
      description: 'Reach out via the course email listed on your assignment card for booking or policy questions.',
      action: 'mailto:course-team@oas.edu.au'
    },
    {
      icon: 'fas fa-life-ring',
      title: 'Technical Help Desk',
      description: 'Report login issues, browser problems, or access errors. Include screenshots when possible.',
      action: 'mailto:support@oas.edu.au'
    },
    {
      icon: 'fas fa-comments',
      title: 'Feedback Portal',
      description: 'Share ideas from your assessment experience—the team reviews suggestions every sprint.',
      action: 'mailto:feedback@oas.edu.au'
    }
  ]), []);

  const ahaMoments = useMemo(() => ([
    {
      id: 'calendar',
      title: 'Calendar Sync in One Click',
      blurb: 'Add timeslots to your favourite calendar straight from the booking confirmation so reminders travel with you.'
    },
    {
      id: 'groupSnapshot',
      title: 'Instant Group Snapshot',
      blurb: 'Need to check who is in your team before booking? My Groups shows the roster, emails, and booking status on one screen.'
    },
    {
      id: 'resultsCompare',
      title: 'Compare Criteria Over Time',
      blurb: 'Review past rubric breakdowns to spot improvement trends and prepare for the next oral assessment.'
    }
  ]), []);

  const [activeJourney, setActiveJourney] = useState(journeySteps[0].id);
  const [activeMoment, setActiveMoment] = useState(ahaMoments[0].id);

  const currentJourney = journeySteps.find((step) => step.id === activeJourney);
  const currentMoment = ahaMoments.find((moment) => moment.id === activeMoment);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600 text-white rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold">Student Help Center</h1>
            <p className="mt-2 text-sm text-teal-50">
              Everything you need to confidently book, attend, and learn from your oral assessments.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {heroActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action.variant === 'solid'
                      ? 'bg-white text-teal-700 hover:bg-teal-100'
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
                <p className="text-xs text-teal-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-teal-100 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Launch</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-3 p-5 rounded-xl bg-gradient-to-br from-teal-500 via-blue-500 to-indigo-600 text-white shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center text-sm font-semibold">
                <i className={`${link.icon} mr-3 text-base`}></i>
                {link.title}
              </div>
              <p className="text-sm text-teal-100 group-hover:text-white/90">
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
            <i className="fas fa-route text-blue-600 mr-3"></i>
            Your Journey Through OAS
          </CardTitle>
          <CardDescription>
            Follow the guided path from onboarding to post-assessment reflection, tailored to how students actually use OAS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeJourney} onValueChange={setActiveJourney} className="w-full">
            <TabsList className="flex flex-wrap gap-2 bg-blue-50 dark:bg-gray-800/60">
              {journeySteps.map((step) => (
                <TabsTrigger key={step.id} value={step.id} className="px-3 py-2">
                  <i className={`${step.icon} mr-2 text-blue-600`}></i>
                  {step.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {journeySteps.map((step) => (
              <TabsContent key={step.id} value={step.id}>
                <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                  <div className="bg-blue-50 dark:bg-gray-800/60 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {step.summary}
                    </h3>
                  </div>
                  <div className="rounded-xl border border-blue-100 dark:border-gray-700 p-5">
                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      {step.highlights.map((item) => (
                        <li key={item} className="flex">
                          <i className="fas fa-check text-blue-500 mr-2 mt-1"></i>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Pro tip
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pin the assignment card with the earliest booking deadline so it surfaces on your dashboard reminders.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {featureTiles.map((tile) => (
          <Card key={tile.title} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <i className={`${tile.icon} text-blue-600 mr-3`}></i>
                {tile.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">{tile.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-magic text-blue-500 mr-3"></i>
            Aha Moments Designed for You
          </CardTitle>
          <CardDescription>
            Toggle between small delights that save time and reduce assessment anxiety.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ahaMoments.map((moment) => (
              <button
                key={moment.id}
                onClick={() => setActiveMoment(moment.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeMoment === moment.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {moment.title}
              </button>
            ))}
          </div>

          {currentMoment && (
            <div className="bg-blue-50 dark:bg-gray-800/60 border border-blue-100 dark:border-gray-700 rounded-xl p-5 text-sm text-gray-700 dark:text-gray-300">
              {currentMoment.blurb}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-shield-alt text-blue-500 mr-3"></i>
            Key Policies & Safeguards
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {policyHighlights.map((policy) => (
            <div key={policy.title} className="p-4 border border-blue-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900">
              <h4 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-200">
                {policy.title}
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {policy.points.map((point) => (
                  <li key={point} className="flex">
                    <i className="fas fa-circle text-blue-400 mr-2 mt-1 text-[7px]"></i>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {supportChannels.map((channel) => (
          <Card key={channel.title} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <i className={`${channel.icon} text-blue-600 mr-3`}></i>
                {channel.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{channel.description}</p>
              <div>
                {channel.action.startsWith('mailto:') ? (
                  <a href={channel.action} className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    <i className="fas fa-paper-plane mr-2"></i>
                    Send Email
                  </a>
                ) : (
                  <Link href={channel.action} className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    <i className="fas fa-arrow-right mr-2"></i>
                    Open Portal
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
