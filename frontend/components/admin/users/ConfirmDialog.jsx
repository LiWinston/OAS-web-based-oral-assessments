"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const roleLabel = (role) => {
  if (!role) return "User";
  const r = String(role).replace(/^ROLE_/, "");
  return r === "STUDENT" ? "Student" : r === "EXAMINER" ? "Examiner" : r;
};
export default function ConfirmDialog({
  open,
  onOpenChange,
  mode = "single", // 'single' | 'bulk'
  target = null, // row object for single
  selectedCount = 0, // for bulk
  assignmentTitle = "this assignment",
  onConfirm,
}) {
  const [ack, setAck] = useState(false);
  const primaryText = useMemo(() => {
    if (mode === "bulk") return `Remove ${selectedCount} user${selectedCount > 1 ? "s" : ""}`;
    const name = target?.fullName || target?.email || "this user";
    return `Remove ${name}`;
  }, [mode, selectedCount, target]);

  const details = useMemo(() => {
    if (mode === "single") {
      return {
        name: target?.fullName || target?.email,
        email: target?.email,
        role: roleLabel(target?.role),
      };
    }
    return null;
  }, [mode, target]);

  return (
    <Dialog open={open} onOpenChange={(v) => { setAck(false); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            {mode === "bulk" ? `Remove ${selectedCount} selected ${selectedCount > 1 ? "users" : "user"}?` : `Remove ${details?.name || "user"}?`}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-3">
              <p>
                This action will remove {mode === "bulk" ? `${selectedCount} user${selectedCount > 1 ? "s" : ""}` : "this user"} from <span className="font-medium">{assignmentTitle}</span>.
                It cannot be undone.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-foreground">
                <li>All future student bookings for this assignment will be cancelled.</li>
                <li>All examiner slot assignments for this assignment will be cleared.</li>
              </ul>
              {mode === "single" && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <i className="fas fa-user" />
                    <span>{details?.name}</span>
                    {details?.role && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 border">
                        {details.role}
                      </span>
                    )}
                  </span>
                </div>
              )}
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                <span>I understand this action cannot be undone.</span>
              </label>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!ack} onClick={() => { onConfirm?.(); }}>
            {primaryText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
