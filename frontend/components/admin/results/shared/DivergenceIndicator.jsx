import { AlertTriangle } from 'lucide-react';

export default function DivergenceIndicator({ assessments }) {
  if (!assessments || assessments.length < 2) return null;
  const scores = assessments
    .filter(a => a.examinerScorePct1dp !== undefined)
    .map(a => a.examinerScorePct1dp);
  if (scores.length < 2) return null;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const divergence = max - min;
  if (divergence < 5) return null;

  const getColorClass = () => {
    if (divergence < 10) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`flex items-center gap-1 ${getColorClass()}`} title={`Examiner score divergence: ${divergence.toFixed(1)}%`}>
      {divergence > 10 && <AlertTriangle className="w-4 h-4" />}
      <span className="text-sm">±{divergence.toFixed(1)}%</span>
    </div>
  );
}

