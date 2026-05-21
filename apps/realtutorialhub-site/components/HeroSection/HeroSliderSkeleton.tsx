


export default function HeroSliderSkeleton() {
  return (
    <section className="relative w-full h-screen overflow-hidden animate-pulse bg-gray-100">
      {/* Soft background */}
      <div className="absolute inset-0 bg-gray-100" />

      {/* MOBILE */}
      <div className="md:hidden relative h-full flex flex-col items-center justify-center px-6 mt-5">
        {/* Image */}
        <div className="w-full max-w-lg mb-8">
          <div className="w-full h-64 bg-gray-200 rounded-2xl" />
        </div>

        {/* Text */}
        <div className="w-full max-w-2xl text-center space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />

          {/* Buttons */}
          <div className="flex flex-col gap-4 mt-6">
            <div className="h-12 bg-gray-300 rounded-lg" />
            <div className="h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex relative h-full items-center justify-between px-12 lg:px-24">
        {/* Left */}
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          <div className="h-8 w-48 bg-gray-200 rounded-full" />

          {/* Title */}
          <div className="h-14 bg-gray-200 rounded w-full" />
          <div className="h-14 bg-gray-200 rounded w-5/6" />

          {/* Subtitle */}
          <div className="h-5 bg-gray-300 rounded w-3/4" />

          {/* Buttons */}
          <div className="flex gap-4 mt-6">
            <div className="h-12 w-40 bg-gray-300 rounded-lg" />
            <div className="h-12 w-40 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Right image */}
        <div className="w-1/2 h-full flex items-center justify-end">
          <div className="w-full h-[400px] bg-gray-200 rounded-3xl" />
        </div>
      </div>

      {/* Slide Indicator */}
      <div className="absolute bottom-2 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full ${
              i === 0 ? "w-12 bg-gray-300" : "w-2 bg-gray-300/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
