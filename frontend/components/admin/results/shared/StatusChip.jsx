export default function StatusChip({ status }) {
  const styles = {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: 'DRAFT' },
    SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'Ready' },
    RELEASED: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'RELEASED' },
    REOPENED: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'Under Review' },
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: 'PENDING' },
  };
  const style = styles[status] || styles.DRAFT;
  const label = style.label || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {label}
    </span>
  );
}

