'use client';

export default function ExaminerChip({ name = 'Examiner', className = '' }) {
  const initial = (name || 'E').charAt(0).toUpperCase();
  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      title={name}
      aria-label={`Examiner ${name}`}
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold flex items-center justify-center">
        {initial}
      </div>
      <span className="text-xs text-gray-700 dark:text-gray-300 hidden sm:inline">{name}</span>
    </div>
  );
}

