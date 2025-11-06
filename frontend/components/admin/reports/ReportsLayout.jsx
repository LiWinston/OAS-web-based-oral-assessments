'use client';

export default function ReportsLayout({ breadcrumb, hero, controlBar, sideRail, children }) {
  const hasSideRail = Boolean(sideRail);

  return (
    <div className="space-y-6">
      {breadcrumb}
      {hero}
      {hasSideRail ? (
        <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
          <aside className="order-last space-y-4 xl:order-first">
            {sideRail}
          </aside>
          <section className="space-y-6">
            {controlBar}
            {children}
          </section>
        </div>
      ) : (
        <section className="space-y-6">
          {controlBar}
          {children}
        </section>
      )}
    </div>
  );
}
