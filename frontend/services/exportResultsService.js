// Mock-first export service with graceful fallback to print

const USE_SERVER_EXPORT = (process.env.NEXT_PUBLIC_ENABLE_SERVER_PDF ?? 'false') === 'true';

export const exportResultsService = {
  async exportResultToPDF({ studentId, assignmentId }) {
    try {
      if (USE_SERVER_EXPORT) {
        // Placeholder: call server route when implemented
        const res = await fetch('/api/export/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, assignmentId }),
        });
        if (!res.ok) throw new Error(`Server export failed: ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `result-${assignmentId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('[exportResultsService] Server export unavailable, falling back to print:', e?.message || e);
    }
    // Fallback: open native print dialog (user can save as PDF)
    window.print();
  },
};

