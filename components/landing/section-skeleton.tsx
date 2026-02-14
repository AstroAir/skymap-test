export function SectionSkeleton() {
  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 mb-16">
          <div className="h-8 w-64 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-5 w-96 max-w-full bg-muted/30 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-40 bg-muted/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
