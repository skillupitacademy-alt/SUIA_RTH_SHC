import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24 text-center">
      <h1 className="text-6xl max-w-4xl mx-auto mb-6">
        <span className="bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
          Master Your Skills with Enterprise-Grade Quizzes
        </span>
      </h1>

      <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
        Join thousands of professionals in 6 major domains. Experience adaptive
        difficulty and real-time analytics designed for growth.
      </p>

      <div className="flex items-center justify-center gap-4">
        <button className="px-8 py-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 shadow-lg">
          Get Started for Free
          <ArrowRight className="w-5 h-5" />
        </button>
        <button className="px-8 py-4 bg-white text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
          Login to Account
        </button>
      </div>
    </section>
  );
}
