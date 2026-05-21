

import { Skeleton } from "@/components/WhyUs/Skeleton";

const ContactSkeleton = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* -------- Header -------- */}
        <div className="text-center mb-16 max-w-4xl mx-auto space-y-6">
          <Skeleton height="h-10" width="w-2/3" className="mx-auto" />
          <Skeleton height="h-2" width="w-32" radius="rounded-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-full" className="mx-auto" />
          <Skeleton height="h-5" width="w-5/6" className="mx-auto" />
        </div>

        {/* -------- Grid -------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* LEFT COLUMN – Contact Info */}
          <div className="space-y-6">
            {/* Get in Touch card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
              <Skeleton height="h-6" width="w-40" />

              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200"
                >
                  <Skeleton width="w-10" height="h-10" radius="rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton height="h-4" width="w-32" />
                    <Skeleton height="h-4" width="w-48" />
                  </div>
                </div>
              ))}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Skeleton height="h-12" width="w-full" />
                <Skeleton height="h-12" width="w-full" />
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <Skeleton height="h-5" width="w-32" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton height="h-4" width="w-24" />
                  <Skeleton height="h-4" width="w-28" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN – Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 space-y-6">
              <Skeleton height="h-6" width="w-40" />

              <Skeleton height="h-12" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Skeleton height="h-12" />
                <Skeleton height="h-12" />
              </div>
              <Skeleton height="h-24" />
              <Skeleton height="h-12" />
            </div>

            {/* Location card */}
            <div className="bg-gray-100 rounded-xl p-5 space-y-3">
              <Skeleton height="h-5" width="w-32" />
              <Skeleton height="h-4" width="w-full" />
              <Skeleton height="h-4" width="w-5/6" />
              <Skeleton height="h-4" width="w-40" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ContactSkeleton;
