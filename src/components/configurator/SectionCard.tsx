export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-glow rounded-[16px] border border-border bg-gradient-to-br from-surface to-surface/80 p-7">
      <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.15em] text-text-secondary">
        {title}
      </h2>
      {children}
    </section>
  );
}
