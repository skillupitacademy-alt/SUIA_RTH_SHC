

const NavbarSkeleton = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[999] bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 xl:px-0">
        <div className="flex items-center justify-between h-20 animate-pulse">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="h-5 w-40 bg-gray-200 rounded" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden xl:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-20 bg-gray-200 rounded" />
            ))}
          </div>

          {/* Right buttons */}
          <div className="hidden xl:flex items-center gap-4">
            <div className="h-9 w-24 bg-gray-300 rounded-lg" />
            <div className="h-9 w-28 bg-gray-200 rounded-lg" />
          </div>

          {/* Mobile menu icon */}
          <div className="xl:hidden">
            <div className="h-8 w-8 bg-gray-200 rounded-md" />
          </div>

        </div>
      </div>
    </nav>
  );
};

export default NavbarSkeleton;
