

import { Skeleton } from "@/components/WhyUs/Skeleton";

const LearningPathSkeleton = () => {
  return (
    <section className="w-full min-h-screen py-10 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* -------- Header -------- */}
        <div className="text-center mb-16 max-w-4xl mx-auto space-y-6">
          <Skeleton height="h-10" width="w-2/3" className="mx-auto" />
          <Skeleton height="h-2" width="w-32" radius="rounded-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-5/6" className="mx-auto" />
        </div>

        {/* -------- Category Selector -------- */}
        <div className="hidden md:flex justify-center gap-4 mb-16">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              height="h-12"
              width="w-44"
              radius="rounded-xl"
            />
          ))}
        </div>

        {/* -------- Cards Grid -------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative w-full h-[650px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 flex flex-col"
            >
              {/* Module badge */}
              <div className="absolute top-6 right-6">
                <Skeleton width="w-14" height="h-14" radius="rounded-2xl" />
              </div>

              {/* Icon */}
              <div className="flex flex-col items-center justify-center flex-1 space-y-6">
                <Skeleton width="w-32" height="h-32" radius="rounded-3xl" />
                <Skeleton height="h-6" width="w-2/3" />
                <Skeleton height="h-4" width="w-3/4" />
              </div>

              {/* Explore button */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                <Skeleton height="h-4" width="w-40" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default LearningPathSkeleton;
