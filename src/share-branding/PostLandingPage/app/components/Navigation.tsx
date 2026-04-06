import { GraduationCap } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import { Link } from 'react-router';

export function Navigation() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';
  
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${brand.gradientFrom} ${brand.gradientTo} rounded-lg flex items-center justify-center`}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className={`text-2xl font-bold bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo} bg-clip-text text-transparent`}>
              {brand.name}
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#" className={`text-gray-600 hover:text-${accentClass}-600 transition-colors`}>
              Paths
            </a>
            <a href="#" className={`text-gray-600 hover:text-${accentClass}-600 transition-colors`}>
              Mentorship
            </a>
            <a href="#" className={`text-gray-600 hover:text-${accentClass}-600 transition-colors`}>
              Support
            </a>
            <button className={`px-6 py-2.5 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo} text-white rounded-lg hover:shadow-lg transition-all`}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}