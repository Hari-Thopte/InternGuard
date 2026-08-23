export default function Loading() {
  return (
    <main className="grid min-h-[65vh] place-items-center" aria-live="polite">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="eyebrow mt-5">Opening investigation surface</p>
      </div>
    </main>
  );
}
