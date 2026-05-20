/* Placeholder for sections that are planned but not built yet
   (Wiki, Builder). */

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="panel-gold max-w-md p-8 text-center">
        <div className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-gold">
          В разработке
        </div>
        <h1 className="mb-3 text-2xl">{title}</h1>
        <p className="text-sm leading-relaxed text-text-1">{description}</p>
        <div className="mt-6 h-1 w-full overflow-hidden rounded bg-border">
          <div className="h-full w-1/3 animate-pulse bg-gold" />
        </div>
      </div>
    </div>
  );
}
