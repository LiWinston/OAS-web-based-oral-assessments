"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import UsersTable from "@/components/admin/users/UsersTable";
import ScopeSelector from "@/components/admin/users/ScopeSelector";
import AddUserModal from "@/components/admin/users/AddUserModal";
import UsersEmptyState from "@/components/admin/users/UsersEmptyState";
import ConfirmDialog from "@/components/admin/users/ConfirmDialog";
import { userService } from "@/services/userService";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const ROLES = ["STUDENT", "EXAMINER"];

function AdminUsersContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);

  const courseId = searchParams.get("courseId") || "";
  const assignmentId = searchParams.get("assignmentId") || "";
  const role = searchParams.get("role") || ROLES[0];
  const q = searchParams.get("search") || "";

  // Persist last scope in localStorage
  useEffect(() => {
    if (courseId && assignmentId) {
      localStorage.setItem("oas-users-last-scope", JSON.stringify({ courseId, assignmentId }));
    }
  }, [courseId, assignmentId]);

  // Restore scope if none selected
  useEffect(() => {
    if (!courseId || !assignmentId) {
      const raw = localStorage.getItem("oas-users-last-scope");
      if (raw) {
        const { courseId: c, assignmentId: a } = JSON.parse(raw);
        if (c && a) updateParams({ courseId: c, assignmentId: a });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateParams = (updates) => {
    const sp = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") sp.delete(k);
      else sp.set(k, String(v));
    });
    router.replace(`?${sp.toString()}`);
  };

  const { data: coursesRes } = useQuery({
    queryKey: ["courses", user?.id],
    queryFn: () => courseService.getAllCourses({ adminUserId: user?.id }),
    enabled: !!user?.id,
  });
  const courses = coursesRes?.data?.data || coursesRes?.data || coursesRes?.courses;

  const { data: assignmentsRes } = useQuery({
    queryKey: ["assignments", courseId],
    queryFn: () => assignmentService.getAssignments(courseId),
    enabled: !!courseId,
  });
  const assignments = assignmentsRes?.data?.data || assignmentsRes?.data || assignmentsRes;

  const assignmentType = useMemo(() => {
    return assignments?.find?.((a) => String(a.id) === String(assignmentId))?.type || "individual";
  }, [assignments, assignmentId]);

  const { data: usersRes, isLoading: listLoading } = useQuery({
    queryKey: ["assignmentUsers", courseId, assignmentId, role, q],
    queryFn: () => userService.listAssignmentUsers(courseId, assignmentId, { role, q }),
    enabled: !!courseId && !!assignmentId && !!role,
  });
  const rows = usersRes?.data || [];

  // Counts per tab (overall, not filtered by search)
  const { data: studentCountRes } = useQuery({
    queryKey: ["assignmentUsersCount", courseId, assignmentId, "STUDENT"],
    queryFn: () => userService.listAssignmentUsers(courseId, assignmentId, { role: "STUDENT", page: 0, size: 1 }),
    enabled: !!courseId && !!assignmentId,
  });
  const { data: examinerCountRes } = useQuery({
    queryKey: ["assignmentUsersCount", courseId, assignmentId, "EXAMINER"],
    queryFn: () => userService.listAssignmentUsers(courseId, assignmentId, { role: "EXAMINER", page: 0, size: 1 }),
    enabled: !!courseId && !!assignmentId,
  });
  const studentsTotal = studentCountRes?.total ?? 0;
  const examinersTotal = examinerCountRes?.total ?? 0;

  const [lastAdd, setLastAdd] = useState(null);
  const [highlightId, setHighlightId] = useState(null);

  const addMutation = useMutation({
    mutationFn: (payload) => userService.addAssignmentUser(courseId, assignmentId, payload),
    onSuccess: (res) => {
      if (res?.success) {
        toast.success("User added to assignment.");
        setLastAdd(res.data);
        if (res?.data?.assignmentUserId) {
          setHighlightId(res.data.assignmentUserId);
          setTimeout(() => setHighlightId(null), 2500);
        }
        queryClient.invalidateQueries({ queryKey: ["assignmentUsers", courseId, assignmentId] });
        // auto-hide banner after a bit
        setTimeout(() => setLastAdd(null), 4000);
      } else {
        toast.error(res?.message || "Failed to add user");
      }
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to add user";
      toast.error(msg);
    },
  });

  const removeOne = useMutation({
    mutationFn: ({ assignmentUserId }) => userService.removeAssignmentUser(assignmentId, assignmentUserId),
    onSuccess: (res) => {
      if (res?.success) {
        const d = res.data || {};
        const parts = [];
        if (d.canceledBookings) parts.push(`${d.canceledBookings} bookings cancelled`);
        if (d.clearedExaminerSlots) parts.push(`${d.clearedExaminerSlots} slots cleared`);
        toast.success(parts.length ? `Removed. ${parts.join("; ")}` : "Removed.");
        queryClient.invalidateQueries({ queryKey: ["assignmentUsers", courseId, assignmentId] });
      } else {
        toast.error(res?.message || "Failed to remove");
      }
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to remove";
      toast.error(msg);
    },
  });

  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    // clear selection when list/role changes
    setSelectedIds(new Set());
  }, [courseId, assignmentId, role, q]);

  const toggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const toggleSelectAll = (checked) => {
    if (!rows?.length) return setSelectedIds(new Set());
    if (checked) setSelectedIds(new Set(rows.map((r) => r.assignmentUserId)));
    else setSelectedIds(new Set());
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState(null); // 'single' | 'bulk'
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [bulkRemoving, setBulkRemoving] = useState(false);

  const handleBulkRemove = async () => {
    if (!selectedIds.size) return;
    setConfirmMode('bulk');
    setConfirmTarget(null);
    setConfirmOpen(true);
  };

  const handleAdd = async (payload) => {
    const res = await addMutation.mutateAsync(payload);
    if (res?.success === false && res?.code === "ALREADY_IN_ASSIGNMENT") {
      toast("Already in assignment", { icon: "ℹ️" });
    }
  };

  const onRemoveSingle = (row) => {
    setConfirmMode('single');
    setConfirmTarget(row);
    setConfirmOpen(true);
  };

  const doConfirmRemove = async () => {
    if (confirmMode === 'single' && confirmTarget) {
      removeOne.mutate({ assignmentUserId: confirmTarget.assignmentUserId });
      setConfirmOpen(false);
      setConfirmTarget(null);
      setConfirmMode(null);
      return;
    }
    if (confirmMode === 'bulk') {
      setBulkRemoving(true);
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        // eslint-disable-next-line no-await-in-loop
        await removeOne.mutateAsync({ assignmentUserId: id });
      }
      setSelectedIds(new Set());
      setBulkRemoving(false);
      setConfirmOpen(false);
      setConfirmMode(null);
    }
  };

  const currentRole = ROLES.includes(role) ? role : ROLES[0];

  const pageTitle = "User Management";
  const courseName = courses?.find?.((c) => String(c.id) === String(courseId))?.courseName;
  const assignmentTitle = assignments?.find?.((a) => String(a.id) === String(assignmentId))?.title || assignments?.find?.((a) => String(a.id) === String(assignmentId))?.name;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <h1 className="text-xl font-semibold">{pageTitle}</h1>
              <p className="text-blue-100 text-sm">Manage users for a selected assignment.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left scope pane */}
        <div className="md:col-span-4 lg:col-span-3">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Scope</h3>
            <ScopeSelector
              courses={courses || []}
              assignments={assignments || []}
              selectedCourseId={courseId}
              selectedAssignmentId={assignmentId}
              onCourseChange={(v) => updateParams({ courseId: v, assignmentId: "" })}
              onAssignmentChange={(v) => updateParams({ assignmentId: v })}
            />
            {(courseName || assignmentTitle) && (
              <div className="mt-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                {courseName && (
                  <div className="flex items-center gap-2"><i className="fas fa-book text-blue-500"></i><span>Course: {courseName}</span></div>
                )}
                {assignmentTitle && (
                  <div className="flex items-center gap-2"><i className="fas fa-clipboard-list text-indigo-500"></i><span>Assignment: {assignmentTitle}</span></div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right content pane */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* Tabs + Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800 p-1">
              {ROLES.map((r) => {
                const count = r === "STUDENT" ? studentsTotal : examinersTotal;
                return (
                  <button
                    key={r}
                    className={`px-4 py-2 text-sm rounded-full transition-colors ${currentRole === r ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow" : "text-gray-700 dark:text-gray-300"}`}
                    onClick={() => updateParams({ role: r })}
                  >
                    {r === "STUDENT" ? "Students" : "Examiners"}
                    <span className="ml-2 text-xs opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder={`Search ${currentRole.toLowerCase()}...`}
                  value={q}
                  onChange={(e) => updateParams({ search: e.target.value })}
                  className="pl-8 w-64"
                />
                <i className="fas fa-search absolute left-2.5 top-2.5 text-gray-400"></i>
              </div>
              <Button variant="outline" onClick={() => setAddOpen(true)} disabled={!assignmentId || !courseId}>
                <i className="fas fa-user-plus mr-2" /> Add User
              </Button>
              <Button variant="destructive" onClick={handleBulkRemove} disabled={selectedIds.size === 0 || bulkRemoving}>
                <i className="fas fa-trash mr-2" /> {bulkRemoving ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>

          {/* Users */}
          <Card className="p-0 card-hover-shadow">
            {lastAdd && (
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 flex items-center gap-3">
                <i className="fas fa-sparkles text-green-600 dark:text-green-300"></i>
                <div className="text-sm text-green-800 dark:text-green-200">
                  {lastAdd.created ? "New user created and linked" : "Existing user linked"}
                  {lastAdd.inviteSent ? " — invitation sent" : ""}.
                </div>
              </div>
            )}
            {rows?.length === 0 && !listLoading ? (
              <UsersEmptyState role={currentRole} onAdd={() => setAddOpen(true)} />
            ) : (
              <UsersTable
                role={currentRole}
                rows={rows}
                loading={listLoading}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onRemoveOne={onRemoveSingle}
                highlightId={highlightId}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Add modal */}
      <AddUserModal
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultRole={currentRole}
        assignmentType={assignmentType}
        onSubmit={handleAdd}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        mode={confirmMode || 'single'}
        target={confirmTarget}
        selectedCount={selectedIds.size}
        assignmentTitle={assignmentTitle || 'this assignment'}
        onConfirm={doConfirmRemove}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
