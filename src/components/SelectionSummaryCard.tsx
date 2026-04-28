import { ReactNode } from 'react';

interface Props {
  label?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode[];
  children?: ReactNode;
}

export function SelectionSummaryCard({ label, title, actions, meta = [], children }: Props) {
  return (
    <div className="setup-selection-card">
      <div className="setup-selection-card__header">
        <div>
          {label ? <span className="meta-label">{label}</span> : null}
          <p>{title}</p>
        </div>
        {actions ? <div className="inline-actions">{actions}</div> : null}
      </div>
      {meta.length > 0 ? (
        <div className="setup-selection-card__meta">
          {meta.map((item, index) => <span key={index}>{item}</span>)}
        </div>
      ) : null}
      {children}
    </div>
  );
}
