import { ArrowRight, Sparkles, Target, Brain } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

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
      <section className={`py-16 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
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
      <section className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6`}>
            <Sparkles className={`w-4 h-4 text-${accentClass}-400`} />
            <span className={`text-sm text-${accentClass}-300`}>Join Thousands of Successful Learners</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to Master Your Skills?
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Stop struggling with one-size-fits-all courses. Experience personalized, AI-powered learning 
            that adapts to your unique needs and accelerates your journey to mastery.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className={`group px-8 py-5 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo} text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3`}>
              <Target className="w-6 h-6" />
              <span className="text-lg font-semibold">Start with Exam Engine</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="group px-8 py-5 bg-white text-gray-900 rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
              <Brain className="w-6 h-6" />
              <span className="text-lg font-semibold">Explore Tutorial Engine</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
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
      <footer className="py-12 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Learning</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Exam Engine</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Tutorial Engine</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Projects</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© 2026 {brand.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}