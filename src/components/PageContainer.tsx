import { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageContainer({ title, subtitle, actions, children }: Props) {
  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </header>
      <section className="page-content">{children}</section>
    </main>
  );
}
