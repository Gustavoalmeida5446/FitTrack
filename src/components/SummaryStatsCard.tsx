import { Tile } from '@carbon/react';
import { ReactNode } from 'react';

interface SummaryStatItem {
  label: ReactNode;
  value: ReactNode;
}

interface Props {
  className?: string;
  items: SummaryStatItem[];
}

export function SummaryStatsCard({ className = '', items }: Props) {
  return (
    <Tile className={`card metric-card ${className}`.trim()}>
      <div className="metric-row summary-stats-card__row">
        {items.map((item, index) => (
          <div key={index}>
            <span className="meta-label">{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </Tile>
  );
}
