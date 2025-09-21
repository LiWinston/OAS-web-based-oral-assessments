"use client";

import { useMemo } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function UsersTable({
  role,
  rows,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRemoveOne,
  highlightId,
}) {
  const allSelected = useMemo(() => rows?.length > 0 && rows.every((r) => selectedIds.has(r.assignmentUserId)), [rows, selectedIds]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const formatAddedAt = (value) => {
    if (!value && value !== 0) {
      return "Pending";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= 0) {
      return "Pending";
    }

    return dateFormatter.format(parsed);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            {role === "STUDENT" ? <TableHead>Group</TableHead> : <TableHead>Assigned Slots</TableHead>}
            <TableHead>Added On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && Array.from({ length: 5 }).map((_, idx) => (
            <TableRow key={`skeleton-${idx}`}>
              <TableCell>
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </TableCell>
              <TableCell className="text-right">
                <div className="h-8 w-20 ml-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </TableCell>
            </TableRow>
          ))}
          {!loading && rows?.length === 0 && null}
          {!loading && rows?.map((row) => (
            <TableRow key={row.assignmentUserId} className={highlightId === row.assignmentUserId ? "bg-green-50 dark:bg-green-900/20 transition-colors" : undefined}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.assignmentUserId)}
                  onChange={(e) => onToggleSelect(row.assignmentUserId, e.target.checked)}
                />
              </TableCell>
              <TableCell>{row.fullName || "-"}</TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">{row.email}</TableCell>
              {role === "STUDENT" ? (
                <TableCell>{row.groupId || "-"} {typeof row.bookingsCount === "number" ? <span className="text-xs text-gray-500">(bookings: {row.bookingsCount})</span> : null}</TableCell>
              ) : (
                <TableCell>{row.assignedSlotsCount ?? 0}</TableCell>
              )}
              <TableCell>{formatAddedAt(row.addedAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="destructive" size="sm" onClick={() => onRemoveOne(row)}>
                  <i className="fas fa-user-minus mr-2" /> Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableCaption>Assignment {role.toLowerCase()} list</TableCaption>
      </Table>
    </div>
  );
}
