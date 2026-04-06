import { ArrowRight, Target, Brain } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import dashboardImage from 'figma:asset/c4f1a4d51a48d5b5d3c8d47174d5e5571a3d1273.png';

export function HeroSection() {
  const brand = useBrand();
  const accentClass = brand.accentColor === 'orange' ? 'orange' : 'pink';
  
  return (
    <section className={`relative min-h-screen bg-gradient-to-br from-white via-${accentClass}-50/30 to-white overflow-hidden`}>
      {/* Decorative Background Elements */}
      <div className={`absolute top-20 right-10 w-32 h-32 bg-${accentClass}-200 rounded-full blur-3xl opacity-30`}></div>
      <div className="absolute bottom-40 left-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
      <div className={`absolute top-1/2 right-1/3 w-2 h-2 bg-${accentClass}-400 rounded-full`}></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-blue-400 rounded-full"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-20 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${accentClass}-100 rounded-full`}>
              <span className={`w-2 h-2 bg-${accentClass}-500 rounded-full animate-pulse`}></span>
              <span className={`text-sm text-${accentClass}-700`}>
                {brand.accentColor === 'orange' ? 'AI-Powered Learning Platform' : 'Live Mentor-Guided Learning'}
              </span>
            </div>
            
            <h1 className="text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                MASTERY
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                BEGINS HERE
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              Choose Your Learning Engine: Exam or Tutorial?
            </p>
            
            <p className="text-lg text-gray-500 leading-relaxed">
              Take strict diagnostic assessments in the Exam Engine to identify your exact knowledge bounds, 
              then jump into guided tutorial sessions with your {brand.tutorLabel}.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className={`group px-8 py-4 bg-gradient-to-r ${brand.gradientFrom} ${brand.gradientTo} text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3`}>
                <Target className="w-5 h-5" />
                <span className="font-semibold">Enter Exam Engine</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="group px-8 py-4 bg-white border-2 border-blue-900 text-blue-900 rounded-xl hover:bg-blue-900 hover:text-white hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                <Brain className="w-5 h-5" />
                <span className="font-semibold">Enter Tutorial Engine</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Right Dashboard Mockup */}
          <div className="relative">
            <img 
              src={dashboardImage} 
              alt={`${brand.name} Dashboard`}
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}