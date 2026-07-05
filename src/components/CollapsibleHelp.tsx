import { ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  label?: ReactNode;
  children: ReactNode;
}

export function CollapsibleHelp({ title = 'Como funciona?', label, children }: Props) {
  return (
    <details className="collapsible-help">
      <summary>
        <span>{title}</span>
      </summary>
      <div className="collapsible-help__content">
        {label ? <span className="meta-label">{label}</span> : null}
        {children}
      </div>
    </details>
  );
}
