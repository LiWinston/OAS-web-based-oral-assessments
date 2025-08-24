"use client";

import { useMemo } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ScopeSelector({
  courses = [],
  assignments = [],
  selectedCourseId,
  selectedAssignmentId,
  onCourseChange,
  onAssignmentChange,
}) {
  const courseOptions = useMemo(() => courses?.map((c) => ({ value: String(c.id), label: `${c.courseCode || "COURSE"} - ${c.courseName}` })), [courses]);
  const assignmentOptions = useMemo(() => assignments?.map((a) => ({ value: String(a.id), label: a.title || a.name })), [assignments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="mb-1 block">Course</Label>
        <Select value={selectedCourseId ? String(selectedCourseId) : undefined} onValueChange={(v) => onCourseChange?.(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courseOptions?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-1 block">Assignment</Label>
        <Select value={selectedAssignmentId ? String(selectedAssignmentId) : undefined} onValueChange={(v) => onAssignmentChange?.(v)} disabled={!selectedCourseId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={selectedCourseId ? "Select an assignment" : "Select a course first"} />
          </SelectTrigger>
          <SelectContent>
            {assignmentOptions?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
