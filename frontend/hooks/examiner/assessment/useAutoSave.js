"use client";

import { useEffect, useRef, useState } from "react";

// Generic debounced autosave hook
// Params:
// - enabled: boolean
// - deps: object used to detect changes to save (fingerprint)
// - buildPayload: () => payload
// - saveDraft: mutation function (returns promise), e.g., mutateAsync
// - onSaved: (result) => void (optional)
export function useAutoSave({ enabled, deps, buildPayload, saveDraft, onSaved, delay = 3000 }) {
  const [status, setStatus] = useState("saved"); // 'saving' | 'saved' | 'error'
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear previous timer
    if (timer.current) clearTimeout(timer.current);

    setStatus("saving");
    timer.current = setTimeout(async () => {
      try {
        const payload = buildPayload();
        const res = await saveDraft(payload);
        setStatus("saved");
        onSaved && onSaved(res);
      } catch (e) {
        setStatus("error");
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(deps)]);

  return { status };
}

