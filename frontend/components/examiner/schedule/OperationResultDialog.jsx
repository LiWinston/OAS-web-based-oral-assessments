"use client";

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * OperationResultDialog
 * Modal dialog for showing success/error results for operations (assign/withdraw).
 */
export default function OperationResultDialog({
  open,
  onOpenChange,
  status = 'success', // 'success' | 'error' | 'warning'
  title,
  message,
  details = [], // array of strings
  autoDismiss = true,
  autoDismissMs = 1800,
  onAutoDismiss,
  primaryActionLabel = 'OK',
  onPrimaryAction,
}) {
  useEffect(() => {
    if (!open || !autoDismiss) return;
    const t = setTimeout(() => {
      onAutoDismiss?.();
      onOpenChange?.(false);
    }, autoDismissMs);
    return () => clearTimeout(t);
  }, [open, autoDismiss, autoDismissMs, onAutoDismiss, onOpenChange]);

  const iconClass = status === 'success'
    ? 'fas fa-check-circle text-green-600 dark:text-green-400'
    : status === 'warning'
      ? 'fas fa-exclamation-triangle text-amber-600 dark:text-amber-400'
      : 'fas fa-times-circle text-red-600 dark:text-red-400';

  const headerClass = status === 'success'
    ? 'text-green-800 dark:text-green-200'
    : status === 'warning'
      ? 'text-amber-800 dark:text-amber-200'
      : 'text-red-800 dark:text-red-200';

  const bodyClass = status === 'success'
    ? 'text-green-700 dark:text-green-300'
    : status === 'warning'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-red-700 dark:text-red-300';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={headerClass}>
            <span className="inline-flex items-center">
              <i className={`${iconClass} mr-2`}></i>
              {title}
            </span>
          </DialogTitle>
          {message && (
            <DialogDescription className={bodyClass}>{message}</DialogDescription>
          )}
        </DialogHeader>
        {Array.isArray(details) && details.length > 0 && (
          <ul className={`mt-2 list-disc pl-5 text-sm ${bodyClass}`}>
            {details.map((d, idx) => (
              <li key={idx}>{d}</li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              onPrimaryAction?.();
              onOpenChange?.(false);
            }}
          >
            {primaryActionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

