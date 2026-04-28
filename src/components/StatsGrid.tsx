import { ReactNode } from 'react';
import { StatPill } from './StatPill';

interface StatsGridItem {
  label: ReactNode;
  value: ReactNode;
}

interface Props {
  className?: string;
  items: StatsGridItem[];
}

export function StatsGrid({ className = '', items }: Props) {
  return (
    <div className={className.trim()}>
      {items.map((item, index) => (
        <StatPill key={index} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
