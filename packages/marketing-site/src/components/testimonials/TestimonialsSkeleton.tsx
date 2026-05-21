

import { Skeleton } from "@quiz/marketing-site/components/WhyUs/Skeleton";

const TestimonialSkeleton = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* -------- Header -------- */}
        <div className="text-center mb-16 max-w-4xl mx-auto space-y-6">
          <Skeleton height="h-10" width="w-2/3" className="mx-auto" />
          <Skeleton height="h-2" width="w-32" radius="rounded-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-5/6" className="mx-auto" />
        </div>

        {/* -------- Cards Grid -------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="relative bg-white rounded-2xl border border-gray-200 p-8 h-full flex flex-col shadow-2xl"
            >
              {/* Top section */}
              <div className="mb-8">
                <Skeleton width="w-16" height="h-16" radius="rounded-xl" />
                <div className="mt-6 flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} width="w-5" height="h-5" radius="rounded" />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="flex-grow space-y-4 mb-6">
                <Skeleton height="h-4" width="w-full" />
                <Skeleton height="h-4" width="w-full" />
                <Skeleton height="h-4" width="w-5/6" />
              </div>

              {/* Highlight badge */}
              <Skeleton height="h-8" width="w-40" radius="rounded-full" />

              {/* Footer */}
              <div className="pt-6 border-t border-gray-100 mt-auto space-y-2">
                <Skeleton height="h-5" width="w-1/2" />
                <Skeleton height="h-4" width="w-2/3" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TestimonialSkeleton;
