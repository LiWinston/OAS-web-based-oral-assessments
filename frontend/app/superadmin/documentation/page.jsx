"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";

// Super Admin documentation built from Docs/API SuperAdmin specs and governance flows
export default function SuperAdminDocumentation() {
  const pillars = useMemo(() => ([
    {
      id: "access",
      title: "Access Control",
      icon: "fas fa-user-shield",
      description: "Provision Course Admins, manage invitations, and revoke access instantly when roles change.",
      highlights: [
        "Invite new Course Admins with expiry-backed links and optional welcome notes.",
        "Track invitation status (Invited, Registered, Active, Expired) from a single dashboard.",
        "Revoke or reinstate accounts with one click—audit history records every decision."
      ]
    },
    {
      id: "oversight",
      title: "System Oversight",
      icon: "fas fa-university",
      description: "Review every course running on OAS with drill-down visibility into enrolments and staffing.",
      highlights: [
        "Search courses across schools, filter by semester, and spot coverage gaps early.",
        "Surface key stats: enrolled students, active assignments, examiner load, and release status.",
        "Export oversight reports for governance meetings or compliance reviews."
      ]
    },
    {
      id: "governance",
      title: "Governance & Health",
      icon: "fas fa-heartbeat",
      description: "Monitor platform health, policy adherence, and cross-team collaboration signals.",
      highlights: [
        "System health widget aggregates API uptime and recent incidents from the monitoring service.",
        "Receive alerts when invitation backlogs grow or courses run without active admins.",
        "Schedule quarterly access reviews and export audit logs for university-wide reporting."
      ]
    }
  ]), []);

  const playbooks = useMemo(() => ([
    {
      id: "grant-access",
      title: "Grant Course Access",
      summary: "Onboard a new Course Admin while keeping institutional policy in check.",
      steps: [
        "Open Course Admins → Invite and enter name, email, department, plus contextual welcome message.",
        "Set invitation expiry (default 7 days) and review domain validation before sending.",
        "Monitor acceptance; resend or revoke invitations directly from the pending list."
      ],
      success: "The new admin lands on onboarding, completes profile setup, and appears as Active within minutes."
    },
    {
      id: "course-audit",
      title: "Audit a Course",
      summary: "Investigate a course flagged for low examiner coverage or stalled bookings.",
      steps: [
        "Open All Courses and filter by semester or department to locate the course quickly.",
        "Review course metrics: enrolled students, staffing ratio, assignments awaiting release.",
        "Notify responsible admins via the integrated message shortcut or export a report for follow-up."
      ],
      success: "Risks are documented, and course teams receive actionable insights before student impact occurs."
    },
    {
      id: "health-review",
      title: "Run a Health Review",
      summary: "Ensure the platform meets governance requirements each sprint.",
      steps: [
        "Check system health cards for API uptime, authentication errors, and recent incidents.",
        "Download the access log snapshot and confirm no dormant accounts retain privileges.",
        "Log outcomes in your governance tracker—link exported CSVs for traceability."
      ],
      success: "Stakeholders receive a concise status update and evidence that controls are effective."
    }
  ]), []);

  const metrics = useMemo(() => ([
    {
      label: "Active Course Admins",
      value: "48",
      context: "Across the institution"
    },
    {
      label: "Courses in Session",
      value: "112",
      context: "Live this semester"
    },
    {
      label: "Invite Acceptance",
      value: "94%",
      context: "Last 30 days"
    },
    {
      label: "API Uptime",
      value: "99.9%",
      context: "Rolling 7 day"
    }
  ]), []);

  const faqItems = useMemo(() => ([
    {
      question: "What happens when I revoke a Course Admin?",
      answer: "Revoking flips the account to Inactive immediately, invalidates refresh tokens, and removes course ownership. A record is stored in the audit log with timestamp and actor." 
    },
    {
      question: "Can I customise invitation templates?",
      answer: "Yes—edit the subject line and onboarding instructions before sending. Placeholders automatically inject recipient name, course, and expiry date to keep communication personal." 
    },
    {
      question: "How do I escalate a platform-wide incident?",
      answer: "Use the System Health panel to raise an incident. This triggers alerts to the engineering on-call list and archives the incident in the governance log for retros." 
    }
  ]), []);

  const heroActions = useMemo(() => ([
    {
      href: "/superadmin/admins",
      label: "Manage Course Admins",
      icon: "fas fa-user-shield",
      variant: "solid"
    },
    {
      href: "/superadmin/courses",
      label: "Browse All Courses",
      icon: "fas fa-university",
      variant: "ghost"
    },
    {
      href: "/superadmin",
      label: "Return to Dashboard",
      icon: "fas fa-tachometer-alt",
      variant: "ghost"
    }
  ]), []);

  const quickLinks = useMemo(() => ([
    {
      href: "/superadmin/admins",
      icon: "fas fa-user-plus",
      title: "Invitation Command",
      description: "Invite, revoke, and audit Course Admin access with expiry-backed tokens."
    },
    {
      href: "/superadmin/courses",
      icon: "fas fa-university",
      title: "Course Oversight",
      description: "Search every course, inspect staffing ratios, and export compliance reports."
    },
    {
      href: "/superadmin/profile",
      icon: "fas fa-id-badge",
      title: "Super Admin Profile",
      description: "Maintain contact details, escalation paths, and notification preferences."
    },
    {
      href: "/superadmin/documentation",
      icon: "fas fa-book-open",
      title: "Policy Library",
      description: "Bookmark this companion for governance procedures and API specs."
    },
    {
      href: "/superadmin",
      icon: "fas fa-tachometer-alt",
      title: "System Dashboard",
      description: "Monitor live stats, incident alerts, and invitation backlog at a glance."
    },
    {
      href: "/superadmin/courses?view=reports",
      icon: "fas fa-file-chart-line",
      title: "Governance Reports",
      description: "Generate semester summaries for steering committees in seconds."
    }
  ]), []);

  const [activePillar, setActivePillar] = useState(pillars[0].id);
  const [activePlaybook, setActivePlaybook] = useState(playbooks[0].id);
  const [expandedFaq, setExpandedFaq] = useState({});

  const currentPillar = pillars.find((pillar) => pillar.id === activePillar);
  const currentPlaybook = playbooks.find((playbook) => playbook.id === activePlaybook);

  const toggleFaq = (index) => {
    setExpandedFaq((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold">Super Admin Documentation</h1>
            <p className="mt-2 text-sm text-orange-100">
              Steward platform access, assure course delivery, and keep governance stakeholders informed.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {heroActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action.variant === "solid"
                      ? "bg-white text-orange-600 hover:bg-orange-100"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <i className={`${action.icon} mr-2`}></i>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-lg font-semibold">{metric.value}</p>
                <p className="text-xs text-orange-100">{metric.label}<br />{metric.context}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-orange-100 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Launch</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-3 p-5 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center text-sm font-semibold">
                <i className={`${link.icon} mr-3 text-base`}></i>
                {link.title}
              </div>
              <p className="text-sm text-orange-100 group-hover:text-white/90">
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
            <i className="fas fa-gem text-orange-500 mr-3"></i>
            Leadership Pillars
          </CardTitle>
          <CardDescription>
            Toggle between the three pillars that define the Super Admin mandate in OAS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {pillars.map((pillar) => (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePillar === pillar.id
                    ? 'bg-orange-600 text-white shadow'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <i className={`${pillar.icon} mr-2`}></i>
                {pillar.title}
              </button>
            ))}
          </div>

          {currentPillar && (
            <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="bg-white dark:bg-gray-900 border border-orange-100 dark:border-gray-700 rounded-xl p-5">
                <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-200">{currentPillar.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{currentPillar.description}</p>
              </div>
              <div className="rounded-xl border border-orange-100 dark:border-gray-700 p-5 bg-orange-50 dark:bg-gray-800/60">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {currentPillar.highlights.map((line) => (
                    <li key={line} className="flex">
                      <i className="fas fa-check text-orange-500 mr-2 mt-1"></i>
                      <span>{line}</span>
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
            <i className="fas fa-list-check text-orange-500 mr-3"></i>
            Action Playbooks
          </CardTitle>
          <CardDescription>
            Guided sequences for your most common governance tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activePlaybook} onValueChange={setActivePlaybook}>
            <TabsList className="flex flex-wrap gap-2 bg-orange-50 dark:bg-gray-800/60">
              {playbooks.map((playbook) => (
                <TabsTrigger key={playbook.id} value={playbook.id} className="px-3 py-2">
                  {playbook.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {playbooks.map((playbook) => (
              <TabsContent key={playbook.id} value={playbook.id}>
                <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] mt-4">
                  <div className="bg-orange-50 dark:bg-gray-800/60 rounded-xl p-5">
                    <h3 className="text-base font-semibold text-orange-700 dark:text-orange-300 mb-2">{playbook.summary}</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {playbook.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-xl border border-orange-100 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Definition of Done</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{playbook.success}</p>
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
            <i className="fas fa-circle-info text-orange-500 mr-3"></i>
            FAQs & Edge Cases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {faqItems.map((faq, index) => (
            <div key={faq.question} className="border border-orange-100 dark:border-gray-700 rounded-xl">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-orange-50 dark:hover:bg-gray-800/60 transition-colors rounded-xl"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{faq.question}</span>
                <i className={`fas fa-chevron-${expandedFaq[index] ? 'up' : 'down'} text-orange-400`}></i>
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
            <i className="fas fa-headset text-orange-500 mr-3"></i>
            Support Channels
          </CardTitle>
          <CardDescription>
            Connect with the right team instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="border border-orange-100 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Platform Operations</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Escalate outages, performance issues, or security concerns.</p>
            <a href="mailto:platform-ops@oas.edu.au" className="inline-flex items-center text-sm text-orange-600 dark:text-orange-400 hover:underline">
              <i className="fas fa-paper-plane mr-2"></i>
              platform-ops@oas.edu.au
            </a>
          </div>
          <div className="border border-orange-100 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Governance & Compliance</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Coordinate audits, data retention, and policy updates.</p>
            <a href="mailto:governance@oas.edu.au" className="inline-flex items-center text-sm text-orange-600 dark:text-orange-400 hover:underline">
              <i className="fas fa-scale-balanced mr-2"></i>
              governance@oas.edu.au
            </a>
          </div>
          <div className="border border-orange-100 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Product Feedback</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Suggest features that improve administrator experience.</p>
            <a href="mailto:feedback@oas.edu.au" className="inline-flex items-center text-sm text-orange-600 dark:text-orange-400 hover:underline">
              <i className="fas fa-comments mr-2"></i>
              Send Feedback Email
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
