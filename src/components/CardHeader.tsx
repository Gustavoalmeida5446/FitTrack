import { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  accent?: 'primary' | 'purple';
  trailing?: ReactNode;
}

export function CardHeader({
  icon,
  title,
  description,
  accent = 'primary',
  trailing
}: Props) {
  return (
    <div className="card-head">
      <div className="card-head__group">
        <div className={`icon-badge icon-badge--${accent} card-head__badge`}>
          {icon}
        </div>
        <div className="card-head__title">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {trailing}
    </div>
  );
}
