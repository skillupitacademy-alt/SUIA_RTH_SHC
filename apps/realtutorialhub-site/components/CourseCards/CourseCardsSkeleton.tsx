

import { Skeleton } from "@/components/WhyUs/Skeleton";

const CourseCardsSkeleton = () => {
  return (
    <section className="py-20 font-montserrat">
      <div className="w-full max-w-screen-xl mx-auto px-6 lg:px-8 xl:px-12">

        {/* Header skeleton */}
        <div className="text-center mb-16 max-w-4xl mx-auto space-y-6">
          <Skeleton height="h-10" width="w-2/3" className="mx-auto" />
          <Skeleton height="h-2" width="w-32" radius="rounded-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-5/6" className="mx-auto" />

          {/* Filter buttons skeleton */}
          <div className="hidden md:flex justify-center gap-3 mt-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                height="h-10"
                width="w-28"
                radius="rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col min-h-[520px]"
            >
              {/* Image header */}
              <Skeleton height="h-48" />

              {/* Divider */}
              <Skeleton height="h-1" />

              {/* Content */}
              <div className="p-6 space-y-4 flex-1">
                <Skeleton height="h-10" width="w-12" radius="rounded-xl" />
                <Skeleton height="h-6" width="w-3/4" />
                <Skeleton height="h-4" width="w-full" />
                <Skeleton height="h-4" width="w-5/6" />

                <Skeleton height="h-px" />

                {/* Feature list */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} height="h-4" />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 space-y-3 border-t">
                <div className="flex gap-3">
                  <Skeleton height="h-12" width="w-full" />
                  <Skeleton height="h-12" width="w-full" />
                </div>
                <Skeleton height="h-4" width="w-full" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CourseCardsSkeleton;
