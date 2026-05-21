
import { Skeleton } from "@quiz/marketing-site/components/WhyUs/Skeleton";

export default function SkillsMainSkeleton() {
  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4">

        {/* -------- Header -------- */}
        <div className="text-center mb-12 lg:mb-16 max-w-4xl mx-auto space-y-6">
          <Skeleton height="h-8" width="w-2/3" className="mx-auto" />
          <Skeleton height="h-2" width="w-32" radius="rounded-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-5/6" className="mx-auto" />
        </div>

        {/* -------- Marquee Row 1 -------- */}
        <div className="mb-10 overflow-hidden">
          <div className="flex gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-28 h-28 rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center shadow-sm"
              >
                <Skeleton width="w-12" height="h-12" />
                <Skeleton height="h-4" width="w-16" className="mt-3" />
              </div>
            ))}
          </div>
        </div>

        {/* -------- Marquee Row 2 -------- */}
        <div className="overflow-hidden">
          <div className="flex gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-28 h-28 rounded-xl bg-white border border-gray-200 flex flex-col items-center justify-center shadow-sm"
              >
                <Skeleton width="w-12" height="h-12" />
                <Skeleton height="h-4" width="w-16" className="mt-3" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
