'use client';

export default function ReportsLayout({ breadcrumb, hero, controlBar, sideRail, children }) {
  return (
    <div className="space-y-6">
      {breadcrumb}
      {hero}
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {sideRail && (
          <aside className="space-y-4 order-last xl:order-first">
            {sideRail}
          </aside>
        )}
        <section className="space-y-6">
          {controlBar}
          {children}
        </section>
      </div>
    </div>
  );
}

