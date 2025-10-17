"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/hooks/useNotification";
import { cn } from "@/lib/utils";

export default function BookingShareFallbackDialog({
  open,
  onOpenChange,
  details,
}) {
  const { showNotification } = useNotification();

  const handleCopy = useCallback(
    async (value, label) => {
      if (!value) return;
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          showNotification("success", `${label} copied`);
          return;
        }
      } catch (err) {
        console.warn("Clipboard copy failed", err);
      }
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showNotification("success", `${label} copied`);
      } catch (err) {
        console.warn("Legacy copy failed", err);
        showNotification(
          "error",
          `Unable to copy ${label.toLowerCase()}. Please copy manually.`
        );
      }
    },
    [showNotification]
  );

  const handleOpenMail = useCallback(() => {
    if (!details?.mailto) {
      showNotification("error", "Email link unavailable");
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = details.mailto;
    }
  }, [details?.mailto, showNotification]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share booking via email</DialogTitle>
          <DialogDescription>
            We downloaded the calendar invite{" "}
            <span className="font-medium">
              {details?.fileName || "assessment-booking.ics"}
            </span>
            . Attach it to your email after copying the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-dashed border-blue-200 bg-blue-50/80 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              Steps
            </p>
            <ol className="ml-4 mt-2 list-decimal space-y-1 text-blue-900 dark:text-blue-100">
              <li>Open your email client.</li>
              <li>Paste the subject and message from below.</li>
              <li>
                Attach{" "}
                <span className="font-semibold">
                  {details?.fileName || "assessment-booking.ics"}
                </span>{" "}
                to the email.
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Email subject
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopy(details?.subject || "", "Subject")
                }
              >
                Copy subject
              </Button>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3 font-mono text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              {details?.subject || "Assessment booking"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Email message
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(details?.body || "", "Message")
                  }
                >
                  Copy message
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      `${details?.subject || ""}\n\n${details?.body || ""}`,
                      "Subject and message"
                    )
                  }
                >
                  Copy all
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={details?.body || ""}
              className={cn(
                "w-full min-h-[160px] resize-none rounded-md border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              )}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenMail}
            className="w-full sm:w-auto"
          >
            Open default email app
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
