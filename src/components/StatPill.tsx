import { ReactNode } from 'react';

interface Props {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}

export function StatPill({ label, value, className = 'stat-pill' }: Props) {
  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
