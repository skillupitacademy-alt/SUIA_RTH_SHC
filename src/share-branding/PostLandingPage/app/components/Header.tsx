import { ArrowRight } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl tracking-tight">
            <span className="text-pink-600">QUIZ</span>
            <span className="text-gray-900">PLATFORM</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-gray-700 hover:text-gray-900 flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Login
          </button>
          <button className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}
