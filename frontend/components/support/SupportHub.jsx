'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { supportService } from '@/services/supportService';
import { useNotification } from '@/hooks/useNotification';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MAX_MESSAGE_LENGTH = 1200;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const formatFileSize = (size) => {
  if (!size && size !== 0) return '';
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${size} B`;
};

export function SupportHub({ config }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { showNotification } = useNotification();

  const categories = useMemo(() => config?.categories || [], [config?.categories]);
  const defaultCategory = categories[0]?.value || 'general';
  const defaultPriority = config?.defaultPriority || 'normal';

  const [formState, setFormState] = useState({
    name: user?.username || '',
    email: user?.email || '',
    category: defaultCategory,
    subject: '',
    message: '',
    priority: defaultPriority,
    consent: true,
  });

  const [attachment, setAttachment] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState({
    status: 'idle',
    ticketId: '',
    submittedAt: '',
  });

  const messageCharsLeft = MAX_MESSAGE_LENGTH - formState.message.length;
  const isSubmitDisabled =
    !formState.subject.trim() ||
    !formState.message.trim() ||
    !formState.email.trim() ||
    isSubmitting;

  const handleFieldChange = (key) => (event) => {
    const value = event?.target?.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectChange = (key) => (value) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAttachment(null);
      setFileError('');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAttachment(null);
      setFileError('The file is too large (max 5MB). Please compress and try again.');
      return;
    }

    setAttachment(file);
    setFileError('');
  };

  const resetForm = () => {
    setFormState({
      name: user?.username || '',
      email: user?.email || '',
      category: defaultCategory,
      subject: '',
      message: '',
      priority: defaultPriority,
      consent: true,
    });
    setAttachment(null);
    setFileError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setIsSubmitting(true);
    setSubmissionState({ status: 'idle', ticketId: '', submittedAt: '' });

    try {
      const payload = {
        ...formState,
        role: config?.roleKey,
        context: {
          pathname,
          hero: config?.hero?.title,
          quickLinks: (config?.quickLinks || []).map((link) => link.title),
        },
        attachment: attachment
          ? {
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
            }
          : null,
      };

      const response = await supportService.submitSupportRequest(payload);
      const ticketId =
        response?.data?.ticketId ||
        response?.ticketId ||
        `SUP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      setSubmissionState({
        status: 'success',
        ticketId,
        submittedAt: new Date().toISOString(),
      });
      resetForm();
      showNotification(
        'success',
        config?.form?.successToast || 'Your support request has been sent. We will get back to you soon.'
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        config?.form?.errorToast ||
        'Submission failed. Please wait a moment and try again.';
      showNotification('error', message);
      setSubmissionState({ status: 'error', ticketId: '', submittedAt: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    if (submissionState.status === 'success') {
      return (
        <div className="space-y-6">
          <div className="rounded-2xl bg-blue-50 p-6 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <i className="fas fa-check-circle text-2xl text-blue-500" aria-hidden="true"></i>
              {config?.form?.successTitle || 'Thanks! We have your request.'}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-blue-900/80 dark:text-blue-100/80">
              {config?.form?.successDescription ||
                'Our development team will drop you a line at the email you provided. Save the ticket number for follow-up.'}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow dark:bg-blue-950/70 dark:text-blue-200">
              <span>Ticket ID:</span>
              <span className="font-semibold">{submissionState.ticketId}</span>
            </div>
          </div>

          {config?.form?.followUp && (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white p-4 text-sm text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
              {config.form.followUp}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={resetForm} type="button">
              <i className="fas fa-paper-plane mr-2" aria-hidden="true"></i>
              Submit another request
            </Button>
            <Button asChild variant="outline">
              <Link href={config?.hero?.secondaryAction?.href || '#'}>
                <i className="fas fa-envelope-open-text mr-2" aria-hidden="true"></i>
                Go to contact options
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="support-name">Your name</Label>
            <Input
              id="support-name"
              placeholder="How should we address you?"
              value={formState.name}
              onChange={handleFieldChange('name')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-email">Email</Label>
            <Input
              id="support-email"
              type="email"
              placeholder="you@example.com"
              value={formState.email}
              onChange={handleFieldChange('email')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-category">Issue category</Label>
            <Select value={formState.category} onValueChange={handleSelectChange('category')}>
              <SelectTrigger id="support-category" className="w-full justify-between">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="w-full min-w-[14rem]">
                {categories.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <span className="flex items-center gap-2">
                      {item.icon && <i className={`${item.icon} text-blue-500`} aria-hidden="true"></i>}
                      <span>{item.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-priority">Priority</Label>
            <Select value={formState.priority} onValueChange={handleSelectChange('priority')}>
              <SelectTrigger id="support-priority" className="w-full justify-between">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="w-full min-w-[12rem]">
                <SelectItem value="normal">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-clock text-blue-500" aria-hidden="true"></i>
                    Normal (within 24h)
                  </span>
                </SelectItem>
                <SelectItem value="urgent">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-bolt text-amber-500" aria-hidden="true"></i>
                    Urgent (exam in progress)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-subject">Subject</Label>
          <Input
            id="support-subject"
            placeholder={config?.form?.subjectPlaceholder || 'Give us a short headline'}
            value={formState.subject}
            onChange={handleFieldChange('subject')}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-message">Details</Label>
          <textarea
            id="support-message"
            value={formState.message}
            onChange={(event) => {
              const { value } = event.target;
              if (value.length <= MAX_MESSAGE_LENGTH) {
                handleFieldChange('message')(event);
              }
            }}
            placeholder={
              config?.form?.messagePlaceholder ||
              'Tell us what happened, which course/assignment is affected, and any deadlines we should note.'
            }
            rows={6}
            className="border-input focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 w-full rounded-lg border bg-transparent px-3 py-2 text-sm leading-6 shadow-xs outline-none"
            required
          />
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Include URLs or codes if available so we can reproduce quickly.</span>
            <span>{messageCharsLeft} characters left</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="support-attachment">Attachment (optional)</Label>
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 hover:border-blue-400 hover:bg-blue-50/40 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
            <input
              id="support-attachment"
              type="file"
              accept="image/*,.pdf,.csv,.xlsx,.docx,.txt"
              onChange={handleFileChange}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Supported file types: PNG, JPG, PDF, CSV, DOCX, etc. Max size 5MB.
            </span>
            {attachment && (
              <div className="flex items-center gap-2 rounded-md bg-white/70 px-3 py-2 text-xs text-gray-700 shadow-sm dark:bg-gray-900/40 dark:text-gray-200">
                <i className="fas fa-paperclip text-blue-500" aria-hidden="true"></i>
                <span className="truncate">{attachment.name}</span>
                <span className="text-gray-400">{formatFileSize(attachment.size)}</span>
                <button
                  type="button"
                  className="ml-auto text-gray-400 transition hover:text-red-500"
                  onClick={() => setAttachment(null)}
                  aria-label="Remove attachment"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
            {fileError && (
              <span className="text-xs text-red-500" role="alert">
                {fileError}
              </span>
            )}
          </div>
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={formState.consent}
            onChange={handleFieldChange('consent')}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            I agree the development team may contact me and access related logs/context if needed to diagnose quickly.
          </span>
        </label>

        {submissionState.status === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-100">
            Something went wrong. Please try again later or contact us via the adjacent options.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitDisabled}>
            <i
              className={`fas ${isSubmitting ? 'fa-circle-notch animate-spin' : 'fa-paper-plane'} mr-2`}
              aria-hidden="true"
            ></i>
            {isSubmitting ? 'Sending...' : config?.form?.submitLabel || 'Submit request'}
          </Button>
          <Button type="button" variant="ghost" onClick={resetForm} disabled={isSubmitting}>
            Clear form
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-500 to-sky-500 p-6 text-white shadow-xl lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-5">
            {config?.hero?.badge && (
              <Badge className="bg-white/20 text-white shadow" variant="secondary">
                {config.hero.badge}
              </Badge>
            )}
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {config?.hero?.title || 'Support center'}
              </h1>
              <p className="max-w-2xl text-sm text-white/90 sm:text-base">
                {config?.hero?.subtitle ||
                  'Let us know what you need and the development team will help you keep assessments on track.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {config?.hero?.primaryAction && (
                <Button
                  asChild
                  variant="secondary"
                  className="bg-white text-blue-700 hover:bg-white/90"
                >
                  <Link href={config.hero.primaryAction.href}>
                    {config.hero.primaryAction.icon && (
                      <i className={`${config.hero.primaryAction.icon} mr-2`} aria-hidden="true"></i>
                    )}
                    {config.hero.primaryAction.label}
                  </Link>
                </Button>
              )}
              {config?.hero?.secondaryAction && (
                <Button
                  asChild
                  variant="ghost"
                  className="bg-white/15 text-white hover:bg-white/25"
                >
                  <Link href={config.hero.secondaryAction.href}>
                    {config.hero.secondaryAction.icon && (
                      <i className={`${config.hero.secondaryAction.icon} mr-2`} aria-hidden="true"></i>
                    )}
                    {config.hero.secondaryAction.label}
                  </Link>
                </Button>
              )}
            </div>
          </div>
          {config?.hero?.stats?.length ? (
            <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-center">
              {config.hero.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/15 p-4 text-sm font-medium text-white/90 shadow-inner"
                >
                  <div className="text-2xl font-semibold text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-white/70">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {config?.quickLinks?.length ? (
        <section className="grid gap-4 md:grid-cols-3">
          {config.quickLinks.map((item) => (
            <Link key={item.title} href={item.href} className="group">
              <Card className="h-full bg-white/90 transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-gray-900/60">
                <CardContent className="flex h-full flex-col gap-3 py-6">
                  <div className="flex items-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {item.icon && (
                      <i className={`${item.icon} mr-3 text-lg text-blue-600`} aria-hidden="true"></i>
                    )}
                    {item.title}
                  </div>
                  <p className="text-sm text-gray-600 transition-colors group-hover:text-gray-700 dark:text-gray-400">
                    {item.description}
                  </p>
                  <div className="mt-auto inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                    View details
                    <i className="fas fa-arrow-right-long ml-2" aria-hidden="true"></i>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="order-1 shadow-md dark:bg-gray-900/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <i className="fas fa-life-ring mr-3 text-blue-600" aria-hidden="true"></i>
              {config?.form?.title || 'Contact the development team'}
            </CardTitle>
            <CardDescription>
              {config?.form?.description ||
                'Send a message directly to the OAS development team. Tell us what you need and we will respond within one business day.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8 pt-4">{renderForm()}</CardContent>
        </Card>

        <div className="order-2 space-y-6">
          {config?.channels?.length ? (
            <Card className="shadow-md dark:bg-gray-900/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <i className="fas fa-headset mr-3 text-blue-600" aria-hidden="true"></i>
                  Other ways to reach us
                </CardTitle>
                <CardDescription>
                  We keep multiple lines open during assessment periods.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {config.channels.map((channel) => (
                  <div
                    key={channel.title}
                    className="rounded-xl border border-gray-200 bg-white/80 p-4 text-sm shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50"
                  >
                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {channel.icon && (
                        <i className={`${channel.icon} text-blue-600`} aria-hidden="true"></i>
                      )}
                      {channel.title}
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
                      {channel.description}
                    </p>
                    {channel.href && (
                      <Button
                        asChild
                        variant="ghost"
                        className="mt-3 px-0 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <Link href={channel.href}>
                          {channel.actionLabel || 'Open channel'}
                          <i className="fas fa-arrow-up-right-from-square ml-2" aria-hidden="true"></i>
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {config?.contextTips?.length ? (
            <Card className="shadow-md dark:bg-gray-900/70">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <i className="fas fa-lightbulb mr-3 text-amber-400" aria-hidden="true"></i>
                  Context that helps us help you faster
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm text-gray-600 dark:text-gray-300">
                {config.contextTips.map((tip) => (
                  <div key={tip.title} className="flex items-start gap-3">
                    <span className="mt-1 text-blue-500">
                      <i className={tip.icon || 'fas fa-circle-dot'} aria-hidden="true"></i>
                    </span>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{tip.title}</p>
                      <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      {config?.faqs?.length ? (
        <Card className="shadow-md dark:bg-gray-900/70">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <i className="fas fa-circle-question mr-3 text-blue-600" aria-hidden="true"></i>
              Frequently asked questions
            </CardTitle>
            <CardDescription>
              Quick answers for the most common support scenarios by role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-gray-200 bg-white/70 p-4 text-sm shadow-sm transition-all hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900/50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-gray-800 marker:hidden dark:text-gray-100">
                  <span className="font-medium">{faq.question}</span>
                  <i className="fas fa-chevron-down text-xs text-gray-500 transition group-open:rotate-180" aria-hidden="true"></i>
                </summary>
                <p className="mt-3 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </p>
              </details>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default SupportHub;
