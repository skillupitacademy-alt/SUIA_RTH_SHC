import { ArrowRight, Sparkles, Target, Brain } from 'lucide-react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';

export function FinalCTA() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';

  const stats = [
    { number: "10,000+", label: "Active Learners" },
    { number: "500+", label: "Tutorial Modules" },
    { number: "95%", label: "Success Rate" },
    { number: "24/7", label: brand.accentColor === 'orange' ? "AI Support" : "Mentor Support" }
  ];

  return (
    <>
      {/* Stats Section */}
      <section aria-label="Performance Statistics" className={`py-16 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo}`}>
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div 
                  className="font-bold text-white mb-2"
                  style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)' }}
                >
                  {stat.number}
                </div>
                <div className="text-orange-100 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section aria-label="Final Call to Action" className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-24 text-white">
        {/* Decorative Elements */}
        <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 max-w-full rounded-full bg-orange-500/20 blur-3xl"></div>
        <div className="pointer-events-none absolute bottom-20 left-0 h-64 w-64 max-w-full rounded-full bg-blue-500/20 blur-3xl"></div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6`}>
            <Sparkles className={`w-4 h-4 text-${accentClass}-400`} />
            <span className={`text-xs sm:text-sm text-${accentClass}-300`}>Join Thousands of Successful Learners</span>
          </div>

          <h2 
            className="font-bold mb-4 md:mb-5 leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.08 }}
          >
            Ready to Master Your Skills?
          </h2>

          <p className="text-base md:text-xl text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Stop struggling with one-size-fits-all courses. Experience personalized, AI-powered learning
            that adapts to your unique needs and accelerates your journey to mastery.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
            <button 
              aria-label="Start your journey with the Exam Engine"
              className={`group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r px-6 py-4 text-white shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl sm:w-auto sm:px-8 sm:py-5 ${brand.gradientFrom} ${brand.gradientTo}`}
            >
              <Target className="w-5 sm:w-6 h-5 sm:h-6" />
              <span className="text-base sm:text-lg font-semibold">Start with Exam Engine</span>
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              aria-label="Explore the Tutorial Engine for personalized learning"
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 text-gray-900 shadow-2xl transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] sm:w-auto sm:px-8 sm:py-5"
            >
              <Brain className="w-5 sm:w-6 h-5 sm:h-6" />
              <span className="text-base sm:text-lg font-semibold">Explore Tutorial Engine</span>
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>14-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer role="contentinfo" className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" aria-label="Product Features" className="hover:text-orange-400 transition-colors">Features</a></li>
                <li><a href="#" aria-label="Pricing and Plans" className="hover:text-orange-400 transition-colors">Pricing</a></li>
                <li><a href="#" aria-label="Development Roadmap" className="hover:text-orange-400 transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Learning</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" aria-label="Exam Engine Overview" className="hover:text-orange-400 transition-colors">Exam Engine</a></li>
                <li><a href="#" aria-label="Tutorial Engine Overview" className="hover:text-orange-400 transition-colors">Tutorial Engine</a></li>
                <li><a href="#" aria-label="Our Projects" className="hover:text-orange-400 transition-colors">Projects</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" aria-label="About Us" className="hover:text-orange-400 transition-colors">About</a></li>
                <li><a href="#" aria-label="Our Blog" className="hover:text-orange-400 transition-colors">Blog</a></li>
                <li><a href="#" aria-label="Careers at our company" className="hover:text-orange-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" aria-label="Help Center" className="hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" aria-label="Contact Us" className="hover:text-orange-400 transition-colors">Contact</a></li>
                <li><a href="#" aria-label="Terms of Service" className="hover:text-orange-400 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 {brand.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
