export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="page-shell">
      <section className="surface-card empty-state">
        <p className="eyebrow">Em construção</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
    </main>
  );
}
