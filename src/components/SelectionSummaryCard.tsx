import { ReactNode } from 'react';

interface Props {
  label?: ReactNode;
  title: ReactNode;
  labelActions?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode[];
  children?: ReactNode;
}

export function SelectionSummaryCard({ label, title, labelActions, actions, meta = [], children }: Props) {
  return (
    <div className="setup-selection-card">
      <div className="setup-selection-card__header">
        <div>
          {label || labelActions ? (
            <div className="setup-selection-card__label-row">
              {label ? <span className="meta-label">{label}</span> : null}
              {labelActions ? <div className="setup-selection-card__label-actions">{labelActions}</div> : null}
            </div>
          ) : null}
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
