import { GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

export function BrandSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-12 h-12 text-gray-900" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Select Your Learning Platform
          </h1>
          <p className="text-xl text-gray-300">
            Choose your brand to explore the learning ecosystem
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* RealTutorialHub */}
          <button
            onClick={() => navigate('/rth')}
            className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/20 hover:border-orange-400 hover:bg-white/20 transition-all text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              RealTutorialHub
            </h2>
            <p className="text-gray-300 mb-6">
              AI-powered learning platform with adaptive tutorials and smart remediation
            </p>
            <div className="space-y-2 mb-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                <span>Primary: Orange</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Secondary: Deep Blue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Guidance: AI Tutor</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-orange-400 font-semibold group-hover:gap-3 transition-all">
              <span>Explore Platform</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* SkillUp IT Academy */}
          <button
            onClick={() => navigate('/skillup')}
            className="group bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/20 hover:border-pink-400 hover:bg-white/20 transition-all text-left"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              SkillUp IT Academy
            </h2>
            <p className="text-gray-300 mb-6">
              Professional training with live mentorship and personalized learning paths
            </p>
            <div className="space-y-2 mb-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                <span>Primary: Bright Pink</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Secondary: Navy Blue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Guidance: Live Mentor</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-pink-400 font-semibold group-hover:gap-3 transition-all">
              <span>Explore Platform</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
