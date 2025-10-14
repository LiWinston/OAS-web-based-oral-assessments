"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import RubricTable from "@/components/examiner/assessment/RubricTable.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_META = {
  SUBMITTED: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  REOPENED: { label: 'Reopened', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  DRAFT: { label: 'Draft', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const statusChip = (status) => {
  const meta = STATUS_META[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${meta.className}`}>{meta.label}</span>;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeKind = (value) => {
  const normalized = (value || '').toString().trim().toUpperCase();
  if (normalized === 'GROUP' || normalized === 'TEAM') return 'GROUP';
  if (normalized === 'INDIVIDUAL' || normalized === 'STUDENT' || normalized === 'PERSON') return 'INDIVIDUAL';
  if (normalized === 'BOTH' || normalized === 'ALL') return 'BOTH';
  return null;
};

const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const aggregateRubricState = (items = []) => {
  const selectedRatings = {};
  const comments = {};

  ensureArray(items).forEach((item) => {
    if (!item || !item.criterionId) return;
    const rangeMin = numberOrNull(item?.minPoints ?? item?.levelRange?.min ?? item?.startPoint);
    const rangeMax = numberOrNull(item?.maxPoints ?? item?.levelRange?.max ?? item?.endPoint ?? item?.points);
    const points = numberOrNull(item?.points ?? item?.score ?? item?.value ?? rangeMax ?? rangeMin ?? 0) ?? 0;

    selectedRatings[item.criterionId] = {
      levelId: item?.levelId || null,
      points,
      minPoints: rangeMin ?? 0,
      maxPoints: rangeMax ?? (rangeMin ?? points ?? 0),
    };

    const texts = ensureArray(item?.comments).map((c) => c?.text).filter(Boolean);
    if (texts.length) {
      comments[item.criterionId] = texts.join('\n');
    }
  });

  return { selectedRatings, comments };
};

const sumPoints = (ratings = {}) => {
  return Object.values(ratings).reduce((total, entry) => {
    const points = numberOrNull(entry?.points);
    return total + (points ?? 0);
  }, 0);
};

const formatScoreSummary = (computed, ratings, { pointsLabel = 'pts' } = {}) => {
  if (!computed && (!ratings || Object.keys(ratings).length === 0)) return '—';
  if (computed?.isAbsent || computed?.status === 'ABSENT') return 'Absent';

  const parts = [];
  const percent =
    numberOrNull(computed?.examinerScorePct1dp) ??
    numberOrNull(computed?.scorePct1dp) ??
    numberOrNull(computed?.percent);
  if (percent != null) parts.push(`${percent.toFixed(1)}%`);

  const points =
    numberOrNull(computed?.totalPoints) ??
    numberOrNull(computed?.rawPoints) ??
    numberOrNull(computed?.points);
  if (points != null) parts.push(`${points.toFixed(2)} ${pointsLabel}`);

  if (!parts.length) {
    const derived = numberOrNull(sumPoints(ratings));
    if (derived != null && derived !== 0) {
      parts.push(`${derived.toFixed(2)} ${pointsLabel}`);
    }
  }

  const weightContribution = numberOrNull(computed?.weightContributionPct ?? computed?.weightPct);
  if (weightContribution != null) {
    parts.push(`${weightContribution.toFixed(1)}% weight`);
  }

  return parts.length ? parts.join(' • ') : '—';
};

const normalizeEntities = (examiner) => {
  if (!examiner) return [];

  const directEntities = ensureArray(examiner?.entities).map((entity, index) => {
    const kind = normalizeKind(entity?.kind ?? entity?.entityKind ?? entity?.type) || 'GROUP';
    const studentId = entity?.studentId ?? entity?.student?.studentId ?? null;
    const groupId = entity?.groupId ?? entity?.group?.groupId ?? null;
    const entityId = entity?.entityId ?? studentId ?? groupId ?? index;

    return {
      kind,
      entityId,
      studentId: studentId ?? (kind === 'INDIVIDUAL' ? entityId : null),
      studentName: entity?.studentName ?? entity?.student?.name ?? null,
      studentNumber: entity?.studentNumber ?? entity?.student?.studentNumber ?? null,
      groupId: groupId ?? (kind === 'GROUP' ? entityId : null),
      groupName: entity?.groupName ?? entity?.group?.groupName ?? null,
      items: ensureArray(entity?.items),
      computed: entity?.computed ?? {},
      overallFeedback: entity?.overallFeedback,
      notes: entity?.notes,
    };
  }).filter(Boolean);

  if (directEntities.length) return directEntities;

  const grouped = new Map();

  ensureArray(examiner?.items).forEach((item, index) => {
    const inferredKind =
      normalizeKind(item?.entityKind ?? item?.target ?? item?.component) ||
      (item?.studentId != null || item?.student?.studentId != null ? 'INDIVIDUAL' : 'GROUP');

    const studentId = item?.studentId ?? item?.student?.studentId ?? item?.entityId ?? (inferredKind === 'INDIVIDUAL' ? index : null);
    const groupId = item?.groupId ?? item?.group?.groupId ?? item?.entityId ?? (inferredKind === 'GROUP' ? 'group' : null);
    const entityKey = inferredKind === 'INDIVIDUAL' ? `INDIVIDUAL-${studentId}` : `GROUP-${groupId}`;

    if (!grouped.has(entityKey)) {
      grouped.set(entityKey, {
        kind: inferredKind,
        entityId: inferredKind === 'INDIVIDUAL' ? studentId : groupId,
        studentId: inferredKind === 'INDIVIDUAL' ? studentId : null,
        studentName: item?.studentName ?? item?.student?.name ?? null,
        studentNumber: item?.studentNumber ?? item?.student?.studentNumber ?? null,
        groupId: inferredKind === 'GROUP' ? groupId : null,
        groupName: item?.groupName ?? item?.group?.groupName ?? null,
        items: [],
        computed: item?.computed ?? {},
      });
    }

    const target = grouped.get(entityKey);
    if (!target.studentName && item?.studentName) target.studentName = item.studentName;
    if (!target.groupName && item?.groupName) target.groupName = item.groupName;
    target.items.push(item);
  });

  return Array.from(grouped.values());
};

export default function ExaminerPanel({ examiner, rubricFrozen, onReview }) {
  const canReview = examiner.assessmentStatus === 'SUBMITTED';

  const rubricCriteria = useMemo(() => {
    return ensureArray(rubricFrozen?.criteria).map((criterion) => ({
      criterionId: criterion.criterionId,
      description: criterion.text || criterion.title || criterion.criterionId,
      weight: numberOrNull(criterion.weightPct ?? criterion.weight) ?? 0,
      appliesTo: normalizeKind(criterion.appliesTo) || criterion.appliesTo || 'BOTH',
      scaleType: criterion.scaleType || (rubricFrozen?.weightBasis === 'points' ? 'points' : 'descriptive'),
      levels: ensureArray(criterion?.levels).map((level, index) => {
        const min = numberOrNull(level?.minPoints ?? level?.levelRange?.min);
        const max = numberOrNull(level?.maxPoints ?? level?.levelRange?.max ?? level?.value);
        return {
          levelId: level?.levelId || `L${index + 1}`,
          levelLabel: level?.levelLabel || level?.label || level?.levelId || `Level ${index + 1}`,
          description: level?.description,
          levelRange: {
            min: min ?? 0,
            max: max ?? (min ?? 0),
          },
          minPoints: min ?? 0,
          maxPoints: max ?? (min ?? 0),
        };
      }),
    }));
  }, [rubricFrozen]);

  const entities = useMemo(() => normalizeEntities(examiner), [examiner]);

  const { groupView, individualViews } = useMemo(() => {
    const groupEntity = entities.find((entity) => entity.kind === 'GROUP');
    const individualEntities = entities.filter((entity) => entity.kind === 'INDIVIDUAL');

    const groupView = groupEntity
      ? {
          ...groupEntity,
          ...aggregateRubricState(groupEntity.items),
          displayName: groupEntity.groupName || 'Group Rubric',
        }
      : null;

    const individualViews = individualEntities.map((entity, index) => ({
      ...entity,
      key: String(entity.entityId ?? entity.studentId ?? index),
      displayName: entity.studentName || entity.studentNumber || `Student ${index + 1}`,
      ...aggregateRubricState(entity.items),
    }));

    return { groupView, individualViews };
  }, [entities]);

  const [activeIndividualId, setActiveIndividualId] = useState(() => individualViews?.[0]?.key ?? null);

  useEffect(() => {
    if (!individualViews.length) {
      if (activeIndividualId !== null) setActiveIndividualId(null);
      return;
    }
    const exists = individualViews.some((view) => view.key === activeIndividualId);
    if (!exists) {
      setActiveIndividualId(individualViews[0].key);
    }
  }, [individualViews, activeIndividualId]);

  const activeTabValue = activeIndividualId ?? individualViews?.[0]?.key ?? '';
  const weightBasis = rubricFrozen?.weightBasis === 'points' ? 'points' : 'percentage';
  const groupWeight = numberOrNull(rubricFrozen?.weights?.group);
  const individualWeight = numberOrNull(rubricFrozen?.weights?.individual);
  const weightSuffix = weightBasis === 'points' ? 'pts' : '%';
  const summaryPointsLabel = 'pts';

  return (
    <div className="dashboard-card p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <i className="fas fa-user-tie text-gray-400" />
            {examiner.name}
            {statusChip(examiner.assessmentStatus)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {examiner.submittedAt ? `Submitted ${new Date(examiner.submittedAt).toLocaleString()}` : 'Not yet submitted'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {typeof examiner.examinerScorePct1dp === 'number' && (
            <div className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-gray-100">Score:</span> {examiner.examinerScorePct1dp.toFixed(1)}%</div>
          )}
          <Button variant="outline" disabled={!canReview} onClick={() => onReview?.(examiner)}>
            <i className="fas fa-rotate-left mr-2" /> Review
          </Button>
        </div>
      </div>

      {(groupWeight || individualWeight) && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
          {groupWeight != null && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
              <i className="fas fa-users text-[10px]" />
              Group Weight: {groupWeight}{weightSuffix}
            </span>
          )}
          {individualWeight != null && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
              <i className="fas fa-user text-[10px]" />
              Individual Weight: {individualWeight}{weightSuffix}
            </span>
          )}
        </div>
      )}

      {groupView && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Group Rubric</h3>
            {groupView.groupName && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{groupView.groupName}</span>
            )}
          </div>
          <RubricTable
            criteria={rubricCriteria}
            selectedRatings={groupView.selectedRatings}
            comments={groupView.comments}
            disabled={true}
            assessmentType="GROUP"
            showTotals={false}
          />
        </div>
      )}

      {individualViews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Individual Rubric</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {individualViews.length} student{individualViews.length === 1 ? '' : 's'}
            </span>
          </div>
          <Tabs value={activeTabValue} onValueChange={setActiveIndividualId} className="space-y-3">
            <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
              {individualViews.map((view) => (
                <TabsTrigger
                  key={view.key}
                  value={view.key}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <i className="fas fa-user text-xs mr-2" />
                  {view.displayName}
                </TabsTrigger>
              ))}
            </TabsList>
            {individualViews.map((view) => (
              <TabsContent key={view.key} value={view.key}>
                <RubricTable
                  criteria={rubricCriteria}
                  selectedRatings={view.selectedRatings}
                  comments={view.comments}
                  disabled={true}
                  assessmentType="INDIVIDUAL"
                  showTotals={false}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      {(groupView || individualViews.length > 0) && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 p-4 space-y-2">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Score Summary</div>
          {groupView && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                <i className="fas fa-users text-xs mr-2 text-gray-400" />
                Group total
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatScoreSummary(groupView.computed, groupView.selectedRatings, { pointsLabel: summaryPointsLabel })}
              </span>
            </div>
          )}
          {individualViews.map((view) => (
            <div key={`summary-${view.key}`} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                <i className="fas fa-user text-xs mr-2 text-gray-400" />
                {view.displayName}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatScoreSummary(view.computed, view.selectedRatings, { pointsLabel: summaryPointsLabel })}
              </span>
            </div>
          ))}
        </div>
      )}

      {!groupView && individualViews.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
          No rubric data submitted for this examiner snapshot.
        </div>
      )}

      {(examiner.overallFeedback || examiner.notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examiner.overallFeedback && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Student feedback</div>
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{examiner.overallFeedback}</div>
            </div>
          )}
          {examiner.notes && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Coordinator notes</div>
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{examiner.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
