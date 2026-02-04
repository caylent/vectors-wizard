export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-5 text-sm font-medium uppercase tracking-wider text-text-secondary">
        {title}
      </h2>
      {children}
    </section>
  );
}
