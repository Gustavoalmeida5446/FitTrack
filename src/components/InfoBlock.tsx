import { ReactNode } from 'react';

interface Props {
  label?: ReactNode;
  children: ReactNode;
}

export function InfoBlock({ label, children }: Props) {
  return (
    <div className="info-block">
      {label ? <span className="meta-label">{label}</span> : null}
      <p>{children}</p>
    </div>
  );
}
