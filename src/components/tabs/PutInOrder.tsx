"use client";

// The activity itself is a self-contained HTML page in /public (story-order.html):
// drag-to-order sentences, Lower/Upper levels, self-check. We embed it so the
// menu can open it like any other tab without re-implementing the drag logic.
export default function PutInOrder() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center">
      <div className="w-full overflow-hidden rounded-3xl bg-white shadow-lg ring-4 ring-white/60 dark:bg-zinc-900">
        <iframe
          src="/story-order.html"
          title="Put the Story in Order"
          className="h-[80dvh] w-full border-0"
        />
      </div>
    </div>
  );
}
